"use client";

import {
  Children,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
  type TransitionEvent,
} from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export function SwipeDotsCarousel({
  children,
  ariaLabel,
  className,
  viewportClassName,
  trackClassName,
  slideClassName,
  dotsClassName,
  autoplayMs = 0,
  pauseOnHover = true,
  dotLabels,
  loop = false,
  respectReducedMotion = false,
}: {
  children: ReactNode;
  ariaLabel: string;
  className?: string;
  viewportClassName?: string;
  trackClassName?: string;
  slideClassName?: string;
  dotsClassName?: string;
  autoplayMs?: number;
  pauseOnHover?: boolean;
  dotLabels?: string[];
  loop?: boolean;
  respectReducedMotion?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const slides = Children.toArray(children);
  const loopEnabled = loop && slides.length > 1;
  const effectiveAutoplayMs =
    respectReducedMotion && reduceMotion ? 0 : autoplayMs;
  const renderedSlides = loopEnabled
    ? [slides[slides.length - 1], ...slides, slides[0]]
    : slides;
  const viewportRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Array<HTMLDivElement | null>>([]);
  const pointerIdRef = useRef<number | null>(null);
  const startXRef = useRef(0);
  const dragOffsetRef = useRef(0);
  const resumeTimeoutRef = useRef<number | null>(null);
  const suppressClickRef = useRef(false);
  const transitionResetRef = useRef<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(loopEnabled ? 1 : 0);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [animateTrack, setAnimateTrack] = useState(true);

  const isInteractiveTarget = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false;

    return Boolean(
      target.closest(
        'button, a, input, select, textarea, label, summary, [role="button"], [data-carousel-no-drag="true"]'
      )
    );
  };

  const clampIndex = (index: number) => {
    if (slides.length === 0) return 0;
    return Math.max(0, Math.min(index, slides.length - 1));
  };

  const normalizeLoopIndex = (index: number) => {
    if (slides.length === 0) return 0;
    return ((index % slides.length) + slides.length) % slides.length;
  };

  const renderIndexFromLogical = (index: number) =>
    loopEnabled ? normalizeLoopIndex(index) + 1 : clampIndex(index);

  const logicalIndexFromRender = (index: number) => {
    if (!loopEnabled) return clampIndex(index);
    return normalizeLoopIndex(index - 1);
  };

  const getSlideCenter = (index: number) => {
    const slide = slideRefs.current[index];
    if (!slide) return null;
    return slide.offsetLeft + slide.offsetWidth / 2;
  };

  const scheduleTransitionReset = () => {
    if (transitionResetRef.current) {
      window.clearTimeout(transitionResetRef.current);
    }

    transitionResetRef.current = window.setTimeout(() => {
      setAnimateTrack(true);
      transitionResetRef.current = null;
    }, 32);
  };

  const goToIndex = (index: number, options?: { instant?: boolean }) => {
    const nextIndex = loopEnabled ? index : clampIndex(index);
    const instant = options?.instant ?? false;

    if (instant) {
      setAnimateTrack(false);
      setCurrentIndex(nextIndex);
      scheduleTransitionReset();
      return;
    }

    setAnimateTrack(true);
    setCurrentIndex(nextIndex);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentIndex((previous) => {
      if (slides.length === 0) return 0;
      return renderIndexFromLogical(logicalIndexFromRender(previous));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.length, loopEnabled]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    let frameId = 0;
    const measure = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        setViewportWidth(viewport.clientWidth);
      });
    };

    measure();

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(viewport);
    slideRefs.current.forEach((slide) => {
      if (slide) resizeObserver.observe(slide);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
    };
  }, [slides.length]);

  useEffect(() => {
    return () => {
      if (resumeTimeoutRef.current) {
        window.clearTimeout(resumeTimeoutRef.current);
      }
      if (transitionResetRef.current) {
        window.clearTimeout(transitionResetRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (slides.length <= 1 || effectiveAutoplayMs <= 0) return;
    if ((pauseOnHover && isHovered) || isDragging || isInteracting) return;

    const intervalId = window.setInterval(() => {
      if (loopEnabled) {
        goToIndex(currentIndex + 1);
        return;
      }

      const wraps = currentIndex >= slides.length - 1;
      goToIndex(wraps ? 0 : currentIndex + 1, { instant: wraps });
    }, effectiveAutoplayMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [currentIndex, effectiveAutoplayMs, isDragging, isHovered, isInteracting, loopEnabled, pauseOnHover, slides.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const pauseForInteraction = () => {
    if (resumeTimeoutRef.current) {
      window.clearTimeout(resumeTimeoutRef.current);
    }

    setIsInteracting(true);
  };

  const resumeAfterInteraction = () => {
    if (resumeTimeoutRef.current) {
      window.clearTimeout(resumeTimeoutRef.current);
    }

    resumeTimeoutRef.current = window.setTimeout(() => {
      setIsInteracting(false);
    }, 1800);
  };

  const finishDrag = (event: PointerEvent<HTMLDivElement>, shouldAdvance: boolean) => {
    if (pointerIdRef.current !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const activeSlideWidth = slideRefs.current[currentIndex]?.offsetWidth ?? viewportWidth;
    const threshold = Math.min(120, Math.max(44, activeSlideWidth * 0.18));
    const offset = dragOffsetRef.current;

    if (shouldAdvance && Math.abs(offset) >= threshold) {
      const delta = offset < 0 ? 1 : -1;
      goToIndex(currentIndex + delta);
      suppressClickRef.current = true;
    } else if (Math.abs(offset) > 10) {
      suppressClickRef.current = true;
    }

    dragOffsetRef.current = 0;
    setDragOffset(0);
    setIsDragging(false);
    pointerIdRef.current = null;
    resumeAfterInteraction();
  };

  const handleBlurCapture = (event: React.FocusEvent<HTMLDivElement>) => {
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) {
      return;
    }

    setIsHovered(false);
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (slides.length <= 1) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (isInteractiveTarget(event.target)) return;

    pauseForInteraction();
    pointerIdRef.current = event.pointerId;
    startXRef.current = event.clientX;
    dragOffsetRef.current = 0;
    suppressClickRef.current = false;
    setDragOffset(0);
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== event.pointerId || !isDragging) return;

    const nextOffset = event.clientX - startXRef.current;
    dragOffsetRef.current = nextOffset;
    setDragOffset(nextOffset);
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    finishDrag(event, true);
  };

  const handlePointerCancel = (event: PointerEvent<HTMLDivElement>) => {
    finishDrag(event, false);
  };

  const handleTrackTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (!loopEnabled || event.propertyName !== "transform" || isDragging) return;

    if (currentIndex === 0) {
      goToIndex(slides.length, { instant: true });
      return;
    }

    if (currentIndex === renderedSlides.length - 1) {
      goToIndex(1, { instant: true });
    }
  };

  // eslint-disable-next-line react-hooks/refs
  const activeSlideCenter = getSlideCenter(currentIndex);
  const baseTranslate =
    activeSlideCenter !== null && viewportWidth
      ? viewportWidth / 2 - activeSlideCenter
      : 0;
  const activeDotIndex = logicalIndexFromRender(currentIndex);

  return (
    <div
      className={cn("swipe-dots-carousel", className)}
      data-dragging={isDragging ? "true" : "false"}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={(event) => {
        if (event.target !== event.currentTarget) {
          setIsHovered(true);
        }
      }}
      onBlurCapture={handleBlurCapture}
    >
      <div
        ref={viewportRef}
        className={cn("swipe-dots-viewport scrollbar-hidden", viewportClassName)}
        aria-label={ariaLabel}
        aria-roledescription="carousel"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onClickCapture={(event) => {
          if (suppressClickRef.current) {
            event.preventDefault();
            event.stopPropagation();
            suppressClickRef.current = false;
          }
        }}
      >
        <div
          className={cn("swipe-dots-track", trackClassName)}
          onTransitionEnd={handleTrackTransitionEnd}
          style={{
            transform: `translate3d(${baseTranslate + dragOffset}px, 0, 0)`,
            transitionDuration: isDragging || !animateTrack ? "0ms" : "520ms"
          }}
        >
          {renderedSlides.map((slide, index) => {
            const distance = Math.abs(index - currentIndex);
            const direction = index === currentIndex ? 0 : index < currentIndex ? -1 : 1;
            const isActive = currentIndex === index;

            return (
              <div
                key={loopEnabled ? `rendered-slide-${index}` : index}
                ref={(node) => {
                  slideRefs.current[index] = node;
                }}
                className={cn("swipe-dots-slide", slideClassName)}
                aria-hidden={!isActive}
                data-active={isActive ? "true" : "false"}
                data-neighbor={distance === 1 ? "true" : "false"}
                data-distance={String(Math.min(distance, 3))}
                data-direction={String(direction)}
              >
                {slide}
              </div>
            );
          })}
        </div>
      </div>

      {slides.length > 1 ? (
        <div className={cn("swipe-dots-nav", dotsClassName)}>
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              className="swipe-dots-dot"
              data-active={activeDotIndex === index}
              aria-label={dotLabels?.[index] ?? `Go to slide ${index + 1}`}
              aria-pressed={activeDotIndex === index}
              onClick={() => {
                pauseForInteraction();
                if (!loopEnabled) {
                  goToIndex(index, {
                    instant: Math.abs(index - currentIndex) > 1,
                  });
                  resumeAfterInteraction();
                  return;
                }

                const forwardSteps =
                  (index - activeDotIndex + slides.length) % slides.length;
                const backwardSteps =
                  (activeDotIndex - index + slides.length) % slides.length;

                if (forwardSteps === 0) {
                  resumeAfterInteraction();
                  return;
                }

                if (forwardSteps <= backwardSteps) {
                  goToIndex(currentIndex + forwardSteps);
                } else {
                  goToIndex(currentIndex - backwardSteps);
                }

                resumeAfterInteraction();
              }}
            >
              <span className="sr-only">
                {dotLabels?.[index] ?? `Go to slide ${index + 1}`}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
