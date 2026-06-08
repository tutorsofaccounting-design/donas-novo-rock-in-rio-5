import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import CompreAgora from "./pages/CompreAgora";
import Ingressos from "./pages/Ingressos";
import Checkout from "./pages/Checkout";
import Pagamento from "./pages/Pagamento";
import Identificacao from "./pages/Identificacao";
import Dados from "./pages/Dados";
import PagamentoFinal from "./pages/PagamentoFinal";
import PagamentoCartao from "./pages/PagamentoCartao";
import Pix from "./pages/Pix";
import ScrollToTop from "./components/ScrollToTop";
import AuthModal from "./components/AuthModal";
import { AuthProvider } from "./context/AuthContext";
// Admin panel
import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminEvents from "./pages/admin/AdminEvents";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import { AdminAuthProvider } from "./context/AdminAuthContext";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <AdminAuthProvider>
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/compre-agora" element={<CompreAgora />} />
              <Route path="/ingressos" element={<Ingressos />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/pagamento" element={<Pagamento />} />
              <Route path="/identificacao" element={<Identificacao />} />
              <Route path="/dados" element={<Dados />} />
              <Route path="/pagamento-final" element={<PagamentoFinal />} />
              <Route path="/pagamento-cartao" element={<PagamentoCartao />} />
              <Route path="/pix" element={<Pix />} />

              {/* Admin panel */}
              <Route path="/donaspainel" element={<AdminLogin />} />
              <Route
                element={
                  <AdminProtectedRoute>
                    <AdminLayout />
                  </AdminProtectedRoute>
                }
              >
                <Route path="/donaspainel/dashboard" element={<AdminDashboard />} />
                <Route path="/donaspainel/pedidos" element={<AdminOrders />} />
                <Route path="/donaspainel/eventos" element={<AdminEvents />} />
                <Route path="/donaspainel/usuarios" element={<AdminUsers />} />
                <Route path="/donaspainel/config" element={<AdminSettings />} />
              </Route>
            </Routes>
            <AuthModal />
          </AdminAuthProvider>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
