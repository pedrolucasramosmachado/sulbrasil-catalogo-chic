import { useState, useEffect, useCallback, useRef } from 'react';
import { useBanners, Banner } from '@/hooks/useBanners';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Volume2, VolumeX, Pause, Play } from 'lucide-react';

export const BannerCarousel = () => {
  const { activeBanners, loading } = useBanners();
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

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

  const handleVideoEnded = useCallback(() => {
    if (count > 1) next();
  }, [next, count]);

  const togglePause = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setPaused(false);
    } else {
      video.pause();
      setPaused(true);
    }
  };

  const toggleMute = () => {
    setMuted(m => !m);
  };

  if (loading || count === 0) return null;

  const banner = activeBanners[current];
  const isVertical = banner.aspect_ratio === '9:16';
  const currentIsVideo = banner.media_type === 'video';

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
                key={b.id}
                banner={b}
                active={i === current}
                muted={muted}
                onVideoEnded={handleVideoEnded}
                onVideoRef={i === current ? (el) => { videoRef.current = el; } : undefined}
              />
            ))}
          </div>

          {/* Video controls */}
          {currentIsVideo && (
            <div className="absolute bottom-10 left-0 right-0 z-20 flex justify-center">
              <div className="flex items-center gap-3 bg-black/60 rounded-full px-4 py-2 backdrop-blur-sm">
                <button
                  onClick={togglePause}
                  className="text-white active:scale-90 transition-transform p-1"
                  aria-label={paused ? 'Reproduzir' : 'Pausar'}
                >
                  {paused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                </button>
                <button
                  onClick={toggleMute}
                  className={cn(
                    "text-white active:scale-90 transition-all p-1 rounded-full",
                    muted && "bg-white/20 ring-2 ring-white/50"
                  )}
                  aria-label={muted ? 'Ativar som' : 'Mutar'}
                >
                  {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </button>
              </div>
            </div>
          )}

          {/* Tap to unmute overlay — prominent on first load */}
          {currentIsVideo && muted && !paused && (
            <button
              onClick={toggleMute}
              className="absolute inset-0 z-10 flex items-center justify-center bg-black/10 transition-opacity"
              aria-label="Toque para ativar o som"
            >
              <div className="bg-black/60 rounded-full p-4 backdrop-blur-sm animate-pulse">
                <VolumeX className="h-8 w-8 text-white" />
              </div>
            </button>
          )}

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

const BannerSlide = ({ banner, active, muted, onVideoEnded, onVideoRef }: {
  banner: Banner;
  active: boolean;
  muted: boolean;
  onVideoEnded: () => void;
  onVideoRef?: (el: HTMLVideoElement | null) => void;
}) => {
  const localRef = useRef<HTMLVideoElement | null>(null);

  // Play/pause based on active state
  useEffect(() => {
    const video = localRef.current;
    if (!video) return;
    if (active) {
      video.currentTime = 0;
      video.muted = muted;
      video.play().catch(() => {
        // If unmuted play fails, fallback to muted
        video.muted = true;
        video.play().catch(() => {});
      });
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [active]);

  // Sync muted state
  useEffect(() => {
    const video = localRef.current;
    if (!video || !active) return;
    video.muted = muted;
  }, [muted, active]);

  // Register ref with parent
  useEffect(() => {
    if (onVideoRef) onVideoRef(localRef.current);
    return () => { if (onVideoRef) onVideoRef(null); };
  }, [onVideoRef]);

  const setRef = (el: HTMLVideoElement | null) => {
    localRef.current = el;
    if (onVideoRef) onVideoRef(el);
  };

  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    if (banner.link_url) {
      return (
        <a href={banner.link_url} target="_blank" rel="noopener noreferrer" className="block absolute inset-0">
          {children}
        </a>
      );
    }
    return <div className="absolute inset-0">{children}</div>;
  };

  return (
    <div
      className={cn(
        "absolute inset-0 transition-opacity duration-700",
        active ? "opacity-100 z-[1]" : "opacity-0 z-0 pointer-events-none"
      )}
    >
      <Wrapper>
        {banner.media_type === 'video' ? (
          <video
            ref={setRef}
            src={banner.media_url}
            className="w-full h-full object-cover"
            playsInline
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
        )}
      </Wrapper>
    </div>
  );
};