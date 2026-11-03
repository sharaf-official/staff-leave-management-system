import { useEffect, useState } from "react";

// Demo loading state. In E3, replace this with the real API loading state.
export default function useLoading(ms = 700) {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return loading;
}