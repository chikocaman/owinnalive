import { useEffect, useRef, useState } from "react";

export function useScrollDirection() {
  const [isHidden, setIsHidden] = useState(false);
  const lastScrollRef = useRef(0);
  const scrollTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      const isScrollingDown = currentScroll > lastScrollRef.current;
      
      // Only hide if scrolled down more than 5px (avoid jitter)
      if (isScrollingDown && currentScroll > lastScrollRef.current + 5) {
        setIsHidden(true);
      } else if (!isScrollingDown) {
        setIsHidden(false);
      }
      
      lastScrollRef.current = currentScroll;
      
      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Reset on scroll stop
      scrollTimeoutRef.current = window.setTimeout(() => {
        lastScrollRef.current = currentScroll;
      }, 150);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return isHidden;
}
