import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, LogOut } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";

export default function Layout({ currentUser, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [showToast, setShowToast] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setSidebarOpen(true);
      else setSidebarOpen(false);
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = () => {
    const confirmLogout = window.confirm("Deseja realmente sair?");
    if (!confirmLogout) return;

    if (onLogout) onLogout(); // realiza logout
    setShowToast(true);        // mostra toast

    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="flex min-h-screen bg-gray-900 text-white relative">
      {/* Sidebar */}
      <motion.div
        initial={{ x: -250 }}
        animate={{ x: sidebarOpen ? 0 : window.innerWidth >= 768 ? 0 : -250 }}
        transition={{ duration: 0.3 }}
        className="fixed md:static top-0 left-0 h-full w-60 bg-gray-800 shadow-lg p-5 z-50"
      >
        <h2 className="text-2xl font-bold mb-6">WatchBase</h2>
        <ul className="space-y-4">
          <li>
            <Link
              to="/"
              className={`block hover:text-blue-400 ${
                location.pathname === "/" ? "text-blue-400 font-semibold" : ""
              }`}
            >
              📊 Dashboard
            </Link>
          </li>
          <li>
            <Link
              to="/historico"
              className={`block hover:text-blue-400 ${
                location.pathname === "/historico" ? "text-blue-400 font-semibold" : ""
              }`}
            >
              📈 Histórico 24h
            </Link>
          </li>
          <li>
            <Link
              to="/config"
              className={`block hover:text-blue-400 ${
                location.pathname === "/config" ? "text-blue-400 font-semibold" : ""
              }`}
            >
              ⚙️ Configurações
            </Link>
          </li>
          <li>
            <Link
              to="/alertas"
              className={`block hover:text-blue-400 ${
                location.pathname === "/alertas" ? "text-blue-400 font-semibold" : ""
              }`}
            >
              🚨 Alertas
            </Link>
          </li>

          {currentUser?.role === "admin" && (
            <li>
              <Link
                to="/usuarios"
                className={`block hover:text-blue-400 ${
                  location.pathname === "/usuarios" ? "text-blue-400 font-semibold" : ""
                }`}
              >
                👥 Usuários
              </Link>
            </li>
          )}
        </ul>
      </motion.div>

      {/* Conteúdo principal */}
      <div className={`flex-1 p-6 transition-all duration-300 ${sidebarOpen ? "ml-60" : "ml-0"} md:ml-60`}>
        {/* Hamburger */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-gray-200 hover:bg-gray-700 rounded-lg md:hidden mb-4"
        >
          <Menu size={24} />
        </button>

        {/* Botão logout fixo no canto superior direito */}
        <button
          onClick={handleLogout}
          className="fixed top-4 right-4 flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl text-white font-semibold shadow-lg z-50"
        >
          <LogOut size={20} />
          Sair
        </button>

        {/* Toast moderno: slide in from right */}
        <AnimatePresence>
          {showToast && (
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-20 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50"
            >
              Logout successful!
            </motion.div>
          )}
        </AnimatePresence>

        {/* Conteúdo das páginas */}
        <Outlet />
      </div>
    </div>
  );
}
