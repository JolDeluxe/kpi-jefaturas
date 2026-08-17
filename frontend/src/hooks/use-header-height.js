import { useEffect } from 'react';

export function useHeaderHeight() {
  useEffect(() => {
    const updateHeight = () => {
      const header = document.querySelector('.app-header');
      if (header) {
        const height = header.getBoundingClientRect().height;
        document.documentElement.style.setProperty('--header-actual-height', `${height}px`);
      }
    };
    
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    const header = document.querySelector('.app-header');
    if (header) observer.observe(header);
    
    return () => observer.disconnect();
  }, []);
}
