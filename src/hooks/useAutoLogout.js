import { useEffect, useRef } from 'react';

export const useAutoLogout = (onLogout, timeoutMinutes = 30) => {
  const timeoutRef = useRef(null);
  const onLogoutRef = useRef(onLogout);

  // Keep onLogoutRef current without re-running the effect
  useEffect(() => {
    onLogoutRef.current = onLogout;
  }, [onLogout]);

  useEffect(() => {
    const reset = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        onLogoutRef.current?.();
      }, timeoutMinutes * 60 * 1000);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    events.forEach(event => {
      document.addEventListener(event, reset, true);
    });

    reset(); // Start initial timer

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach(event => {
        document.removeEventListener(event, reset, true);
      });
    };
  }, [timeoutMinutes]);
};