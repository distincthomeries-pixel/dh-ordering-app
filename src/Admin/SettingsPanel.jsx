import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';

export default function SettingsPanel() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    supabase.from('settings').select('*').eq('id', 1).single()
      .then(({ data }) => {
        const formattedImages = (data.banner_images || []).map(img => 
          typeof img === 'string' ? { url: img, link: '' } : img
        );
        setSettings({ ...data, banner_images: formattedImages });
        setLoading(false);
      });
  }, []);

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `banner-${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage.from('item-images').upload(fileName, file);
    if (error) {
      alert("Error uploading: " + error.message);
    } else {
      const { data } = supabase.storage.from('item-images').getPublicUrl(fileName);
      setSettings(prev => ({
        ...prev,
        banner_images: [...prev.banner_images, { url: data.publicUrl, link: '' }]
      }));
    }
    setIsUploading(false);
  };

  const updateBannerLink = (index, link) => {
    const newImages = [...settings.banner_images];
    newImages[index].link = link;
    setSettings({ ...settings, banner_images: newImages });
  };

  const removeBannerImage = (index) => {
    const newImages = [...settings.banner_images];
    newImages.splice(index, 1);
    setSettings({ ...settings, banner_images: newImages });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    const { error } = await supabase.from('settings').update({
      restaurant_name: settings.restaurant_name,
      whatsapp_number: settings.whatsapp_number,
      announcement_banner: settings.announcement_banner,
      is_open: settings.is_open,
      opening_hours: settings.opening_hours,
      takeout_pack_fee_small: parseInt(settings.takeout_pack_fee_small) || 0,
      takeout_pack_fee_large: parseInt(settings.takeout_pack_fee_large) || 0,
      banner_images: settings.banner_images
    }).eq('id', 1);
    
    if (error) alert("Failed to save: " + error.message);
    else {
      setSavedMsg('Settings saved successfully!');
      setTimeout(() => setSavedMsg(''), 3000);
    }
    setSaving(false);
  };

  if (loading) return <div className="p-8 text-center">Loading settings...</div>;

  return (
    <form onSubmit={handleSave} className="bg-white dark:bg-night-surface rounded-2xl p-6 shadow-sm border border-cream-line dark:border-night-line space-y-6">
      {savedMsg && <div className="bg-green-100 text-green-700 p-3 rounded-xl text-sm font-bold animate-fade-in">{savedMsg}</div>}

      <div className="flex items-center justify-between bg-cream-soft dark:bg-night-line p-4 rounded-xl border border-cream-line dark:border-night-line">
        <div>
          <p className="font-bold">Restaurant Status</p>
          <p className="text-xs text-ink-muted">Open or close the store immediately.</p>
        </div>
        <button type="button" onClick={() => setSettings({ ...settings, is_open: !settings.is_open })} className={`px-6 py-2 rounded-xl font-bold text-white transition-colors ${settings.is_open ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}>
          {settings.is_open ? 'OPEN' : 'CLOSED'}
        </button>
      </div>

      <div className="space-y-3 bg-cream-soft/50 dark:bg-night-line/50 p-4 rounded-xl border border-cream-line dark:border-night-line">
        <h3 className="font-bold text-sm">Banner Slideshow (Ads)</h3>
        <p className="text-xs text-ink-muted">Upload up to 5 images. Add a link to make them clickable.</p>
        
        <div className="space-y-3 mt-2">
          {settings.banner_images.map((img, idx) => (
            <div key={idx} className="flex items-center gap-3 bg-white dark:bg-night-surface p-2 rounded-xl border border-cream-line dark:border-night-line">
              <div className="h-16 w-24 shrink-0 rounded-lg overflow-hidden relative">
                <img src={img.url} className="h-full w-full object-cover" />
                <button type="button" onClick={() => removeBannerImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-[10px]">✕</button>
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-bold text-ink-muted uppercase">Redirect Link (Optional)</label>
                <input 
                  type="url" 
                  placeholder="https://wa.me/... or /promo"
                  value={img.link || ''} 
                  onChange={(e) => updateBannerLink(idx, e.target.value)}
                  className="w-full bg-cream-soft dark:bg-night-line rounded-lg p-2 text-xs outline-none focus:ring-1 focus:ring-brand-500" 
                />
              </div>
            </div>
          ))}
          
          {settings.banner_images.length < 5 && (
            <label className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-dashed border-cream-line dark:border-night-line cursor-pointer hover:bg-cream-soft dark:hover:bg-night-line">
              <span className="text-lg">+</span>
              <span className="text-xs font-bold text-ink-muted">{isUploading ? 'Uploading...' : 'Add Photo'}</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} disabled={isUploading} />
            </label>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-bold text-ink-muted uppercase">Restaurant Name</label>
          <input type="text" value={settings.restaurant_name || ''} onChange={e => setSettings({ ...settings, restaurant_name: e.target.value })} className="w-full bg-cream-soft dark:bg-night-line rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-ink-muted uppercase">WhatsApp Number</label>
          <input type="text" value={settings.whatsapp_number || ''} onChange={e => setSettings({ ...settings, whatsapp_number: e.target.value })} className="w-full bg-cream-soft dark:bg-night-line rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold text-ink-muted uppercase">Scrolling Text Banner (If no images are uploaded)</label>
        <input type="text" value={settings.announcement_banner || ''} onChange={e => setSettings({ ...settings, announcement_banner: e.target.value })} className="w-full bg-cream-soft dark:bg-night-line rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold text-ink-muted uppercase">Opening Hours</label>
        <input type="text" value={settings.opening_hours || ''} onChange={e => setSettings({ ...settings, opening_hours: e.target.value })} className="w-full bg-cream-soft dark:bg-night-line rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-bold text-ink-muted uppercase">Small Pack Fee (₦)</label>
          <input 
            type="text" 
            inputMode="numeric" 
            pattern="[0-9]*"
            value={settings.takeout_pack_fee_small || 0}
            onChange={e => setSettings({ ...settings, takeout_pack_fee_small: e.target.value.replace(/\D/g, '') })}
            className="w-full bg-cream-soft dark:bg-night-line rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-brand-500 outline-none" 
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-ink-muted uppercase">Large Pack Fee (₦)</label>
          <input 
            type="text" 
            inputMode="numeric" 
            pattern="[0-9]*"
            value={settings.takeout_pack_fee_large || 0}
            onChange={e => setSettings({ ...settings, takeout_pack_fee_large: e.target.value.replace(/\D/g, '') })}
            className="w-full bg-cream-soft dark:bg-night-line rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-brand-500 outline-none" 
          />
        </div>
      </div>

      <button type="submit" disabled={saving || isUploading} className="btn-primary w-full !rounded-xl py-4">
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </form>
  );
}