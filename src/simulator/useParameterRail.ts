import { useEffect, useMemo, useState } from "react";
import {
  clampParameterRailWidth,
  DEFAULT_VIEWPORT_WIDTH,
  getParameterRailMaxWidth,
  PARAMETER_RAIL_DEFAULT_WIDTH,
  PARAMETER_RAIL_MIN_WIDTH,
  PARAMETER_RAIL_WIDTH_STORAGE_KEY
} from "./simulatorConfig";

interface UseParameterRailResult {
  isParameterRailOpen: boolean;
  parameterRailWidth: number;
  parameterRailMinWidth: number;
  parameterRailMaxWidth: number;
  toggleParameterRail: () => void;
  setParameterRailWidth: (nextWidth: number) => void;
}

function getViewportWidth(): number {
  return typeof window === "undefined" ? DEFAULT_VIEWPORT_WIDTH : window.innerWidth;
}

function readInitialRailWidth(): number {
  const viewportWidth = getViewportWidth();

  if (typeof window === "undefined") {
    return clampParameterRailWidth(PARAMETER_RAIL_DEFAULT_WIDTH, viewportWidth);
  }

  try {
    const savedWidth = Number(window.localStorage.getItem(PARAMETER_RAIL_WIDTH_STORAGE_KEY));
    if (Number.isFinite(savedWidth)) {
      return clampParameterRailWidth(savedWidth, viewportWidth);
    }
  } catch {
    // Ignore storage failures and keep the rail usable.
  }

  return clampParameterRailWidth(PARAMETER_RAIL_DEFAULT_WIDTH, viewportWidth);
}

export function useParameterRail(): UseParameterRailResult {
  const [isParameterRailOpen, setIsParameterRailOpen] = useState(true);
  const [viewportWidth, setViewportWidth] = useState(() => getViewportWidth());
  const [parameterRailWidth, setStoredParameterRailWidth] = useState(() => readInitialRailWidth());

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncRailWidth = () => {
      const nextViewportWidth = window.innerWidth;
      setViewportWidth(nextViewportWidth);
      setStoredParameterRailWidth((current) => clampParameterRailWidth(current, nextViewportWidth));
    };

    syncRailWidth();
    window.addEventListener("resize", syncRailWidth);
    return () => window.removeEventListener("resize", syncRailWidth);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(PARAMETER_RAIL_WIDTH_STORAGE_KEY, String(parameterRailWidth));
    } catch {
      // Ignore storage failures and keep the rail usable.
    }
  }, [parameterRailWidth]);

  const parameterRailMaxWidth = useMemo(
    () => getParameterRailMaxWidth(viewportWidth),
    [viewportWidth]
  );

  return {
    isParameterRailOpen,
    parameterRailWidth,
    parameterRailMinWidth: PARAMETER_RAIL_MIN_WIDTH,
    parameterRailMaxWidth,
    toggleParameterRail: () => setIsParameterRailOpen((current) => !current),
    setParameterRailWidth: (nextWidth) =>
      setStoredParameterRailWidth(clampParameterRailWidth(nextWidth, viewportWidth))
  };
}
