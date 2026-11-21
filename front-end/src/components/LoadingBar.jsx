import { useEffect, useRef, useState } from "react";

// thin animated bar at the top of the screen while any API request is running
export default function LoadingBar() {
  const [busy, setBusy] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    const onChange = (e) => {
      if (e.detail > 0) {
        // wait 120 ms so very fast requests do not flicker
        if (!timer.current) timer.current = setTimeout(() => setBusy(true), 120);
      } else {
        clearTimeout(timer.current);
        timer.current = null;
        setBusy(false);
      }
    };
    window.addEventListener("api-loading", onChange);
    return () => {
      window.removeEventListener("api-loading", onChange);
      clearTimeout(timer.current);
    };
  }, []);

  if (!busy) return null;
  return (
    <div className="lb-bar" role="progressbar" aria-label="Loading">
      <span />
    </div>
  );
}