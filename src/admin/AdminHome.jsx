import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import Orders from './Orders.jsx';
import MenuManager from './MenuManager.jsx';
import DeliveryZones from './DeliveryZones.jsx';
import SettingsPanel from './SettingsPanel.jsx';

export default function AdminApp() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Added 'delivery' to the tabs
  const [activeTab, setActiveTab] = useState('orders'); 

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return <div className="min-h-dvh flex items-center justify-center bg-cream dark:bg-night text-ink dark:text-cream">Loading Admin...</div>;
  }

  if (!session) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-cream dark:bg-night p-4">
        <div className="w-full max-w-sm bg-white dark:bg-night-surface p-8 rounded-3xl shadow-xl border border-cream-line dark:border-night-line">
          <h1 className="text-2xl font-bold font-display mb-6 text-center">Admin Login</h1>
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-4">{error}</div>}
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="email" placeholder="Email Address" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-cream-soft dark:bg-night-line rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none" 
            />
            <input 
              type="password" placeholder="Password" required value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-cream-soft dark:bg-night-line rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none" 
            />
            <button type="submit" disabled={loading} className="btn-primary w-full !rounded-xl">
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-cream dark:bg-night">
      <header className="bg-white dark:bg-night-surface border-b border-cream-line dark:border-night-line px-4 py-3 flex justify-between items-center sticky top-0 z-10">
        <h1 className="font-display font-bold text-lg">DH Admin</h1>
        <button onClick={handleLogout} className="text-sm font-bold text-red-500 hover:underline">Logout</button>
      </header>
      
      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-night-surface border-b border-cream-line dark:border-night-line px-4 pt-2 flex gap-4 overflow-x-auto hide-scrollbar">
        <button 
          onClick={() => setActiveTab('orders')}
          className={`pb-3 px-2 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'orders' ? 'border-brand-600 text-brand-600' : 'border-transparent text-ink-muted'}`}
        >
          Live Orders
        </button>
        <button 
          onClick={() => setActiveTab('menu')}
          className={`pb-3 px-2 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'menu' ? 'border-brand-600 text-brand-600' : 'border-transparent text-ink-muted'}`}
        >
          Menu
        </button>
        <button 
          onClick={() => setActiveTab('delivery')}
          className={`pb-3 px-2 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'delivery' ? 'border-brand-600 text-brand-600' : 'border-transparent text-ink-muted'}`}
        >
          Delivery Zones
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`pb-3 px-2 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'settings' ? 'border-brand-600 text-brand-600' : 'border-transparent text-ink-muted'}`}
        >
          Settings
        </button>
      </div>

      <main className="p-4 max-w-4xl mx-auto">
        {activeTab === 'orders' && <Orders />}
        {activeTab === 'menu' && <MenuManager />}
        {activeTab === 'delivery' && <DeliveryZones />}
        {activeTab === 'settings' && <SettingsPanel />}
      </main>
    </div>
  );
}