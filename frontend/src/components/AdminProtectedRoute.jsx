import { Navigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";

export default function AdminProtectedRoute({ children }) {
  const { token, checking } = useAdminAuth();
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-[var(--tm-blue)] rounded-full animate-spin" />
      </div>
    );
  }
  if (!token) return <Navigate to="/donaspainel" replace />;
  return children;
}
