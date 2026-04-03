import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import MonitorPage from "./pages/MonitorPage.tsx";
import FleetMapPage from "./pages/FleetMapPage.tsx";
import AnalyticsPage from "./pages/AnalyticsPage.tsx";
import DriversPage from "./pages/DriversPage.tsx";
import OverSpeedingPage from "./pages/OverSpeedingPage.tsx";
import RashDrivingPage from "./pages/RashDrivingPage.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/monitor" element={<MonitorPage />} />
          <Route path="/fleet" element={<FleetMapPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/drivers" element={<DriversPage />} />
          <Route path="/overspeeding" element={<OverSpeedingPage />} />
          <Route path="/rashdriving" element={<RashDrivingPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
