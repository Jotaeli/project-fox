import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Navigate, Route, BrowserRouter, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext.js";
import { LoginPage } from "./auth/LoginPage.js";
import { AppShell } from "./layout/AppShell.js";
import { ProtectedRoute } from "./layout/ProtectedRoute.js";
import { ToastProvider } from "./lib/toast.js";
import { ModulePlaceholder } from "./modules/placeholder/ModulePlaceholder.js";
import { RotinaPage } from "./modules/rotina/RotinaPage.js";

const queryClient = new QueryClient();

function LoginRoute() {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (session) return <Navigate to="/rotina" replace />;
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
                <Route path="/" element={<Navigate to="/rotina" replace />} />
                <Route path="/rotina" element={<RotinaPage />} />
                <Route path="/anotar" element={<ModulePlaceholder title="Anotar" />} />
                <Route path="/criar" element={<ModulePlaceholder title="Desenvolver/Criar" />} />
                <Route path="*" element={<Navigate to="/rotina" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
