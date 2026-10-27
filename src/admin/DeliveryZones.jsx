import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase.js';
import { formatNaira } from '../lib/format.js';

export default function DeliveryZones() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [editingZone, setEditingZone] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchZones();
  }, []);

  const fetchZones = async () => {
    const { data } = await supabase.from('delivery_zones').select('*').order('group_name').order('sort_order');
    setZones(data || []);
    setLoading(false);
  };

  const uniqueGroups = useMemo(() => {
    const groups = new Set(zones.map(z => z.group_name));
    if (groups.size === 0) {
      return ['Male Hostels', 'Female Hostels', 'Private Hostels', 'Postgraduate', 'Academic Area', 'Social & Markets', 'Lecture Theatres', 'Administrative', 'Off-Campus'];
    }
    return Array.from(groups).sort();
  }, [zones]);

  const handleAddNew = () => {
    setEditingZone({
      id: 'new',
      group_name: uniqueGroups[0] || 'On-Campus',
      name: '',
      fee: 500,
      sort_order: zones.length + 1
    });
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this delivery zone? Customers won't be able to select it anymore.")) return;
    setIsSaving(true);
    if (editingZone.id !== 'new') {
      await supabase.from('delivery_zones').delete().eq('id', editingZone.id);
      setZones(prev => prev.filter(z => z.id !== editingZone.id));
    }
    setEditingZone(null);
    setIsSaving(false);
  };

  const saveChanges = async () => {
    if (!editingZone.name || !editingZone.group_name) return alert("Name and Group are required.");
    setIsSaving(true);

    const zoneData = {
      group_name: editingZone.group_name,
      name: editingZone.name,
      fee: parseInt(editingZone.fee) || 0,
      sort_order: editingZone.sort_order || 0
    };

    if (editingZone.id === 'new') {
      const { data, error } = await supabase.from('delivery_zones').insert([zoneData]).select().single();
      if (error) { alert(error.message); setIsSaving(false); return; }
      setZones(prev => [...prev, data]);
    } else {
      const { error } = await supabase.from('delivery_zones').update(zoneData).eq('id', editingZone.id);
      if (error) { alert(error.message); setIsSaving(false); return; }
      setZones(prev => prev.map(z => z.id === editingZone.id ? { ...z, ...zoneData } : z));
    }
    
    setEditingZone(null);
    setIsSaving(false);
  };

  const groupedZones = useMemo(() => {
    const query = searchQuery.toLowerCase();
    const filtered = zones.filter(z => 
      z.name.toLowerCase().includes(query) || 
      z.group_name.toLowerCase().includes(query)
    );

    const groups = {};
    filtered.forEach(zone => {
      if (!groups[zone.group_name]) groups[zone.group_name] = [];
      groups[zone.group_name].push(zone);
    });
    return groups;
  }, [zones, searchQuery]);

  if (loading) return <div className="p-8 text-center">Loading zones...</div>;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="search"
            placeholder="Search locations (e.g., Moremi, Off-Campus)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-night-surface border border-cream-line dark:border-night-line rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none shadow-sm pl-10"
          />
          <span className="absolute left-3 top-3 text-ink-muted text-lg">🔍</span>
        </div>
        <button onClick={handleAddNew} className="bg-brand-600 text-white px-4 rounded-xl font-bold whitespace-nowrap shadow-sm hover:bg-brand-700 transition-colors">
          + Add Zone
        </button>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedZones).map(([groupName, groupZones]) => (
          <div key={groupName} className="bg-white dark:bg-night-surface rounded-2xl border border-cream-line dark:border-night-line overflow-hidden">
            <div className="bg-cream-soft/50 dark:bg-night-line/50 px-4 py-2 border-b border-cream-line dark:border-night-line">
              <h3 className="font-bold text-sm text-ink-muted uppercase tracking-wider">{groupName}</h3>
            </div>
            
            <div className="divide-y divide-cream-line dark:divide-night-line">
              {groupZones.map(zone => (
                <div 
                  key={zone.id} 
                  onClick={() => setEditingZone(zone)}
                  className="p-3 flex items-center justify-between hover:bg-cream-soft/50 dark:hover:bg-night-line/50 transition-colors cursor-pointer"
                >
                  <span className="font-semibold text-sm">{zone.name}</span>
                  <span className="font-bold text-brand-600 text-sm">{formatNaira(zone.fee)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        {Object.keys(groupedZones).length === 0 && (
          <div className="text-center py-10 text-ink-muted">No locations found for "{searchQuery}"</div>
        )}
      </div>

      {editingZone && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setEditingZone(null)}>
          <div className="w-full max-w-sm bg-white dark:bg-night-surface sm:rounded-3xl rounded-t-3xl shadow-xl flex flex-col animate-slide-up" onClick={e => e.stopPropagation()}>
            
            <div className="flex items-center justify-between p-5 border-b border-cream-line dark:border-night-line shrink-0">
              <h2 className="text-xl font-bold font-display">{editingZone.id === 'new' ? 'Add Zone' : 'Edit Zone'}</h2>
              <button onClick={() => setEditingZone(null)} className="text-ink-muted hover:text-ink dark:hover:text-cream">✕</button>
            </div>

            <div className="p-5 space-y-4">
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-ink-muted">Select Category</label>
                <select 
                  value={editingZone.group_name} 
                  onChange={e => setEditingZone({...editingZone, group_name: e.target.value})} 
                  className="w-full bg-cream-soft dark:bg-night-line rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                >
                  {uniqueGroups.map(group => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-ink-muted">Location Name</label>
                <input 
                  type="text" 
                  value={editingZone.name} 
                  onChange={e => setEditingZone({...editingZone, name: e.target.value})} 
                  placeholder="e.g. Moremi Hall"
                  className="w-full bg-cream-soft dark:bg-night-line rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-ink-muted">Delivery Fee (₦)</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-lg font-bold text-brand-600">₦</span>
                  <input 
                    type="text" 
                    inputMode="numeric" 
                    pattern="[0-9]*"
                    value={editingZone.fee} 
                    onChange={e => setEditingZone({...editingZone, fee: e.target.value.replace(/\D/g, '')})} 
                    className="w-full bg-cream-soft dark:bg-night-line rounded-xl p-3 pl-10 text-lg font-bold focus:ring-2 focus:ring-brand-500 outline-none" 
                  />
                </div>
              </div>

            </div>

            <div className="p-4 border-t border-cream-line dark:border-night-line shrink-0 flex gap-2">
              {editingZone.id !== 'new' && (
                <button onClick={handleDelete} disabled={isSaving} className="bg-red-100 text-red-600 px-4 rounded-xl font-bold hover:bg-red-200 transition-colors">
                  Delete
                </button>
              )}
              <button onClick={saveChanges} disabled={isSaving} className="btn-primary flex-1 !rounded-xl">
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}