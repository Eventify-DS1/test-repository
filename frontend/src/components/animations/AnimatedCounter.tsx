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
  const animationRef = useRef<any>(null);

  useEffect(() => {
    const element = counterRef.current;
    if (!element) return;

    // Función para animar el contador
    const animateCounter = () => {
      // Si ya hay una animación corriendo, detenerla
      if (animationRef.current) {
        anime.remove(animationRef.current);
      }

      // Si ya se animó antes, actualizar desde el valor actual
      if (hasAnimated.current) {
        const currentText = element.textContent?.replace(suffix, '') || '0';
        const currentValue = parseInt(currentText) || 0;
        const obj = { value: currentValue };
        
        animationRef.current = anime({
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
      } else {
        // Primera animación
        hasAnimated.current = true;
        const obj = { value: 0 };
        
        animationRef.current = anime({
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
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter();
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(element);

    // Verificar si el elemento ya está visible
    const rect = element.getBoundingClientRect();
    const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
    
    let timeoutId: NodeJS.Timeout | null = null;
    
    // Si el elemento ya está visible, animar inmediatamente
    if (isVisible) {
      // Usar un pequeño delay para asegurar que el DOM esté listo
      timeoutId = setTimeout(() => {
        animateCounter();
      }, 100);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      observer.disconnect();
      if (animationRef.current) {
        anime.remove(animationRef.current);
      }
    };
  }, [end, duration, suffix]);

  return (
    <div ref={counterRef} className={className}>
      0{suffix}
    </div>
  );
};

