import { useState, useEffect } from "react";
import { getComplimentStyles } from "../api";

export interface HotStyle {
  title: string;
}

export const useHotStyles = () => {
  const [hotStyles, setHotStyles] = useState<HotStyle[]>([]);
  const [loadingHotStyles, setLoadingHotStyles] = useState(false);

  useEffect(() => {
    fetchHotStyles();
  }, []);

  const fetchHotStyles = async () => {
    if (hotStyles.length > 0) return;

    setLoadingHotStyles(true);
    try {
      const styles = await getComplimentStyles();
      setHotStyles(styles);
    } catch (e) {
      console.error("Failed to fetch hot styles", e);
    } finally {
      setLoadingHotStyles(false);
    }
  };

  return { hotStyles, loadingHotStyles };
};
