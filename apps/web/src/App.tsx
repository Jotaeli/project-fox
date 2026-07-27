import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Navigate, Route, BrowserRouter, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext.js";
import { LoginPage } from "./auth/LoginPage.js";
import { AppShell } from "./layout/AppShell.js";
import { ProtectedRoute } from "./layout/ProtectedRoute.js";
import { ToastProvider } from "./lib/toast.js";
import { AnotarPage } from "./modules/anotar/AnotarPage.js";
import { CriarPage } from "./modules/criar/CriarPage.js";
import { HomePage } from "./modules/home/HomePage.js";
import { RotinaPage } from "./modules/rotina/RotinaPage.js";

const queryClient = new QueryClient();

function LoginRoute() {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (session) return <Navigate to="/" replace />;
  return <LoginPage />;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginRoute />} />
              <Route
                element={
                  <ProtectedRoute>
                    <AppShell />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<HomePage />} />
                <Route path="/rotina" element={<RotinaPage />} />
                <Route path="/anotar" element={<AnotarPage />} />
                <Route path="/criar" element={<CriarPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
