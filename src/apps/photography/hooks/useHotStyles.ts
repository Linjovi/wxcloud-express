import { useState, useEffect } from "react";
import { getPhotographyStyles } from "../api";
import { HotStyle } from "../types";

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
      const styles = await getPhotographyStyles();
      setHotStyles(styles);
    } catch (e) {
      console.error("Failed to fetch hot styles", e);
    } finally {
      setLoadingHotStyles(false);
    }
  };

  return { hotStyles, loadingHotStyles };
};
