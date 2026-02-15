import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import InitiationRequestPage from "./pages/InitiationRequestPage";
import CipherPage from "./pages/CipherPage";
import DoctrinePage from "./pages/DoctrinePage";
import ArchivesPage from "./pages/ArchivesPage";
import GuardianDashboard from "./pages/GuardianDashboard";
import ReportMemberPage from "./pages/ReportMemberPage";
import ExitRequestPage from "./pages/ExitRequestPage";
import MessagesPage from "./pages/MessagesPage";
import KnowledgePage from "./pages/KnowledgePage";
import TribunalPage from "./pages/TribunalPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ProfileSettingsPage from "./pages/ProfileSettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/initiation-request" element={<InitiationRequestPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            
            {/* Protected routes */}
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/cipher" element={<ProtectedRoute><CipherPage /></ProtectedRoute>} />
            <Route path="/doctrine" element={<ProtectedRoute><DoctrinePage /></ProtectedRoute>} />
            <Route path="/archives" element={<ProtectedRoute><ArchivesPage /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
            <Route path="/report" element={<ProtectedRoute><ReportMemberPage /></ProtectedRoute>} />
            <Route path="/exit-request" element={<ProtectedRoute><ExitRequestPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><ProfileSettingsPage /></ProtectedRoute>} />
            
            {/* Tribunal */}
            <Route path="/tribunal" element={<ProtectedRoute><TribunalPage /></ProtectedRoute>} />
            
            {/* Knowledge module - Archontes & Guardian */}
            <Route path="/knowledge" element={<ProtectedRoute><KnowledgePage /></ProtectedRoute>} />
            
            {/* Guardian Supreme only */}
            <Route path="/guardian" element={<ProtectedRoute requireGuardian><GuardianDashboard /></ProtectedRoute>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
