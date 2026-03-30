export const optimizeImageUrl = (url: string | null | undefined): string | undefined => {
  if (!url || url.trim() === '' || url === '/placeholder.svg') return undefined;
  
  const cleanUrl = url.trim();
  
  // If it's a relative path starting with /storage, prepend the current Supabase URL
  if (cleanUrl.startsWith('/storage/')) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fuiagxnyjiadmzayroxp.supabase.co';
    return `${supabaseUrl}${cleanUrl}`;
  }

  // If it's an absolute URL from either the old or new project, return it as is.
  // We no longer strip the domain because it breaks in production (no Vite proxy).
  if (cleanUrl.includes('supabase.co')) {
    return cleanUrl;
  }
  
  return cleanUrl;
};

