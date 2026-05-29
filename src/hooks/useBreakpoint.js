import { useState, useEffect } from "react";

function calc() {
  const w = window.innerWidth;
  return w < 640 ? "phone" : w < 1100 ? "tablet" : "desktop";
}

export function useBreakpoint() {
  const [bp, setBp] = useState(calc);
  useEffect(() => {
    const handler = () => setBp(calc());
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return bp;
}
