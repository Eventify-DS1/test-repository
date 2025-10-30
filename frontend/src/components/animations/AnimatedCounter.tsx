import { useEffect, useRef } from "react";
import anime from "animejs";

interface AnimatedCounterProps {
  end: number;
  duration?: number;
  suffix?: string;
  className?: string;
}

export const AnimatedCounter = ({ 
  end, 
  duration = 2000, 
  suffix = "", 
  className = "" 
}: AnimatedCounterProps) => {
  const counterRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const element = counterRef.current;
    if (!element || hasAnimated.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated.current) {
            hasAnimated.current = true;
            
            const obj = { value: 0 };
            
            anime({
              targets: obj,
              value: end,
              duration: duration,
              easing: 'easeOutExpo',
              round: 1,
              update: () => {
                if (element) {
                  element.textContent = Math.floor(obj.value) + suffix;
                }
              }
            });
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [end, duration, suffix]);

  return (
    <div ref={counterRef} className={className}>
      0{suffix}
    </div>
  );
};

