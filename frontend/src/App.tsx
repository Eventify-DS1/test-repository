import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Calendario from "./pages/Calendario";
import EventsList from "./pages/EventsList";
import Dashboard from "./pages/Dashboard";
import Search from "./pages/Search";
import CreateEvent from "./pages/CreateEvent";
import Reports from "./pages/Reports";
import Notifications from "./pages/Notifications";
import RateEvents from "./pages/RateEvents";
import Profile from "./pages/Profile";
import EventDetail from "./pages/EventDetail";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/calendario" element={<Calendario />} />
          <Route path="/eventos" element={<EventsList />} />
          <Route path="/event/:id" element={<EventDetail />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/search" element={<Search />} />
          <Route path="/dashboard/event/:id" element={<EventDetail />} /> 
          <Route path="/dashboard/create" element={<CreateEvent />} />
          <Route path="/dashboard/reports" element={<Reports />} />
          <Route path="/dashboard/notifications" element={<Notifications />} />
          <Route path="/dashboard/rate" element={<RateEvents />} />
          <Route path="/dashboard/profile" element={<Profile />} />
          <Route path="/register" element={<RegisterPage />}/>
          <Route path="/login" element={<LoginPage />}/>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
