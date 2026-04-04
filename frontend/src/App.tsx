import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index.tsx";
import MonitorPage from "./pages/MonitorPage.tsx";
import FleetMapPage from "./pages/FleetMapPage.tsx";
import AnalyticsPage from "./pages/AnalyticsPage.tsx";
import DriversPage from "./pages/DriversPage.tsx";
import OverSpeedingPage from "./pages/OverSpeedingPage.tsx";
import RashDrivingPage from "./pages/RashDrivingPage.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import NotFound from "./pages/NotFound.tsx";
import Navbar from "@/components/Navbar";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { tickFleetMovement } from "./features/fleet/fleetSlice.ts";
import GlobalRealTimeTracker from "@/components/GlobalRealTimeTracker";

const GlobalFleetTick = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(tickFleetMovement());
    }, 1000);
    return () => clearInterval(interval);
  }, [dispatch]);
  return null;
};

const queryClient = new QueryClient();

function AppShell() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <>
      <GlobalFleetTick />
      <GlobalRealTimeTracker />
      {!isLoginPage && <Navbar />}
      <main className={!isLoginPage ? 'pt-16 min-h-screen' : ''}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/monitor" element={<MonitorPage />} />
          <Route path="/fleet" element={<FleetMapPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/drivers" element={<DriversPage />} />
          <Route path="/overspeeding" element={<OverSpeedingPage />} />
          <Route path="/rashdriving" element={<RashDrivingPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
