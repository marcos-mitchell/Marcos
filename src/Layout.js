import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, LogOut, AlertCircle, Edit, Trash2 } from "lucide-react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import LoadingSpinner from "./components/LoadingSpinner";

export default function Layout({ currentUser, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [notification, setNotification] = useState("");
  const [globalLoading, setGlobalLoading] = useState(false);
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Simular loading na mudança de rota
  useEffect(() => {
    setGlobalLoading(true);
    setError(null);
    
    const timer = setTimeout(() => {
      setGlobalLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Notificação temporária
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Auto-esconder erros após 5 segundos
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    setNotification("✅ Logout successful!");
    
    setTimeout(() => {
      onLogout();
      navigate("/login");
    }, 3000);
  };

  if (globalLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="large" text="Carregando sistema..." />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <motion.div
        initial={{ x: -250 }}
        animate={{ x: sidebarOpen ? 0 : -250 }}
        transition={{ duration: 0.3 }}
        className="fixed top-0 left-0 h-full w-60 bg-gray-800 shadow-lg p-5 z-50 flex flex-col justify-between"
      >
        <div>
          {/* Perfil do usuário */}
          {currentUser && (
            <div className="flex items-center gap-3 mb-6 border-b border-gray-700 pb-4">
              <img
                src={currentUser.avatar || "https://i.pravatar.cc/150?img=1"}
                alt={currentUser.name}
                className="w-12 h-12 rounded-full border-2 border-blue-500"
              />
              <div>
                <h2 className="text-lg font-semibold">{currentUser.name}</h2>
                <p className="text-sm text-gray-400">{currentUser.role}</p>
              </div>
            </div>
          )}

          <h2 className="text-2xl font-bold mb-6">WatchBase</h2>
          <ul className="space-y-4">
            <li>
              <Link
                to="/"
                className={`flex items-center gap-2 hover:text-blue-400 ${
                  location.pathname === "/" ? "text-blue-400 font-semibold" : ""
                }`}
              >
                📊 Dashboard
              </Link>
            </li>
            <li>
              <Link
                to="/historico"
                className={`flex items-center gap-2 hover:text-blue-400 ${
                  location.pathname === "/historico" ? "text-blue-400 font-semibold" : ""
                }`}
              >
                📈 Histórico 24h
              </Link>
            </li>
            <li>
              <Link
                to="/config"
                className={`flex items-center gap-2 hover:text-blue-400 ${
                  location.pathname === "/config" ? "text-blue-400 font-semibold" : ""
                }`}
              >
                ⚙️ Configurações
              </Link>
            </li>
            {currentUser?.role === "Admin" && (
              <li>
                <Link
                  to="/usuarios"
                  className={`flex items-center gap-2 hover:text-blue-400 ${
                    location.pathname === "/usuarios" ? "text-blue-400 font-semibold" : ""
                  }`}
                >
                  👥 Usuários
                </Link>
              </li>
            )}
          </ul>
        </div>

        {/* Botão logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 p-2 rounded-lg hover:bg-red-500 hover:text-white transition w-full"
        >
          <LogOut size={20} />
          <span>Sair</span>
        </button>
      </motion.div>

      {/* Conteúdo principal */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-60' : 'ml-0'}`}>
        {/* Botão Hamburger */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed top-4 left-4 p-2 text-gray-200 hover:bg-gray-700 rounded-lg z-40 md:hidden"
        >
          <Menu size={24} />
        </button>

        {/* Conteúdo das páginas */}
        <div className="p-6">
          <Outlet />
        </div>
      </div>

      {/* Modal de confirmação logout */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white text-black rounded-lg shadow-lg p-6 w-80">
            <h2 className="text-lg font-semibold mb-4">Confirmar Logout</h2>
            <p className="mb-6">Tem certeza que deseja sair?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notificação de Logout Successful */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 font-semibold"
          >
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Banner de Erro */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 font-semibold max-w-md flex items-center gap-2"
          >
            <AlertCircle size={20} />
            <span>{error}</span>
            <button 
              onClick={() => setError(null)}
              className="ml-2 bg-red-600 px-2 py-1 rounded text-sm hover:bg-red-700"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}