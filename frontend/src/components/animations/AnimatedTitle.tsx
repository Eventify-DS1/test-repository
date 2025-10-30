import { useEffect, useRef } from "react";
import anime from "animejs";

interface AnimatedTitleProps {
  text: string;
  className?: string;
  delay?: number;
  as?: 'h1' | 'h2' | 'h3';
}

export const AnimatedTitle = ({ text, className = "", delay = 0, as = 'h1' }: AnimatedTitleProps) => {
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const element = titleRef.current;
    if (!element) return;

    // Envolver cada letra en un span
    element.innerHTML = text
      .split("")
      .map((char) => {
        if (char === " ") return `<span class="inline-block">&nbsp;</span>`;
        return `<span class="inline-block opacity-0">${char}</span>`;
      })
      .join("");

    // Animar las letras
    anime({
      targets: element.querySelectorAll("span"),
      opacity: [0, 1],
      translateY: [30, 0],
      rotateZ: [10, 0],
      duration: 800,
      delay: anime.stagger(30, { start: delay }),
      easing: 'easeOutExpo'
    });
  }, [delay, text]);

  const Tag = as;

  return (
    <Tag ref={titleRef as any} className={className} />
  );
};

