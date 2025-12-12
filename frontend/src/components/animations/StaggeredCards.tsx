import { useEffect, useRef, ReactNode } from "react";
import anime from "animejs";

interface StaggeredCardsProps {
  children: ReactNode;
  className?: string;
}

export const StaggeredCards = ({ children, className = "" }: StaggeredCardsProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || hasAnimated.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated.current) {
            hasAnimated.current = true;
            
            const cards = Array.from(element.children);
            
            anime({
              targets: cards,
              opacity: [0, 1],
              translateY: [50, 0],
              scale: [0.8, 1],
              rotateX: [20, 0],
              duration: 1000,
              delay: anime.stagger(150, { start: 200 }),
              easing: 'spring(1, 80, 10, 0)'
            });
          }
        });
      },
      { threshold: 0.2 }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
};

