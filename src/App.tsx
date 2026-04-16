import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ProtectedRoute from "@/components/ProtectedRoute";
import ProfileCompletionRoute from "@/components/ProfileCompletionRoute";
import RouteErrorBoundary from "@/components/RouteErrorBoundary";
import { RealtimeProvider } from "@/contexts/RealtimeContext";
import { AuthProvider } from "@/lib/auth";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import EmailVerificationNotice from "./pages/EmailVerificationNotice";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import MainLayout from "./components/MainLayout";
import Settings from "./pages/Settings";
import Intentions from "./pages/Intentions";
import Premium from "./pages/Premium";
import Payment from "./pages/Payment";
import CurrencyWallet from "./pages/CurrencyWallet";
import Likes from "./pages/Likes";
import WatchVideos from "./pages/WatchVideos";
import Discover from "./pages/Discover";
import Messages from "./pages/Messages";
import Profile from "./pages/Profile";
import ProfileSetup from "./pages/ProfileSetup";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <RealtimeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/email-verification-sent" element={<EmailVerificationNotice />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:userId/:token" element={<ResetPassword />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/app/profile-setup" element={<ProfileSetup />} />
              <Route element={<ProfileCompletionRoute />}>
                <Route path="/app" element={<MainLayout />}>
                  <Route index element={<Discover />} />
                  <Route path="messages" element={<Messages />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="settings" element={<RouteErrorBoundary title="Configurações"><Settings /></RouteErrorBoundary>} />
                  <Route path="intentions" element={<Intentions />} />
                  <Route path="premium" element={<Premium />} />
                  <Route path="payment" element={<Payment />} />
                  <Route path="currency" element={<CurrencyWallet />} />
                  <Route path="likes" element={<Likes />} />
                  <Route path="watch-videos" element={<WatchVideos />} />
                </Route>
              </Route>
            </Route>
            <Route path="/home" element={<Navigate to="/app" replace />} />
            <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </RealtimeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
