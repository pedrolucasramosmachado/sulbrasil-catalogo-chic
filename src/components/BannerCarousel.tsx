import { useState, useEffect, useCallback, useRef } from 'react';
import { useBanners, Banner } from '@/hooks/useBanners';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

export const BannerCarousel = () => {
  const { activeBanners, loading } = useBanners();
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const [volume, setVolume] = useState(0.5);
  const [muted, setMuted] = useState(true);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  const count = activeBanners.length;

  const next = useCallback(() => {
    if (count <= 1) return;
    setCurrent(c => (c + 1) % count);
  }, [count]);

  const prev = useCallback(() => {
    if (count <= 1) return;
    setCurrent(c => (c - 1 + count) % count);
  }, [count]);

  const startAutoPlay = useCallback(() => {
    clearInterval(timerRef.current);
    if (count <= 1) return;
    const currentBanner = activeBanners[current];
    if (currentBanner?.media_type === 'video') return; // Don't auto-advance during video
    timerRef.current = setInterval(next, 5000);
  }, [next, count, current, activeBanners]);

  useEffect(() => {
    startAutoPlay();
    return () => clearInterval(timerRef.current);
  }, [startAutoPlay]);

  const handleVideoEnded = useCallback(() => {
    if (count <= 1) return;
    next();
  }, [next, count]);

  const resetTimer = () => {
    clearInterval(timerRef.current);
    startAutoPlay();
  };

  // Sync volume/muted to all video elements
  useEffect(() => {
    videoRefs.current.forEach(video => {
      video.volume = volume;
      video.muted = muted;
    });
  }, [volume, muted]);

  const registerVideo = useCallback((id: string, el: HTMLVideoElement | null) => {
    if (el) {
      el.volume = volume;
      el.muted = muted;
      videoRefs.current.set(id, el);
    } else {
      videoRefs.current.delete(id);
    }
  }, []);

  if (loading || count === 0) return null;

  const banner = activeBanners[current];
  const isVertical = banner.aspect_ratio === '9:16';
  const currentIsVideo = banner.media_type === 'video';

  return (
    <section className="w-full bg-black/5">
      <div className="container mx-auto px-4 py-3 sm:py-4">
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
                registerVideo={registerVideo}
              />
            ))}
          </div>

          {/* Volume controls for video */}
          {currentIsVideo && (
            <div className="absolute bottom-10 right-3 z-20 flex items-center gap-2 bg-black/50 rounded-full px-2 py-1.5 backdrop-blur-sm">
              <button
                onClick={() => setMuted(m => !m)}
                className="text-white hover:text-white/80 transition-colors"
                aria-label={muted ? 'Ativar som' : 'Mutar'}
              >
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <Slider
                value={[muted ? 0 : volume * 100]}
                onValueChange={([v]) => {
                  setVolume(v / 100);
                  if (v > 0 && muted) setMuted(false);
                  if (v === 0) setMuted(true);
                }}
                max={100}
                step={1}
                className="w-20"
              />
            </div>
          )}

          {count > 1 && (
            <>
              <button
                onClick={() => { prev(); resetTimer(); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 sm:p-2 transition-colors z-10"
                aria-label="Anterior"
              >
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <button
                onClick={() => { next(); resetTimer(); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 sm:p-2 transition-colors z-10"
                aria-label="Próximo"
              >
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </>
          )}

          {count > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {activeBanners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setCurrent(i); resetTimer(); }}
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

const BannerSlide = ({ banner, active, registerVideo }: { banner: Banner; active: boolean; registerVideo: (id: string, el: HTMLVideoElement | null) => void }) => {
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
        active ? "opacity-100 z-[1]" : "opacity-0 z-0"
      )}
    >
      <Wrapper>
        {banner.media_type === 'video' ? (
          <video
            ref={el => registerVideo(banner.id, el)}
            src={banner.media_url}
            className="w-full h-full object-cover"
            autoPlay
            loop
            playsInline
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