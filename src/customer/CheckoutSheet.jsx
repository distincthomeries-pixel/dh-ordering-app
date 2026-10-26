import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import { formatNaira } from '../lib/format.js';
import { useCart } from '../context/CartContext.jsx';

export default function CheckoutSheet({ onClose, settings }) {
  const { cart, cartTotal, clearCart } = useCart();
  
  const [zones, setZones] = useState([]);
  const [isLoadingZones, setIsLoadingZones] = useState(true);
  const [selectedZone, setSelectedZone] = useState(null);
  
  // Search state for the location
  const [locationQuery, setLocationQuery] = useState('');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  const [name, setName] = useState(() => localStorage.getItem('dh_name') || '');
  const [phone, setPhone] = useState(() => localStorage.getItem('dh_phone') || '');
  const [mode, setMode] = useState('pickup');
  const [notes, setNotes] = useState('');
  const [landmark, setLandmark] = useState('');
  
  const [deliveryType, setDeliveryType] = useState('now'); 
  const [scheduledTime, setScheduledTime] = useState('');
  
  const [isForFriend, setIsForFriend] = useState(false);
  const [friendName, setFriendName] = useState('');
  const [friendPhone, setFriendPhone] = useState('');

  const [packSize, setPackSize] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Fetch Delivery Zones on mount
  useEffect(() => {
    supabase.from('delivery_zones').select('*').order('sort_order')
      .then(({ data, error }) => {
        if (data) setZones(data);
        setIsLoadingZones(false);
      });
  }, []);

  // Filter zones based on what is typed
  const filteredZones = zones.filter(z => 
    z.name.toLowerCase().includes(locationQuery.toLowerCase()) ||
    z.group_name.toLowerCase().includes(locationQuery.toLowerCase())
  );

  // Group the filtered zones for display
  const groupedZones = filteredZones.reduce((acc, zone) => {
    if (!acc[zone.group_name]) acc[zone.group_name] = [];
    acc[zone.group_name].push(zone);
    return acc;
  }, {});

  const handleSelectLocation = (zone) => {
    setSelectedZone(zone);
    setLocationQuery(zone.name); 
    setShowLocationDropdown(false); 
  };

  const handleLocationInputChange = (e) => {
    setLocationQuery(e.target.value);
    setSelectedZone(null); 
    setShowLocationDropdown(true);
  };

  const deliveryFee = mode === 'delivery' && selectedZone ? selectedZone.fee : 0;

  // Takeout Pack Logic
  let totalPackQty = 0;
  let needsPack = false;
  cart.forEach(c => {
    const isCustom = ['Rice', 'Swallow', 'Others', 'Proteins'].includes(c.item.subsection || '');
    if (isCustom) { totalPackQty += c.quantity; needsPack = true; }
  });
  const autoSize = totalPackQty > 3 ? 'L' : 'S';
  let finalPackFee = needsPack ? (packSize === 'L' || (!packSize && autoSize === 'L') ? settings.takeout_pack_fee_large : settings.takeout_pack_fee_small) : 0;
  let finalPackSize = needsPack ? (packSize || autoSize) : null;

  const grandTotal = cartTotal + deliveryFee + finalPackFee;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return alert("Please enter your Name and Phone Number.");
    if (mode === 'delivery' && !selectedZone) return alert("Please select a location from the dropdown.");
    if (deliveryType === 'scheduled' && !scheduledTime) return alert("Please pick a scheduled time.");
    if (isForFriend && (!friendName || !friendPhone)) return alert("Please fill in your friend's details.");

    setLoading(true);
    localStorage.setItem('dh_name', name);
    localStorage.setItem('dh_phone', phone);

    const orderItems = cart.map(c => ({
      id: c.item.id, name: c.item.name, size: c.size?.label, options: c.options?.map(o => o.label).join(', '),
      quantity: c.quantity, price: c.size ? c.size.price : c.item.price, note: c.note
    }));

    const orderData = {
      customer_name: name, phone: phone, mode: mode,
      location: mode === 'delivery' ? selectedZone.name : null,
      delivery_landmark: mode === 'delivery' ? landmark : null,
      notes: notes, items: orderItems, subtotal: cartTotal, delivery_fee: deliveryFee,
      takeout_pack_fee: finalPackFee, pack_size: finalPackSize, total: grandTotal, status: 'new',
      recipient_name: isForFriend ? friendName : null, recipient_phone: isForFriend ? friendPhone : null,
      delivery_type: deliveryType, scheduled_time: deliveryType === 'scheduled' ? scheduledTime : null
    };

    const { error } = await supabase.from('orders').insert([orderData]);
    if (error) { alert('Failed to save order.'); setLoading(false); return; }

    let msg = `*Hello Distinct Homeries!* 👋\nI'd like to place an order:\n\n`;
    cart.forEach(c => {
      msg += `*${c.quantity}x ${c.item.name}* (${formatNaira((c.size ? c.size.price : c.item.price) * c.quantity)})\n`;
      if (c.size) msg += `   └ Size: ${c.size.label}\n`;
      if (c.options) c.options.forEach(opt => msg += `   └ ${opt.label}\n`);
      if (c.note) msg += `   └ Note: ${c.note}\n`;
    });

    msg += `\n------------------------\n`;
    msg += `Subtotal: ${formatNaira(cartTotal)}\n`;
    if (finalPackFee > 0) msg += `Pack (${finalPackSize}): ${formatNaira(finalPackFee)}\n`;
    if (deliveryFee > 0) msg += `Delivery: ${formatNaira(deliveryFee)}\n`;
    msg += `*TOTAL: ${formatNaira(grandTotal)}*\n\n`;
    
    msg += `*Order Details:*\nMode: ${mode === 'pickup' ? 'Pickup' : 'Delivery'}\n`;
    if (mode === 'delivery') {
      msg += `Location: ${selectedZone.name}\n`;
      if (landmark) msg += `Landmark: ${landmark}\n`;
    }
    if (deliveryType === 'scheduled') msg += `Scheduled For: ${scheduledTime}\n`;
    if (isForFriend) msg += `\n*Deliver To Friend:*\nName: ${friendName}\nPhone: ${friendPhone}\n`;
    
    msg += `\n*Buyer Details:*\nName: ${name}\nPhone: ${phone}\n`;
    if (notes) msg += `Order Note: ${notes}\n`;

    clearCart();
    setSuccess(true);
    setLoading(false);
    setTimeout(() => window.open(`https://wa.me/${settings.whatsapp_number.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank'), 1500);
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
        <div className="bg-white dark:bg-night-surface w-full max-w-sm rounded-3xl p-8 text-center shadow-xl">
          <div className="h-20 w-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">✓</div>
          <h2 className="text-2xl font-bold mb-2">Order Sent!</h2>
          <p className="text-ink-muted mb-6">Your order is saved. Redirecting to WhatsApp...</p>
          <button onClick={onClose} className="btn-ghost w-full">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-lg bg-white dark:bg-night-surface sm:rounded-3xl rounded-t-3xl shadow-xl flex flex-col max-h-[95vh] animate-slide-up" onClick={e => e.stopPropagation()}>
        
        <div className="flex items-center justify-between p-5 border-b border-cream-line dark:border-night-line shrink-0">
          <h2 className="text-xl font-bold font-display">Checkout</h2>
          <button onClick={onClose} className="text-ink-muted hover:text-ink dark:hover:text-cream">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-6 flex-1">
          
          <div className="bg-brand-50 dark:bg-brand-900/10 p-3 rounded-xl flex items-center justify-between border border-brand-100 dark:border-brand-900/30">
            <div>
              <p className="font-bold text-sm text-brand-800 dark:text-brand-300">Ordering for a friend?</p>
              <p className="text-xs text-brand-600 dark:text-brand-400">We'll deliver directly to them.</p>
            </div>
            <input type="checkbox" checked={isForFriend} onChange={e => setIsForFriend(e.target.checked)} className="w-5 h-5 accent-brand-600" />
          </div>

          {isForFriend && (
            <div className="space-y-3 animate-fade-in border-l-2 border-brand-500 pl-3 ml-1">
              <input type="text" required placeholder="Friend's Name" value={friendName} onChange={e => setFriendName(e.target.value)} className="w-full bg-cream-soft dark:bg-night-line rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
              <input type="tel" required placeholder="Friend's Phone Number" value={friendPhone} onChange={e => setFriendPhone(e.target.value)} className="w-full bg-cream-soft dark:bg-night-line rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
            </div>
          )}

          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-brand-600 uppercase tracking-wider">{isForFriend ? 'Your Details (Buyer)' : '1. Your Details'}</h3>
            <input type="text" required placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} className="w-full bg-cream-soft dark:bg-night-line rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
            <input type="tel" required placeholder="Your Phone Number" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-cream-soft dark:bg-night-line rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-brand-600 uppercase tracking-wider">Delivery Method</h3>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setMode('pickup')} className={`p-3 rounded-xl border font-medium text-sm ${mode === 'pickup' ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-900/20' : 'border-cream-line dark:border-night-line'}`}>Pickup</button>
              <button type="button" onClick={() => setMode('delivery')} className={`p-3 rounded-xl border font-medium text-sm ${mode === 'delivery' ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-900/20' : 'border-cream-line dark:border-night-line'}`}>Delivery</button>
            </div>
            
            {mode === 'delivery' && (
              <div className="space-y-3 mt-2 animate-fade-in">
                
                {/* SEARCHABLE DROPDOWN FOR LOCATION */}
                <div className="relative">
                  <label className="block text-xs font-semibold text-ink-muted mb-1">
                    {isForFriend ? "Where is your friend located?" : "Where should we deliver?"}
                  </label>
                  <input 
                    type="text" 
                    placeholder={isLoadingZones ? "Loading locations..." : "Type to search (e.g. Moremi, New Market)..." }
                    value={locationQuery}
                    disabled={isLoadingZones}
                    onChange={handleLocationInputChange}
                    onFocus={() => setShowLocationDropdown(true)}
                    onBlur={() => setTimeout(() => setShowLocationDropdown(false), 200)}
                    className="w-full bg-cream-soft dark:bg-night-line rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none" 
                  />
                  
                  {/* Filtered Dropdown List */}
                  {showLocationDropdown && locationQuery.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-night-surface border border-cream-line dark:border-night-line rounded-xl shadow-xl max-h-60 overflow-y-auto">
                      {Object.keys(groupedZones).length === 0 ? (
                        <div className="p-4 text-sm text-center text-ink-muted">No locations found.</div>
                      ) : (
                        Object.entries(groupedZones).map(([groupName, groupZones]) => (
                          <div key={groupName} className="border-b border-cream-line dark:border-night-line last:border-0">
                            <div className="px-3 py-1 bg-cream-soft dark:bg-night-line text-[10px] font-bold text-ink-muted uppercase tracking-wider">
                              {groupName}
                            </div>
                            {groupZones.map(z => (
                              <div 
                                key={z.id} 
                                onMouseDown={(e) => e.preventDefault()} // Prevents input from losing focus before click
                                onClick={() => handleSelectLocation(z)}
                                className="p-3 text-sm hover:bg-brand-50 dark:hover:bg-night-line cursor-pointer flex justify-between items-center"
                              >
                                <span>{z.name}</span>
                                <span className="text-brand-600 font-bold">{formatNaira(z.fee)}</span>
                              </div>
                            ))}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* LANDMARK INPUT */}
                <div>
                  <label className="block text-xs font-semibold text-ink-muted mb-1">
                    {isForFriend ? "Friend's Hostel / Room / Landmark" : "Hostel / Room / Landmark"}
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g., Block B Room 12, Blue Gate..." 
                    value={landmark} 
                    onChange={e => setLandmark(e.target.value)} 
                    className="w-full bg-cream-soft dark:bg-night-line rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none" 
                  />
                </div>
                
                {selectedZone && (
                  <div className="bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 p-3 rounded-xl text-sm border border-green-200 dark:border-green-800 flex justify-between items-center">
                    <span>Delivery Fee:</span>
                    <span className="font-bold">{formatNaira(selectedZone.fee)}</span>
                  </div>
                )}

                <div className="flex gap-2">
                  <button type="button" onClick={() => setDeliveryType('now')} className={`flex-1 p-2 rounded-xl border text-xs font-bold ${deliveryType === 'now' ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-900/20' : 'border-cream-line'}`}>Right Now</button>
                  <button type="button" onClick={() => setDeliveryType('scheduled')} className={`flex-1 p-2 rounded-xl border text-xs font-bold ${deliveryType === 'scheduled' ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-900/20' : 'border-cream-line'}`}>Schedule</button>
                </div>
                {deliveryType === 'scheduled' && (
                  <input type="time" required value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} className="w-full bg-cream-soft dark:bg-night-line rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none animate-fade-in" />
                )}
              </div>
            )}
          </div>

          {needsPack && (
            <div className="space-y-3 bg-cream-soft/50 dark:bg-night-line/50 p-3 rounded-xl">
              <h3 className="font-semibold text-sm text-brand-600 uppercase tracking-wider">Takeout Pack</h3>
              <p className="text-xs text-ink-muted">We've auto-selected the best size for your {totalPackQty} custom items. You can change it if you need to.</p>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setPackSize('S')} className={`p-2 rounded-xl border font-medium text-xs ${finalPackSize === 'S' ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-cream-line'}`}>Small ({formatNaira(settings.takeout_pack_fee_small)})</button>
                <button type="button" onClick={() => setPackSize('L')} className={`p-2 rounded-xl border font-medium text-xs ${finalPackSize === 'L' ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-cream-line'}`}>Large ({formatNaira(settings.takeout_pack_fee_large)})</button>
              </div>
            </div>
          )}

          <div className="bg-cream-soft dark:bg-night-line p-4 rounded-xl space-y-1 text-sm">
            <div className="flex justify-between text-ink-muted"><span>Subtotal</span><span>{formatNaira(cartTotal)}</span></div>
            {deliveryFee > 0 && <div className="flex justify-between text-ink-muted"><span>Delivery</span><span>{formatNaira(deliveryFee)}</span></div>}
            {finalPackFee > 0 && <div className="flex justify-between text-ink-muted"><span>Takeout Pack</span><span>{formatNaira(finalPackFee)}</span></div>}
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-cream-line dark:border-night-line mt-2">
              <span>Total</span>
              <span className="text-brand-600 dark:text-brand-400">{formatNaira(grandTotal)}</span>
            </div>
          </div>

        </form>

        <div className="p-4 border-t border-cream-line dark:border-night-line bg-white dark:bg-night-surface shrink-0">
          <button onClick={handleSubmit} disabled={loading || (mode === 'delivery' && !selectedZone)} className="btn-primary w-full !rounded-xl disabled:opacity-50">
            {loading ? 'Processing...' : (mode === 'delivery' && !selectedZone ? 'Select Location' : 'Send Order on WhatsApp')}
          </button>
        </div>
      </div>
    </div>
  );
}