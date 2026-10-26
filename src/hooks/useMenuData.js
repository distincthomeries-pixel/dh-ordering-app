import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';

export function useMenuData() {
  const [data, setData] = useState({ categories: [], items: [], sizes: [], options: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchMenu() {
      try {
        const [catRes, itemRes, sizeRes, optRes] = await Promise.all([
          supabase.from('categories').select('*').order('sort_order'),
          supabase.from('items').select('*').order('sort_order'),
          supabase.from('item_sizes').select('*').order('sort_order'),
          supabase.from('item_options').select('*').order('sort_order'),
        ]);

        if (catRes.error) throw catRes.error;
        if (itemRes.error) throw itemRes.error;
        if (sizeRes.error) throw sizeRes.error;
        if (optRes.error) throw optRes.error;

        setData({
          categories: catRes.data || [],
          items: itemRes.data || [],
          sizes: sizeRes.data || [],
          options: optRes.data || [],
        });
      } catch (err) {
        console.error('Error fetching menu:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchMenu();
  }, []);

  return { ...data, loading, error };
}