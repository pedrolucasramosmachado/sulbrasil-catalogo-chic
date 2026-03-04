import { useState, useEffect, useCallback, useRef } from 'react';
import { useBanners, Banner } from '@/hooks/useBanners';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const BannerCarousel = () => {
  const { activeBanners, loading } = useBanners();
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const count = activeBanners.length;

  const next = useCallback(() => {
    if (count <= 1) return;
    setCurrent(c => (c + 1) % count);
  }, [count]);

  const prev = useCallback(() => {
    if (count <= 1) return;
    setCurrent(c => (c - 1 + count) % count);
  }, [count]);

  // Auto-play
  useEffect(() => {
    if (count <= 1) return;
    timerRef.current = setInterval(next, 5000);
    return () => clearInterval(timerRef.current);
  }, [next, count]);

  const resetTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(next, 5000);
  };

  if (loading || count === 0) return null;

  const banner = activeBanners[current];
  const isVertical = banner.aspect_ratio === '9:16';

  return (
    <section className="w-full bg-black/5">
      <div className="container mx-auto px-4 py-3 sm:py-4">
        <div className="relative overflow-hidden rounded-xl shadow-medium">
          {/* Slide area */}
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
              />
            ))}
          </div>

          {/* Navigation arrows */}
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

          {/* Dots */}
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

const BannerSlide = ({ banner, active }: { banner: Banner; active: boolean }) => {
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
            src={banner.media_url}
            className="w-full h-full object-cover"
            autoPlay
            muted
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
