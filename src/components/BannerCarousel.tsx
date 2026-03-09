import { useState, useEffect, useCallback, useRef } from 'react';
import { useBanners, Banner } from '@/hooks/useBanners';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react';

export const BannerCarousel = () => {
  const { activeBanners, loading } = useBanners();
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const [muted, setMuted] = useState(true);

  const count = activeBanners.length;

  const next = useCallback(() => {
    if (count <= 1) return;
    setCurrent(c => (c + 1) % count);
  }, [count]);

  const prev = useCallback(() => {
    if (count <= 1) return;
    setCurrent(c => (c - 1 + count) % count);
  }, [count]);

  // Auto-advance for image slides only
  useEffect(() => {
    clearInterval(timerRef.current);
    if (count <= 1) return;
    const currentBanner = activeBanners[current];
    if (currentBanner?.media_type === 'video') return;
    timerRef.current = setInterval(next, 5000);
    return () => clearInterval(timerRef.current);
  }, [next, count, current, activeBanners]);

  if (loading || count === 0) return null;

  const banner = activeBanners[current];
  const isVertical = banner.aspect_ratio === '9:16';

  return (
    <section className="w-full bg-black/5">
      <div className="container mx-auto px-4 py-3 sm:py-4">
        {banner.title && (
          <h2 className="text-center text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-3 tracking-tight drop-shadow-sm">
            🔥 {banner.title}
          </h2>
        )}
        <div className="relative overflow-hidden rounded-xl shadow-medium">
          <div
            className={cn(
              "relative w-full overflow-hidden",
              isVertical ? "max-w-sm mx-auto aspect-[9/16]" : "aspect-video"
            )}
          >
            {activeBanners.map((b, i) => (
              <BannerSlide
                key={`${b.id}-${i === current}`}
                banner={b}
                active={i === current}
                muted={muted}
                onVideoEnded={next}
                onToggleMute={() => setMuted(m => !m)}
              />
            ))}
          </div>

          {count > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 sm:p-2 transition-colors z-20"
                aria-label="Anterior"
              >
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <button
                onClick={next}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 sm:p-2 transition-colors z-20"
                aria-label="Próximo"
              >
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </>
          )}

          {count > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
              {activeBanners.map((_, i) => (
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

  // Simple autoplay: play when active, pause when not
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

  // Sync muted
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  const isVideo = banner.media_type === 'video';

  const content = isVideo ? (
    <video
      ref={videoRef}
      src={banner.media_url}
      className="w-full h-full object-cover"
      playsInline
      autoPlay
      muted
      onEnded={onVideoEnded}
    />
  ) : (
    <img
      src={banner.media_url}
      alt={banner.title || 'Banner promocional'}
      className="w-full h-full object-cover"
      loading="lazy"
    />
  );

  return (
    <div
      className={cn(
        "absolute inset-0 transition-opacity duration-700",
        active ? "opacity-100 z-[1]" : "opacity-0 z-0 pointer-events-none"
      )}
    >
      {banner.link_url ? (
        <a href={banner.link_url} target="_blank" rel="noopener noreferrer" className="block absolute inset-0">
          {content}
        </a>
      ) : (
        <div className="absolute inset-0">{content}</div>
      )}

      {/* Volume toggle - only on active video slides */}
      {isVideo && active && (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleMute(); }}
          className={cn(
            "absolute bottom-12 right-3 z-30 rounded-full p-2.5 transition-colors backdrop-blur-sm",
            muted ? "bg-white/80 text-foreground" : "bg-black/50 hover:bg-black/70 text-white"
          )}
          aria-label={muted ? 'Ativar som' : 'Mutar'}
        >
          {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
      )}
    </div>
  );
};
