import { useState, useEffect, useCallback, useRef } from 'react';
import { useBanners, Banner } from '@/hooks/useBanners';
import { useProducts } from '@/hooks/useProducts';
import { cn } from '@/lib/utils';
import { Volume2, VolumeX, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

export const BannerCarousel = () => {
  const { activeBanners, loading: bannersLoading } = useBanners();
  const { getLatestProduct, loading: productsLoading } = useProducts();
  const [current, setCurrent] = useState(0);
  const [displayBanners, setDisplayBanners] = useState<(Banner | any)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const [muted, setMuted] = useState(true);

  const loading = bannersLoading || productsLoading;

  // Touch/swipe state
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const next = useCallback(() => {
    if (displayBanners.length <= 1) return;
    setCurrent(c => (c + 1) % displayBanners.length);
  }, [displayBanners.length]);

  const prev = useCallback(() => {
    if (displayBanners.length <= 1) return;
    setCurrent(c => (c - 1 + displayBanners.length) % displayBanners.length);
  }, [displayBanners.length]);

  // Handle banner combinations
  useEffect(() => {
    if (loading) return;

    const latestProduct = getLatestProduct();
    let combined: (Banner | any)[] = [...activeBanners];

    // Se houver um último produto, adiciona-o como banner dinâmico
    if (latestProduct) {
      const dynamicBanner = {
        id: `dynamic-${latestProduct.id}`,
        title: `NOVIDADE: ${latestProduct.name}`,
        media_url: latestProduct.image_url,
        media_type: 'image',
        aspect_ratio: '16:9',
        link_url: `/produto/${latestProduct.id}`,
        is_dynamic: true
      };
      
      // Coloca o lançamento como primeiro destaque
      combined = [dynamicBanner, ...combined];
    }

    setDisplayBanners(combined);
  }, [activeBanners, getLatestProduct, loading]);

  // Auto-advance for image slides only
  useEffect(() => {
    clearInterval(timerRef.current);
    if (displayBanners.length <= 1) return;
    const currentBanner = displayBanners[current];
    if (currentBanner?.media_type === 'video') return;
    timerRef.current = setInterval(next, 5000);
    return () => clearInterval(timerRef.current);
  }, [next, displayBanners.length, current, displayBanners]);

  // Swipe handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
    isDragging.current = true;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const threshold = 50;
    if (touchDeltaX.current < -threshold) {
      next();
    } else if (touchDeltaX.current > threshold) {
      prev();
    }
    touchDeltaX.current = 0;
  }, [next, prev]);

  if (loading || displayBanners.length === 0) return null;

  const banner = displayBanners[current];
  const isVertical = banner.aspect_ratio === '9:16';
  const isDynamic = 'is_dynamic' in banner;

  return (
    <section className="w-full bg-black/5">
      <div className="container mx-auto px-4 py-3 sm:py-4">
        {banner.title && (
          <h2 className="text-center text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-3 tracking-tight drop-shadow-sm flex items-center justify-center gap-2">
            {isDynamic ? <Sparkles className="h-5 w-5 text-accent animate-pulse" /> : '🔥'} 
            {banner.title}
          </h2>
        )}
        <div
          ref={containerRef}
          className="relative overflow-hidden rounded-xl shadow-medium touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className={cn(
              "relative w-full overflow-hidden",
              isVertical ? "max-w-xs sm:max-w-sm mx-auto aspect-[9/16]" : "aspect-[4/3] sm:aspect-video"
            )}
          >
            {displayBanners.map((b, i) => (
              <BannerSlide
                key={b.id}
                banner={b}
                active={i === current}
                muted={muted}
                onVideoEnded={next}
                onToggleMute={() => setMuted(m => !m)}
              />
            ))}
          </div>

          {displayBanners.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-30 rounded-full bg-black/40 backdrop-blur-sm p-1 sm:p-1.5 text-white active:bg-black/60 hover:bg-black/50 transition-colors"
                aria-label="Anterior"
              >
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-30 rounded-full bg-black/40 backdrop-blur-sm p-1 sm:p-1.5 text-white active:bg-black/60 hover:bg-black/50 transition-colors"
                aria-label="Próximo"
              >
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                {displayBanners.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      i === current ? "bg-white w-5" : "bg-white/50"
                    )}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

const BannerSlide = ({ banner, active, muted, onVideoEnded, onToggleMute }: {
  banner: Banner;
  active: boolean;
  muted: boolean;
  onVideoEnded: () => void;
  onToggleMute: () => void;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (active) {
      video.currentTime = 0;
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [active]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  const isVideo = banner.media_type === 'video';

  // Tap on video toggles mute (mobile-first)
  const handleVideoTap = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleMute();
  };

  return (
    <div
      className={cn(
        "absolute inset-0 transition-opacity duration-700",
        active ? "opacity-100 z-[1]" : "opacity-0 z-0 pointer-events-none"
      )}
    >
      {isVideo ? (
        <div className="absolute inset-0 cursor-pointer" onClick={handleVideoTap}>
          <video
            ref={videoRef}
            src={banner.media_url}
            className="w-full h-full object-cover"
            playsInline
            autoPlay
            muted
            onEnded={onVideoEnded}
          />
          {/* Mute indicator */}
          {active && (
            <div className={cn(
              "absolute bottom-12 right-3 z-30 rounded-full p-2 backdrop-blur-sm pointer-events-none transition-opacity",
              muted ? "bg-white/80 text-foreground" : "bg-black/50 text-white"
            )}>
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </div>
          )}
        </div>
      ) : banner.link_url ? (
        <a href={banner.link_url} target="_blank" rel="noopener noreferrer" className="block absolute inset-0">
          <img
            src={banner.media_url}
            alt={banner.title || 'Banner promocional'}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </a>
      ) : (
        <div className="absolute inset-0">
          <img
            src={banner.media_url}
            alt={banner.title || 'Banner promocional'}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}
    </div>
  );
};
