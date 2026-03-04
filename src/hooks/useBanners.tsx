import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Banner {
  id: string;
  title: string | null;
  media_url: string;
  media_type: 'image' | 'video';
  aspect_ratio: '16:9' | '9:16';
  display_order: number;
  is_active: boolean;
  link_url: string | null;
  created_at: string;
}

export function useBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBanners = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('display_order', { ascending: true });

    if (!error && data) {
      setBanners(data as Banner[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const activeBanners = banners.filter(b => b.is_active);

  return { banners, activeBanners, loading, fetchBanners };
}
