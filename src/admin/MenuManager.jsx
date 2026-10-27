import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase.js';
import { formatNaira } from '../lib/format.js';

export default function MenuManager() {
  const [items, setItems] = useState([]);
  const [allSizes, setAllSizes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [editingItem, setEditingItem] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from('items').select('*').order('sort_order'),
      supabase.from('item_sizes').select('*').order('sort_order'),
      supabase.from('categories').select('*').order('sort_order')
    ]).then(([itemsRes, sizesRes, catsRes]) => {
      setItems(itemsRes.data || []);
      setAllSizes(sizesRes.data || []);
      setCategories(catsRes.data || []);
      setLoading(false);
    });
  }, []);

  const toggleAvailability = async (id, currentStatus) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, available: !currentStatus } : i));
    await supabase.from('items').update({ available: !currentStatus }).eq('id', id);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('item-images')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      alert('Error uploading image: ' + uploadError.message);
      setIsUploading(false);
      return;
    }

    const { data } = supabase.storage.from('item-images').getPublicUrl(fileName);
    setEditingItem({ ...editingItem, image_url: data.publicUrl });
    setIsUploading(false);
  };

  const openEditPanel = (item) => {
    const itemSizes = allSizes.filter(s => s.item_id === item.id);
    setEditingItem({ ...item, sizes: itemSizes });
  };

  const handleAddNew = () => {
    if (categories.length === 0) return alert("Please create a category first.");
    setEditingItem({
      id: 'new',
      name: '',
      price: 0,
      description: '',
      category_id: categories[0].id,
      subsection: '',
      available: true,
      popular: false,
      sizes: []
    });
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this item? This cannot be undone.")) return;
    
    setIsSaving(true);
    if (editingItem.id !== 'new') {
      await supabase.from('items').delete().eq('id', editingItem.id);
      setItems(prev => prev.filter(i => i.id !== editingItem.id));
    }
    setEditingItem(null);
    setIsSaving(false);
  };

  const updateSize = (index, field, value) => {
    const newSizes = [...editingItem.sizes];
    newSizes[index][field] = value;
    setEditingItem({ ...editingItem, sizes: newSizes });
  };

  const addSize = () => {
    const newSizes = [...(editingItem.sizes || [])];
    newSizes.push({ label: '', price: 0 });
    setEditingItem({ ...editingItem, sizes: newSizes });
  };

  const removeSize = (index) => {
    const newSizes = [...editingItem.sizes];
    newSizes.splice(index, 1);
    setEditingItem({ ...editingItem, sizes: newSizes });
  };

  const saveChanges = async () => {
    if (!editingItem.name) return alert("Item name is required.");
    setIsSaving(true);
    
    const itemData = {
      name: editingItem.name,
      description: editingItem.description,
      price: parseInt(editingItem.price) || 0,
      image_url: editingItem.image_url,
      popular: editingItem.popular,
      category_id: editingItem.category_id,
      subsection: editingItem.subsection || null,
      available: editingItem.available
    };

    let itemId = editingItem.id;

    if (itemId === 'new') {
      const { data, error } = await supabase.from('items').insert([itemData]).select().single();
      if (error) { alert(error.message); setIsSaving(false); return; }
      itemId = data.id;
      setItems(prev => [...prev, data]);
    } else {
      const { error } = await supabase.from('items').update(itemData).eq('id', itemId);
      if (error) { alert(error.message); setIsSaving(false); return; }
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, ...itemData } : i));
    }

    await supabase.from('item_sizes').delete().eq('item_id', itemId);
    if (editingItem.sizes && editingItem.sizes.length > 0) {
      const sizesToInsert = editingItem.sizes.map((s, idx) => ({
        item_id: itemId, label: s.label, price: parseInt(s.price) || 0, sort_order: idx
      }));
      await supabase.from('item_sizes').insert(sizesToInsert);
    }

    const { data: newSizes } = await supabase.from('item_sizes').select('*').order('sort_order');
    setAllSizes(newSizes || []);
    setEditingItem(null);
    setIsSaving(false);
  };

  const groupedMenu = useMemo(() => {
    const query = searchQuery.toLowerCase();
    const filtered = items.filter(item => 
      item.name.toLowerCase().includes(query) ||
      item.subsection?.toLowerCase().includes(query)
    );

    const structure = {};
    
    categories.forEach(cat => {
      structure[cat.id] = { name: cat.name, subsections: {} };
    });

    filtered.forEach(item => {
      const catId = item.category_id;
      const sub = item.subsection || 'General';
      
      if (structure[catId]) {
        if (!structure[catId].subsections[sub]) structure[catId].subsections[sub] = [];
        structure[catId].subsections[sub].push(item);
      }
    });

    return Object.entries(structure).filter(([_, catData]) => Object.keys(catData.subsections).length > 0);
  }, [items, categories, searchQuery]);

  if (loading) return <div className="p-8 text-center">Loading menu...</div>;

  return (
    <div className="space-y-6 pb-20">
      
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="search"
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-night-surface border border-cream-line dark:border-night-line rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none shadow-sm pl-10"
          />
          <span className="absolute left-3 top-3 text-ink-muted text-lg">🔍</span>
        </div>
        <button onClick={handleAddNew} className="bg-brand-600 text-white px-4 rounded-xl font-bold whitespace-nowrap shadow-sm hover:bg-brand-700 transition-colors">
          + Add Item
        </button>
      </div>

      <div className="space-y-8">
        {groupedMenu.length === 0 ? (
          <div className="text-center py-10 text-ink-muted">No items found.</div>
        ) : (
          groupedMenu.map(([catId, catData]) => (
            <div key={catId} className="space-y-4">
              
              <h2 className="font-display font-bold text-xl text-brand-700 dark:text-brand-400 border-b border-cream-line dark:border-night-line pb-2">
                {catData.name}
              </h2>

              <div className="space-y-6">
                {Object.entries(catData.subsections).map(([subName, subItems]) => (
                  <div key={subName} className="bg-white dark:bg-night-surface rounded-2xl border border-cream-line dark:border-night-line overflow-hidden">
                    
                    {subName !== 'General' && (
                      <div className="bg-cream-soft/50 dark:bg-night-line/50 px-4 py-2 border-b border-cream-line dark:border-night-line">
                        <h3 className="font-bold text-sm text-ink-muted uppercase tracking-wider">{subName}</h3>
                      </div>
                    )}

                    <div className="divide-y divide-cream-line dark:divide-night-line">
                      {subItems.map(item => {
                        const hasSizes = allSizes.some(s => s.item_id === item.id);
                        return (
                          <div key={item.id} className="p-3 flex items-center gap-3 hover:bg-cream-soft/50 dark:hover:bg-night-line/50 transition-colors">
                            <div className="h-12 w-12 shrink-0 bg-cream-soft dark:bg-night-line rounded-lg flex items-center justify-center overflow-hidden border border-cream-line dark:border-night-line">
                              {item.image_url ? <img src={item.image_url} className="h-full w-full object-cover" alt="" /> : <span className="text-xl">🍽️</span>}
                            </div>

                            <div className="flex-1 cursor-pointer" onClick={() => openEditPanel(item)}>
                              <p className="font-semibold text-sm flex items-center gap-2">
                                {item.name}
                                {item.popular && <span className="text-[9px] bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded uppercase">Popular</span>}
                                {hasSizes && <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase">Sizes</span>}
                              </p>
                            </div>

                            <div className="flex flex-col items-end gap-1">
                              <span className="font-bold text-brand-600 text-sm">{formatNaira(item.price)}</span>
                              <button
                                onClick={() => toggleAvailability(item.id, item.available)}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                                  item.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {item.available ? 'Available' : 'Sold Out'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setEditingItem(null)}>
          <div className="w-full max-w-lg bg-white dark:bg-night-surface sm:rounded-3xl rounded-t-3xl shadow-xl flex flex-col max-h-[95vh] animate-slide-up" onClick={e => e.stopPropagation()}>
            
            <div className="flex items-center justify-between p-5 border-b border-cream-line dark:border-night-line shrink-0">
              <h2 className="text-xl font-bold font-display">{editingItem.id === 'new' ? 'Add New Item' : 'Edit Item'}</h2>
              <button onClick={() => setEditingItem(null)} className="text-ink-muted hover:text-ink dark:hover:text-cream">✕</button>
            </div>

            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 shrink-0 bg-cream-soft dark:bg-night-line rounded-xl border-2 border-dashed border-cream-line dark:border-night-line flex items-center justify-center overflow-hidden relative">
                  {editingItem.image_url ? <img src={editingItem.image_url} className="h-full w-full object-cover" alt="" /> : <span className="text-3xl">🍽️</span>}
                  {isUploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-[10px] font-bold">...</div>}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm mb-1">Item Photo</p>
                  <label className="cursor-pointer bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 px-3 py-1.5 rounded-lg text-xs font-bold border border-brand-200 dark:border-brand-700 inline-block">
                    Choose File
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-ink-muted">Item Name</label>
                  <input type="text" value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} className="w-full bg-cream-soft dark:bg-night-line rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-ink-muted">Category</label>
                  <select value={editingItem.category_id} onChange={e => setEditingItem({...editingItem, category_id: e.target.value})} className="w-full bg-cream-soft dark:bg-night-line rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none">
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-ink-muted">Subsection (e.g. Rice, Swallow, Proteins)</label>
                <input type="text" value={editingItem.subsection || ''} onChange={e => setEditingItem({...editingItem, subsection: e.target.value})} placeholder="Leave blank if not applicable" className="w-full bg-cream-soft dark:bg-night-line rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-ink-muted">Base Price (₦)</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-lg font-bold text-brand-600">₦</span>
                  <input 
                    type="text" 
                    inputMode="numeric" 
                    pattern="[0-9]*"
                    value={editingItem.price} 
                    onChange={e => setEditingItem({...editingItem, price: e.target.value.replace(/\D/g, '')})} 
                    className="w-full bg-cream-soft dark:bg-night-line rounded-xl p-3 pl-10 text-lg font-bold focus:ring-2 focus:ring-brand-500 outline-none" 
                  />
                </div>
              </div>

              <div className="border border-cream-line dark:border-night-line rounded-xl p-3 bg-cream-soft/30 dark:bg-night-line/30">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-xs font-bold text-ink-muted uppercase tracking-wider">Sizes & Specific Prices</label>
                  <button onClick={addSize} className="text-xs font-bold text-brand-600 hover:underline">+ Add Size</button>
                </div>
                
                {(!editingItem.sizes || editingItem.sizes.length === 0) ? (
                  <p className="text-xs text-ink-muted text-center py-2">No sizes added.</p>
                ) : (
                  <div className="space-y-2">
                    {editingItem.sizes.map((size, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input type="text" placeholder="Label (e.g. Large)" value={size.label} onChange={e => updateSize(idx, 'label', e.target.value)} className="flex-1 bg-white dark:bg-night-surface rounded-lg p-2 text-sm border border-cream-line dark:border-night-line outline-none focus:border-brand-500" />
                        <input 
                          type="text" 
                          inputMode="numeric" 
                          pattern="[0-9]*"
                          placeholder="Price" 
                          value={size.price} 
                          onChange={e => updateSize(idx, 'price', e.target.value.replace(/\D/g, ''))} 
                          className="w-24 bg-white dark:bg-night-surface rounded-lg p-2 text-sm border border-cream-line dark:border-night-line outline-none focus:border-brand-500" 
                        />
                        <button onClick={() => removeSize(idx)} className="text-red-500 font-bold px-2">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-ink-muted">Description (Optional)</label>
                <textarea value={editingItem.description || ''} onChange={e => setEditingItem({...editingItem, description: e.target.value})} className="w-full bg-cream-soft dark:bg-night-line rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none resize-none" rows={2} />
              </div>

              <label className="flex items-center gap-3 bg-cream-soft dark:bg-night-line p-3 rounded-xl cursor-pointer">
                <input type="checkbox" checked={editingItem.popular || false} onChange={e => setEditingItem({...editingItem, popular: e.target.checked})} className="w-5 h-5 accent-brand-600" />
                <p className="font-bold text-sm">Mark as Popular</p>
              </label>
            </div>

            <div className="p-4 border-t border-cream-line dark:border-night-line shrink-0 flex gap-2">
              {editingItem.id !== 'new' && (
                <button onClick={handleDelete} disabled={isSaving} className="bg-red-100 text-red-600 px-4 rounded-xl font-bold hover:bg-red-200 transition-colors">
                  Delete
                </button>
              )}
              <button onClick={saveChanges} disabled={isSaving || isUploading} className="btn-primary flex-1 !rounded-xl">
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}