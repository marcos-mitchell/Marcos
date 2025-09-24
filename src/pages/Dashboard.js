import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Bell, Filter, Camera, AlertTriangle, Clock, Activity } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const camerasMock = [
  { id: 1, name: "E. PRINCIPAL", url: "http://localhost:8080/cam1", alert: false, totalEventos: 0 },
  { id: 2, name: "FAUMIL", url: "http://localhost:8080/cam2", alert: false, totalEventos: 0 },
  { id: 3, name: "H. MILITAR", url: "http://localhost:8080/cam3", alert: false, totalEventos: 0 },
  { id: 4, name: "E. SECUNDÁRIA", url: "http://localhost:8080/cam4", alert: false, totalEventos: 0 },
];

export default function Dashboard({ currentUser, onLogout }) { // ✅ Recebe currentUser e onLogout
  const [cameras, setCameras] = useState(camerasMock);
  const [activeCam, setActiveCam] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [filterAlert, setFilterAlert] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const location = useLocation();

  // Relógio em tempo real
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulação de alertas aleatórios
  useEffect(() => {
    const interval = setInterval(() => {
      const randomId = Math.floor(Math.random() * cameras.length) + 1;
      setCameras(prev =>
        prev.map(cam => {
          if (cam.id === randomId) {
            const newAlert = {
              id: Date.now(),
              camName: cam.name,
              time: new Date().toLocaleTimeString(),
            };
            setAlerts(a => [...a, newAlert]);
            return { ...cam, alert: true, totalEventos: cam.totalEventos + 1 };
          }
          return { ...cam, alert: false };
        })
      );
      setActiveCam(randomId);

      setTimeout(() => {
        setActiveCam(null);
        setCameras(prev => prev.map(cam => ({ ...cam, alert: false })));
      }, 5000);
    }, 10000);
    return () => clearInterval(interval);
  }, [cameras.length]);

  // Remove popups automaticamente
  useEffect(() => {
    if (alerts.length === 0) return;
    const timer = setTimeout(() => setAlerts(prev => prev.slice(1)), 5000);
    return () => clearTimeout(timer);
  }, [alerts]);

  const totalEventos = cameras.reduce((acc, c) => acc + c.totalEventos, 0);
  const totalCameras = cameras.length;
  const totalAlerts = cameras.filter(c => c.alert).length;
  const filteredCameras = filterAlert ? cameras.filter(c => c.alert) : cameras;

  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <motion.div
        initial={{ x: -250 }}
        animate={{ x: sidebarOpen ? 0 : -250 }}
        transition={{ duration: 0.3 }}
        className="fixed top-0 left-0 h-full w-60 bg-gray-800 shadow-lg p-5 z-50"
      >
        <h2 className="text-2xl font-bold mb-6">WatchBase</h2>
        <ul className="space-y-4">
          <li>
            <Link to="/" className={`block hover:text-blue-400 ${location.pathname === "/" ? "text-blue-400 font-semibold" : ""}`}>📊 Dashboard</Link>
          </li>
          <li>
            <Link to="/historico" className={`block hover:text-blue-400 ${location.pathname === "/historico" ? "text-blue-400 font-semibold" : ""}`}>📈 Histórico 24h</Link>
          </li>
          <li>
            <Link to="/config" className={`block hover:text-blue-400 ${location.pathname === "/config" ? "text-blue-400 font-semibold" : ""}`}>⚙️ Configurações</Link>
          </li>
          <li>
            <Link to="/alertas" className={`block hover:text-blue-400 ${location.pathname === "/alertas" ? "text-blue-400 font-semibold" : ""}`}>🚨 Alertas</Link>
          </li>

          {/* Apenas admins podem ver a tela de usuários */}
          {currentUser?.role === "admin" && (
            <li>
              <Link to="/usuarios" className={`block hover:text-blue-400 ${location.pathname === "/usuarios" ? "text-blue-400 font-semibold" : ""}`}>👥 Usuários</Link>
            </li>
          )}
        </ul>
      </motion.div>

      <div className="flex-1 p-6 ml-0 md:ml-0">
        {/* Botão Hamburger */}
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 mb-4 text-gray-200 hover:bg-gray-700 rounded-lg md:hidden">
          <Menu size={24} />
        </button>

        {/* Cabeçalho com logout */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-center md:text-left flex-1">WatchBase Dashboard</h1>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div onClick={() => setFilterAlert(false)} className="bg-gray-800 p-4 rounded-2xl shadow-lg flex flex-col items-center gap-2 cursor-pointer hover:bg-gray-700 relative">
            <Camera className="text-green-400 w-8 h-8" />
            <h3 className="text-lg font-semibold">Câmeras Ativas</h3>
            <p className="text-3xl font-bold text-green-400">{totalCameras}</p>
          </div>

          <div onClick={() => setFilterAlert(true)} className="bg-gray-800 p-4 rounded-2xl shadow-lg flex flex-col items-center gap-2 cursor-pointer hover:bg-gray-700 relative">
            <AlertTriangle className="text-red-400 w-8 h-8" />
            <h3 className="text-lg font-semibold">Eventos Atuais</h3>
            <p className="text-3xl font-bold text-red-500">{totalAlerts}</p>
            {totalAlerts > 0 && (
              <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">{totalAlerts}</span>
            )}
          </div>

          <div className="bg-gray-800 p-4 rounded-2xl shadow-lg flex flex-col items-center gap-2">
            <Clock className="text-yellow-400 w-8 h-8" />
            <h3 className="text-lg font-semibold">Próximo Alerta</h3>
            <p className="text-xl text-yellow-400">{totalAlerts > 0 ? "Monitorando..." : "Sem alertas"}</p>
          </div>

          <div className="bg-gray-800 p-4 rounded-2xl shadow-lg flex flex-col items-center gap-2">
            <Activity className="text-blue-400 w-8 h-8" />
            <h3 className="text-lg font-semibold">Total Eventos 24h</h3>
            <p className="text-3xl font-bold text-blue-400">{totalEventos}</p>
          </div>
        </div>

        {/* Botão filtro */}
        <div className="flex justify-end mb-4">
          <button className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg hover:bg-gray-700" onClick={() => setFilterAlert(!filterAlert)}>
            <Filter size={20} />
            {filterAlert ? "Mostrar todas câmeras" : "Mostrar apenas alertas"}
          </button>
        </div>

        {/* Grid de câmeras */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {filteredCameras.map(cam => {
            const formattedDate = currentTime.toLocaleDateString();
            const formattedTime = currentTime.toLocaleTimeString();
            return (
              <motion.div key={cam.id} layout
                className={`relative rounded-2xl overflow-hidden shadow-lg cursor-pointer transform transition-transform hover:scale-105 
                  ${cam.alert ? "ring-4 ring-red-500 animate-pulse" : "ring-2 ring-gray-700"}`}
                onClick={() => setActiveCam(cam.id)}
              >
                <img src={cam.url} alt={cam.name} className="w-full h-64 object-cover" />

                {/* Overlay superior */}
                <div className="absolute top-0 left-0 right-0 bg-black bg-opacity-50 p-2 flex justify-between items-center">
                  <div>
                    <div className="text-sm text-gray-300">{formattedDate} {formattedTime}</div>
                    <div className="text-lg font-semibold text-white">{cam.name}</div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${cam.alert ? "bg-red-500 animate-pulse" : "bg-green-400"}`}></div>
                </div>

                {/* Painel inferior */}
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 p-2 text-sm flex justify-between items-center text-gray-200">
                  <span>Total Eventos: {cam.totalEventos}</span>
                  {cam.alert && <Bell className="text-red-500" size={18} />}
                  {/* Botão editar apenas para editor ou admin */}
                  {currentUser?.role !== "viewer" && (
                    <button className="ml-2 bg-blue-600 px-2 py-1 rounded-lg text-white hover:bg-blue-700 text-xs">Editar</button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Zoom fullscreen */}
        <AnimatePresence>
          {activeCam && (
            <motion.div key="zoom" className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div className="relative w-4/5 h-4/5" initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}>
                <img src={cameras.find(c => c.id === activeCam)?.url} alt="camera zoom" className="w-full h-full object-cover rounded-2xl ring-4 ring-red-500" />
                <div className="absolute bottom-4 left-4 bg-gray-800 p-2 rounded-lg">Eventos da câmera: {cameras.find(c => c.id === activeCam)?.totalEventos}</div>
                <Link to="/historico" className="absolute bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700">Ver Histórico</Link>
                <button className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg" onClick={() => setActiveCam(null)}>Fechar</button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Popups de alerta */}
        <div className="fixed top-4 right-4 space-y-2 z-50">
          <AnimatePresence>
            {alerts.map(alert => (
              <motion.div key={alert.id} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} transition={{ duration: 0.3 }}
                className="bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                <Bell size={20} />
                <div>
                  <p className="font-bold">Alerta em {alert.camName}</p>
                  <p className="text-sm">Hora: {alert.time}</p>
                  {/* Apenas editor/admin pode resetar alerta */}
                  {currentUser?.role !== "viewer" && (
                    <button className="ml-2 bg-gray-700 px-2 py-1 rounded-lg text-xs hover:bg-gray-600">Resetar</button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
