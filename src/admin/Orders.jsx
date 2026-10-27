import { useEffect, useState, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase.js';
import { formatNaira } from '../lib/format.js';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'new', 'confirmed', 'completed'
  
  // Audio ref for the notification sound
  const audioRef = useRef(null);

  useEffect(() => {
    // 1. Fetch initial orders
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error) setOrders(data || []);
      setLoading(false);
    };
    
    fetchOrders();

    // 2. Listen for Realtime inserts
    const channel = supabase
      .channel('live-orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        setOrders((prev) => [payload.new, ...prev]);
        
        // Play sound on new order
        if (audioRef.current) {
          audioRef.current.play().catch(e => console.log('Audio play blocked by browser until user clicks', e));
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
        setOrders((prev) => prev.map(o => o.id === payload.new.id ? payload.new : o));
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const updateStatus = async (id, newStatus) => {
    setOrders((prev) => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    await supabase.from('orders').update({ status: newStatus }).eq('id', id);
  };

  // --- METRICS CALCULATION ---
  const metrics = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todaysOrders = orders.filter(o => o.created_at.startsWith(today));
    
    const revenue = todaysOrders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.total, 0);
      
    const pending = todaysOrders.filter(o => o.status === 'new').length;

    return {
      revenue,
      total: todaysOrders.length,
      pending
    };
  }, [orders]);

  // --- FILTERING ---
  const filteredOrders = useMemo(() => {
    if (filter === 'all') return orders;
    return orders.filter(o => o.status === filter);
  }, [orders, filter]);

  if (loading) return <div className="p-8 text-center">Loading orders...</div>;

  return (
    <div className="space-y-6">
      {/* Hidden audio element for notifications */}
      <audio ref={audioRef} src="https://actions.google.com/sounds/v1/alarms/beep_short.ogg" preload="auto" />

      {/* METRICS BAR */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-night-surface p-4 rounded-xl border border-cream-line dark:border-night-line shadow-sm text-center">
          <p className="text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1">Today's Revenue</p>
          <p className="font-display font-bold text-xl text-brand-600 dark:text-brand-400">{formatNaira(metrics.revenue)}</p>
        </div>
        <div className="bg-white dark:bg-night-surface p-4 rounded-xl border border-cream-line dark:border-night-line shadow-sm text-center">
          <p className="text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1">Total Orders</p>
          <p className="font-display font-bold text-xl text-ink dark:text-cream">{metrics.total}</p>
        </div>
        <div className="bg-white dark:bg-night-surface p-4 rounded-xl border border-cream-line dark:border-night-line shadow-sm text-center">
          <p className="text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1">Pending</p>
          <p className="font-display font-bold text-xl text-orange-500">{metrics.pending}</p>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
        {['all', 'new', 'confirmed', 'completed'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-full text-xs font-bold capitalize whitespace-nowrap transition-colors ${
              filter === tab 
                ? 'bg-brand-600 text-white shadow-md' 
                : 'bg-white dark:bg-night-surface text-ink-muted border border-cream-line dark:border-night-line'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ORDERS LIST */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center p-8 bg-white dark:bg-night-surface rounded-2xl text-ink-muted border border-cream-line dark:border-night-line">
            No {filter !== 'all' ? filter : ''} orders found.
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isNew = order.status === 'new';
            const shortId = order.id.split('-')[0].toUpperCase();

            return (
              <div 
                key={order.id} 
                className={`bg-white dark:bg-night-surface rounded-2xl p-4 shadow-sm border transition-all ${
                  isNew ? 'border-brand-500 ring-2 ring-brand-500/20' : 'border-cream-line dark:border-night-line'
                }`}
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-3 border-b border-cream-line dark:border-night-line pb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg">{order.customer_name}</h3>
                      <span className="text-[10px] bg-cream-soft dark:bg-night-line px-2 py-0.5 rounded text-ink-muted font-mono">
                        #{shortId}
                      </span>
                    </div>
                    <a href={`tel:${order.phone}`} className="text-sm text-brand-600 font-semibold hover:underline">
                      {order.phone}
                    </a>
                    <p className="text-[10px] text-ink-muted mt-1">
                      {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-brand-600 text-xl">{formatNaira(order.total)}</p>
                    <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide
                      ${order.status === 'new' ? 'bg-blue-100 text-blue-700' : ''}
                      ${order.status === 'confirmed' ? 'bg-orange-100 text-orange-700' : ''}
                      ${order.status === 'completed' ? 'bg-green-100 text-green-700' : ''}
                      ${order.status === 'cancelled' ? 'bg-red-100 text-red-700' : ''}
                    `}>
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  <div>
                    <p className="text-[10px] font-bold text-ink-muted uppercase mb-2">Items</p>
                    <ul className="space-y-1.5">
                      {order.items.map((item, idx) => (
                        <li key={idx} className="text-sm leading-tight">
                          <span className="font-semibold">{item.quantity}x {item.name}</span>
                          {item.size && <span className="text-ink-muted"> ({item.size})</span>}
                          {item.options && <p className="text-[11px] text-ink-muted mt-0.5">└ {item.options}</p>}
                          {item.note && <p className="text-[11px] text-brand-600 mt-0.5">└ Note: {item.note}</p>}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-cream-soft dark:bg-night-line p-3 rounded-xl text-sm">
                    <p className="text-[10px] font-bold text-ink-muted uppercase mb-1">Delivery Info</p>
                    <p className="capitalize font-semibold mb-1">{order.mode}</p>
                    {order.mode === 'delivery' && (
                      <>
                        <p className="text-xs"><strong>Loc:</strong> {order.location}</p>
                        {order.delivery_landmark && <p className="text-xs"><strong>Landmark:</strong> {order.delivery_landmark}</p>}
                        <p className="text-xs mt-1"><strong>Time:</strong> {order.delivery_type} {order.scheduled_time && `(${order.scheduled_time})`}</p>
                      </>
                    )}
                    {order.recipient_name && (
                      <div className="mt-2 pt-2 border-t border-cream-line dark:border-night-line">
                        <p className="text-[10px] font-bold text-brand-600">Gift for:</p>
                        <p className="text-xs">{order.recipient_name} ({order.recipient_phone})</p>
                      </div>
                    )}
                    {order.notes && <p className="text-xs mt-2 italic text-brand-600">" {order.notes} "</p>}
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex gap-2">
                  {order.status === 'new' && (
                    <button onClick={() => updateStatus(order.id, 'confirmed')} className="flex-1 bg-orange-500 text-white py-2 rounded-lg font-bold text-xs hover:bg-orange-600 transition-colors">
                      Accept & Confirm
                    </button>
                  )}
                  {order.status === 'confirmed' && (
                    <button onClick={() => updateStatus(order.id, 'completed')} className="flex-1 bg-green-500 text-white py-2 rounded-lg font-bold text-xs hover:bg-green-600 transition-colors">
                      Mark as Completed
                    </button>
                  )}
                  {order.status === 'new' || order.status === 'confirmed' ? (
                    <button onClick={() => updateStatus(order.id, 'cancelled')} className="px-4 bg-red-50 text-red-600 py-2 rounded-lg font-bold text-xs hover:bg-red-100 transition-colors border border-red-200">
                      Cancel
                    </button>
                  ) : (
                    <button onClick={() => updateStatus(order.id, 'new')} className="flex-1 bg-cream-soft dark:bg-night-line text-ink-muted py-2 rounded-lg font-bold text-xs hover:bg-cream-line transition-colors">
                      Revert to New
                    </button>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>
    </div>
  );
}