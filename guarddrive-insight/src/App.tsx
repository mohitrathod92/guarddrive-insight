import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Layout from "@/components/Layout";
import Index from "./pages/Index.tsx";
import MonitorPage from "./pages/MonitorPage.tsx";
import FleetMapPage from "./pages/FleetMapPage.tsx";
import AnalyticsPage from "./pages/AnalyticsPage.tsx";
import DriversPage from "./pages/DriversPage.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ErrorBoundary>
          <Routes>
            <Route
              path="/"
              element={
                <Layout>
                  <Index />
                </Layout>
              }
            />
            <Route
              path="/monitor"
              element={
                <Layout showSession pageTitle="Live Monitor">
                  <MonitorPage />
                </Layout>
              }
            />
            <Route
              path="/fleet"
              element={
                <Layout hideFooter pageTitle="Fleet Map">
                  <FleetMapPage />
                </Layout>
              }
            />
            <Route
              path="/analytics"
              element={
                <Layout showSession pageTitle="Analytics">
                  <AnalyticsPage />
                </Layout>
              }
            />
            <Route
              path="/drivers"
              element={
                <Layout showSession pageTitle="Drivers">
                  <DriversPage />
                </Layout>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ErrorBoundary>
      </TooltipProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
