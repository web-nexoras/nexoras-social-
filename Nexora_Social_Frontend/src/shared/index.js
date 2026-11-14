// Shared Cross-Cutting Primitives
import api from "./api/axios";

export { default as api } from "./api/axios";
export * from "./api/config";
export * from "./utils/apiCache";
export { ThemeProvider, useTheme } from "./context/ThemeContext";
export { ToastProvider, useToast } from "./context/ToastContext";
export { default as Layout } from "./components/layout/Layout";
export { default as Navbar } from "./components/layout/Navbar";
export { default as Sidebar } from "./components/layout/Sidebar";
export { default as Topbar } from "./components/layout/Topbar";
export { default as DashboardShell } from "./components/layout/DashboardShell";
export { default as PublicLayout } from "./components/layout/PublicLayout";
export { default as Skeleton } from "./components/ui/Skeleton";
export { default as PageLoader } from "./components/ui/PageLoader";
export { default as ProtectedRoute } from "./components/routing/ProtectedRoute";

export default api;
