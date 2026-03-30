import { Suspense, lazy, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import LandingPage from "./marketing/LandingPage";

const SimulatorApp = lazy(() => import("./simulator/SimulatorApp"));

function RouteEffects() {
  const location = useLocation();

  useEffect(() => {
    const routeClass = location.pathname.startsWith("/sim") ? "route-sim" : "route-landing";
    document.body.classList.remove("route-landing", "route-sim");
    document.body.classList.add(routeClass);
    document.title =
      routeClass === "route-sim" ? "Operational Stress Labs Simulator" : "LeanStorming Operational Intelligence";
  }, [location.pathname]);

  return null;
}

function RouteLoadingFallback() {
  return (
    <div className="route-loading-shell">
      <div className="route-loading-card">
        <span>Loading simulator</span>
      </div>
    </div>
  );
}

function SimulatorRouteGate() {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <SimulatorApp />
    </Suspense>
  );
}

export default function App() {
  return (
    <>
      <RouteEffects />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/sim" element={<SimulatorRouteGate />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
