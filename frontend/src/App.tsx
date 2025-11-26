import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import Landing from "./pages/Landing";
import Calendario from "./pages/Calendario";
import EventsList from "./pages/EventsList";
import Dashboard from "./pages/Dashboard";
import Search from "./pages/Search";
import CreateEvent from "./pages/CreateEvent";
import Profile from "./pages/Profile";
import EventDetail from "./pages/EventDetail";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import RateEvents from "./pages/RateEvents";
import RateEventForm from "./pages/RateEventForm";
import ConfirmAttendance from "./pages/ConfirmAttendance";
import DashboardCalendar from "./pages/DashboardCalendar";
import EditEvent from "./pages/EditEvent";
import DashboardLayout from "./components/layout/DashboardLayout";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ScrollToTop />
        <Toaster />
        <Sonner position="top-center" />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/calendario" element={<Calendario />} />
          <Route path="/eventos" element={<EventsList />} />
          <Route path="/event/:id" element={<EventDetail />} />
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/search" element={<Search />} />
          <Route path="/dashboard/calendario" element={<DashboardCalendar />} />
            <Route path="/dashboard/event/:id" element={<EventDetail />} /> 
            <Route path="/dashboard/create" element={<CreateEvent />} />
            <Route path="/dashboard/profile" element={<Profile />} />
            <Route path="/dashboard/notifications" element={<Notifications />} />
          </Route>
          <Route path="/register" element={<RegisterPage />}/>
          <Route path="/login" element={<LoginPage />}/>
          <Route path="/dashboard/confirmar-asistencia" element={<ConfirmAttendance />} />
          <Route path="/dashboard/rate" element={<RateEvents />} />
          <Route path="/dashboard/rate/:eventId" element={<RateEventForm />} />
          <Route path="/dashboard/eventos/editar/:id" element={<EditEvent />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
