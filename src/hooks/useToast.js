import { useCallback, useRef, useState } from "react";

export function useToast(duration = 2500) {
  const [toast, setToast] = useState("");
  const timer = useRef(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), duration);
  }, [duration]);

  return { toast, showToast };
}
