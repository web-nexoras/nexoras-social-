import React, { Component, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@features/auth/context/AuthContext";
import { OAuthCallbackGate } from "@features/auth";
import { SocketProvider } from "@features/chat/context/SocketContext";
import {
  ThemeProvider,
  ToastProvider,
  PublicLayout,
  DashboardShell,
  ProtectedRoute,
  PageLoader,
} from "@shared";

const Home = lazy(() => import("@features/home/pages/Home"));
const Login = lazy(() => import("@features/auth/pages/Login"));
const Signup = lazy(() => import("@features/auth/pages/Signup"));
const VerifyOtp = lazy(() => import("@features/auth/pages/VerifyOtp"));
const Profile = lazy(() => import("@features/profile/pages/Profile"));
const UserProfile = lazy(() => import("@features/friends/pages/UserProfile"));
const Friends = lazy(() => import("@features/friends/pages/Friends"));
const Chat = lazy(() => import("@features/chat/pages/Chat"));
const Feed = lazy(() => import("@features/feed/pages/Feed"));
const Stories = lazy(() => import("@features/feed/pages/Stories"));
const Dashboard = lazy(() => import("@features/dashboard/pages/Dashboard"));
const Groups = lazy(() => import("@features/groups/pages/Groups"));
const PaymentSuccess = lazy(() => import("@features/groups/pages/PaymentSuccess"));
const PaymentFail = lazy(() => import("@features/groups/pages/PaymentFail"));
const PaymentCancel = lazy(() => import("@features/groups/pages/PaymentCancel"));
const AdminGroups = lazy(() => import("@features/admin/pages/AdminGroups"));
const AdminUsers = lazy(() => import("@features/admin/pages/AdminUsers"));
const PaymentHistory = lazy(() => import("@features/groups/pages/PaymentHistory"));
const Notifications = lazy(() => import("@features/notifications/pages/Notifications"));
const ForgotPassword = lazy(() => import("@features/auth/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@features/auth/pages/ResetPassword"));
const AuthCallback = lazy(() => import("@features/auth/pages/AuthCallback"));

class RouteErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error("Page failed to render", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
          <section className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-lg">
            <h1 className="text-xl font-bold text-slate-900">This page could not load</h1>
            <p className="mt-2 text-sm text-slate-600">
              Check your connection and try loading the page again.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white"
            >
              Reload page
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <SocketProvider>
            <ToastProvider>
              <OAuthCallbackGate />
              <RouteErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* Auth pages — clean, full screen, no navbar */}
                    <Route path="/signin" element={<Login />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/verify-otp" element={<VerifyOtp />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/reset-password/:token" element={<ResetPassword />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="/" element={<Home />} />

                    {/* Public pages (with navbar) */}
                    <Route element={<PublicLayout />}>
                      <Route path="/payment/success" element={<PaymentSuccess />} />
                      <Route path="/payment/fail" element={<PaymentFail />} />
                      <Route path="/payment/cancel" element={<PaymentCancel />} />
                    </Route>

                    {/* Protected routes with sidebar + topbar */}
                    <Route
                      element={
                        <ProtectedRoute>
                          <DashboardShell />
                        </ProtectedRoute>
                      }
                    >
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/user/:id" element={<UserProfile />} />
                      <Route path="/friends" element={<Friends />} />
                      <Route path="/feed" element={<Feed />} />
                      <Route path="/stories" element={<Stories />} />
                      <Route path="/chat" element={<Chat />} />
                      <Route path="/groups" element={<Groups />} />
                      <Route path="/payments" element={<PaymentHistory />} />
                      <Route path="/notifications" element={<Notifications />} />
                      <Route path="/admin/users" element={<AdminUsers />} />
                      <Route path="/admin/groups" element={<AdminGroups />} />
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </RouteErrorBoundary>
            </ToastProvider>
          </SocketProvider>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
