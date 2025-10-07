// D:\Projects\watchbase-web\src\Dashboard.jsx
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Filter, Camera, AlertTriangle, Activity, RefreshCw, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import RealCamera from "../components/RealCamera";
import { useWebSocket } from "../hooks/useWebSocket";

const camerasMock = [
  { 
    id: 1, 
    name: "E. PRINCIPAL", 
    location: "Entrada Principal",
    url: "http://localhost:8080/cam1", 
    alert: false, 
    totalEventos: 0,
    isRealCamera: true,
  },
  { 
    id: 2, 
    name: "FAUMIL", 
    location: "Área Interna",
    url: "http://localhost:8080/cam2", 
    alert: false, 
    totalEventos: 0,
    isRealCamera: false 
  },
  { 
    id: 3, 
    name: "H. MILITAR", 
    location: "Área Externa",
    url: "http://localhost:8080/cam3", 
    alert: false, 
    totalEventos: 0,
    isRealCamera: false 
  },
  { 
    id: 4, 
    name: "E. SECUNDÁRIA", 
    location: "Portão Traseiro",
    url: "http://localhost:8080/cam4", 
    alert: false, 
    totalEventos: 0,
    isRealCamera: false 
  },
];

export default function Dashboard({ currentUser }) {
  const [cameras, setCameras] = useState([]);
  const [activeCam, setActiveCam] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [filterAlert, setFilterAlert] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [cameraPermission, setCameraPermission] = useState(null);

  // WebSocket integration - Agora apenas para receber dados, sem UI
  const { latestEvent } = useWebSocket();

  // Verificar permissão da câmera ao iniciar
  useEffect(() => {
    const checkCameraPermission = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setCameraPermission('unsupported');
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        setCameraPermission('granted');
      } catch (err) {
        setCameraPermission('denied');
      }
    };

    checkCameraPermission();
  }, []);

  // Mapear eventos do Arduino Serial para câmeras - CORRIGIDO
  useEffect(() => {
    if (latestEvent && cameras.length > 0) {
      const now = Date.now();
      const camera = cameras.find(cam => cam.name === "E. PRINCIPAL");

      if (camera) {
        const isAlert = latestEvent.distance <= 80;
        const wasAlert = camera.alert;

        setCameras(prev =>
          prev.map(cam =>
            cam.id === camera.id
              ? {
                  ...cam,
                  alert: isAlert,
                  totalEventos: isAlert && !wasAlert ? cam.totalEventos + 1 : cam.totalEventos,
                  currentEvent: latestEvent,
                  lastUpdate: now,
                }
              : cam
          )
        );

        if (isAlert && !wasAlert && camera.isRealCamera) {
          console.log("🚨 ALERTA GRAVE! Zoom imediato da câmera principal.");
          setActiveCam(camera.id); // fullscreen imediato, sem delay e sem animações
        }

        if (isAlert && !wasAlert) {
          setAlerts(prev => [
            {
              id: Date.now() + Math.random(),
              camName: camera.name,
              time: latestEvent.time,
              distance: latestEvent.distance,
              description: `Sensor: ${latestEvent.distance}cm - ${latestEvent.severity}`,
              source: "arduino",
              timestamp: now,
            },
            ...prev.slice(0, 3),
          ]);
        }
      }
    }
  }, [latestEvent, cameras]);

  // Carregar câmeras
  useEffect(() => {
    const loadCameras = async () => {
      try {
        setLoading(true);
        setError(null);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setCameras(camerasMock);
        
      } catch (err) {
        setError("Falha ao carregar câmeras.");
      } finally {
        setLoading(false);
      }
    };

    loadCameras();
  }, []);

  // Relógio em tempo real
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Remove popups automaticamente após 6 segundos
  useEffect(() => {
    if (alerts.length === 0) return;
    const timer = setTimeout(() => {
      setAlerts(prev => prev.slice(1));
    }, 6000);
    return () => clearTimeout(timer);
  }, [alerts]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setCameras(prevCameras => 
        prevCameras.map(cam => ({
          ...cam,
          totalEventos: cam.totalEventos + Math.floor(Math.random() * 2)
        }))
      );
      
    } catch (err) {
      setError("Erro ao atualizar câmeras");
    } finally {
      setRefreshing(false);
    }
  };

  const retryLoad = () => {
    setError(null);
    setLoading(true);
    setTimeout(() => {
      setCameras(camerasMock);
      setLoading(false);
    }, 1000);
  };

  const totalEventos = cameras.reduce((acc, c) => acc + c.totalEventos, 0);
  const totalCameras = cameras.length;
  const totalAlerts = cameras.filter(c => c.alert).length;
  const filteredCameras = filterAlert ? cameras.filter(c => c.alert) : cameras;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">WatchBase Dashboard</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-800 p-4 rounded-2xl shadow-lg animate-pulse">
              <div className="h-8 bg-gray-700 rounded mb-2"></div>
              <div className="h-6 bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-xl overflow-hidden shadow-2xl animate-pulse">
              <div className="h-48 bg-gray-700"></div>
              <div className="p-3">
                <div className="h-4 bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-700 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col items-center justify-center">
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-6 max-w-md text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-red-400" />
          <h2 className="text-xl font-bold mb-2">Erro ao Carregar</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={retryLoad}
              className="bg-blue-500 px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              Tentar Novamente
            </button>
            <button
              onClick={handleRefresh}
              className="bg-gray-700 px-4 py-2 rounded-lg hover:bg-gray-600"
            >
              <RefreshCw size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Cabeçalho simplificado */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">WatchBase Dashboard</h1>
          <div className="text-gray-400 mt-1">
            Sistema de monitoramento em tempo real
          </div>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className={`flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg hover:bg-gray-700 transition ${
            refreshing ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <RefreshCw size={20} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Atualizando..." : "Atualizar"}
        </button>
      </div>

      {/* Indicador de refresh */}
      {refreshing && (
        <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-3 mb-4 flex items-center gap-2">
          <RefreshCw size={16} className="animate-spin" />
          <span>Atualizando dados das câmeras...</span>
        </div>
      )}

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 p-4 rounded-2xl shadow-lg flex flex-col items-center gap-2">
          <Camera className="text-green-400 w-8 h-8" />
          <h3 className="text-lg font-semibold">Câmeras Activas</h3>
          <p className="text-3xl font-bold text-green-400">{totalCameras}</p>
        </div>

        <div className="bg-gray-800 p-4 rounded-2xl shadow-lg flex flex-col items-center gap-2">
          <AlertTriangle className="text-red-400 w-8 h-8" />
          <h3 className="text-lg font-semibold">Alertas Ativos</h3>
          <p className="text-3xl font-bold text-red-500">{totalAlerts}</p>
          {totalAlerts > 0 && (
            <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {totalAlerts}
            </span>
          )}
        </div>

        <div className="bg-gray-800 p-4 rounded-2xl shadow-lg flex flex-col items-center gap-2">
          <Activity className="text-blue-400 w-8 h-8" />
          <h3 className="text-lg font-semibold">Eventos de Hoje</h3>
          <p className="text-3xl font-bold text-blue-400">{totalEventos}</p>
        </div>

        <div className="bg-gray-800 p-4 rounded-2xl shadow-lg flex flex-col items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            cameraPermission === 'granted' ? 'bg-green-500' : 'bg-yellow-500'
          }`}>
            <Camera size={16} className="text-white" />
          </div>
          <h3 className="text-lg font-semibold">Status</h3>
          <p className="text-lg font-bold">
            {cameraPermission === 'granted' ? '✅ Ativo' : '⚠️ Verificar'}
          </p>
        </div>
      </div>

      {/* Botão filtro */}
      <div className="flex justify-end mb-4">
        <button
          type="button"
          className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg hover:bg-gray-700"
          onClick={() => setFilterAlert(!filterAlert)}
        >
          <Filter size={20} />
          {filterAlert ? "Mostrar todas" : "Apenas alertas"}
        </button>

      </div>

      {/* Grid de câmeras */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredCameras.map(cam => (
          cam.isRealCamera ? (
            <RealCamera
              key={cam.id}
              id={cam.id}
              name={cam.name}
              location={cam.location}
              isActive={true}
              currentEvent={cam.currentEvent}
              totalEventos={cam.totalEventos}
              onClick={setActiveCam}
            />
          ) : (
            <CameraCard 
              key={cam.id} 
              camera={cam} 
              currentTime={currentTime}
              isActive={activeCam === cam.id}
              onClick={() => setActiveCam(cam.id)}
            />
          )
        ))}
      </div>
       {/*======================= ANALISE ==========================================================*/}
      {/* Zoom Fullscreen */}
      <AnimatePresence>
        {activeCam && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              // Fechar ao clicar no backdrop
              if (e.target === e.currentTarget) {
                setActiveCam(null);
              }
            }}
          >
            <motion.div
              className="relative w-full max-w-6xl h-full max-h-[90vh] bg-black rounded-2xl overflow-hidden"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
            >
              {cameras.find(c => c.id === activeCam)?.isRealCamera ? (
                <RealCameraZoom 
                  camera={cameras.find(c => c.id === activeCam)}
                  currentTime={currentTime}
                  onClose={() => setActiveCam(null)}
                />
              ) : (
                <CameraZoom 
                  camera={cameras.find(c => c.id === activeCam)}
                  currentTime={currentTime}
                  onClose={() => setActiveCam(null)}
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Popups de alerta */}
      <AlertPopups alerts={alerts} onClear={id => setAlerts(prev => prev.filter(a => a.id !== id))} />
    </div>
  );
}

// Componente CameraCard
const CameraCard = ({ camera, currentTime, isActive, onClick }) => {
  const formattedDate = currentTime.toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const formattedTime = currentTime.toLocaleTimeString('pt-PT', {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return (
    <motion.div
      className={`relative rounded-xl overflow-hidden shadow-2xl cursor-pointer transform transition-all duration-300 hover:scale-105 group ${
        camera.alert 
          ? "ring-3 ring-red-500 animate-pulse" 
          : "ring-1 ring-gray-600 hover:ring-2 hover:ring-blue-400"
      }`}
      onClick={onClick}
    >
      <div className="relative">
        <img
          src={camera.url}
          alt={camera.name}
          className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
        />
        
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-3">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-bold text-white truncate">
                {camera.name}
              </h3>
              <div className="text-xs text-gray-300 mt-1">
                <div>{formattedDate}</div>
                <div className="font-mono">{formattedTime}</div>
              </div>
            </div>
            
            <div className="flex flex-col items-center">
              <div
                className={`w-3 h-3 rounded-full mb-1 ${
                  camera.alert ? "bg-red-500 animate-pulse" : "bg-green-400"
                }`}
              ></div>
              {camera.alert && <Bell className="text-red-400" size={14} />}
            </div>
          </div>
        </div>

        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
            <div className="bg-black/70 rounded-lg px-3 py-2 text-sm">
              Clique para ampliar
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-300">
            Eventos: <span className="font-bold text-white">{camera.totalEventos}</span>
          </span>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            camera.alert 
              ? "bg-red-500/20 text-red-300 border border-red-500/30" 
              : "bg-green-500/20 text-green-300 border border-green-500/30"
          }`}>
            {camera.alert ? "ALERTA" : "NORMAL"}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Componente Zoom para Câmera Simulada
const CameraZoom = ({ camera, currentTime, onClose }) => {
  return (
    <>
      <img
        src={camera?.url}
        alt="Zoom camera"
        className="w-full h-full object-contain"
      />
      
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-white">{camera?.name}</h2>
            <div className="text-gray-300 mt-2">
              <div className="text-lg">
                {currentTime.toLocaleDateString('pt-PT', { 
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
              <div className="text-xl font-mono font-bold">
                {currentTime.toLocaleTimeString('pt-PT')}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-3xl font-bold text-white mb-2">
              Eventos: {camera?.totalEventos || 0}
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-bold ${
              camera?.alert
                ? "bg-red-500 text-white animate-pulse"
                : "bg-green-500 text-white"
            }`}>
              {camera?.alert ? "🚨 ALERTA ATIVO" : "✅ STATUS NORMAL"}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center">
        <Link
          to="/historico"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-blue-700 transition-all font-semibold flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <Activity size={20} />
          Ver Histórico
        </Link>
        
        <button
          className="bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-red-700 transition-all font-semibold flex items-center gap-2"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          Fechar
        </button>
      </div>
    </>
  );
};

// Componente de Zoom para Câmera Real
const RealCameraZoom = ({ camera, currentTime, onClose }) => {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);

  useEffect(() => {
    let mediaStream = null;

    const initializeCamera = async () => {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            facingMode: 'environment' 
          } 
        });
        
        setStream(mediaStream);
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error('Erro ao acessar câmera:', err);
      }
    };

    initializeCamera();

    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <>
      <div className="w-full h-full bg-black flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-contain"
        />
      </div>
      
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Camera size={24} className="text-green-400" />
              {camera?.name} - CÂMERA REAL
            </h2>
            <div className="text-gray-300 mt-2">
              <div className="text-lg">{camera?.location}</div>
              <div className="text-xl font-mono font-bold">
                {currentTime.toLocaleTimeString('pt-PT')}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-3xl font-bold text-white mb-2">
              Eventos: {camera?.totalEventos || 0}
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-bold ${
              camera?.alert
                ? "bg-red-500 text-white animate-pulse"
                : "bg-green-500 text-white"
            }`}>
              {camera?.alert ? "🚨 ALERTA ATIVO" : "✅ STATUS NORMAL"}
            </div>
          </div>
        </div>
      </div>

      {camera?.currentEvent && (
        <div className="absolute top-20 right-6 bg-black/70 rounded-lg p-4 min-w-64">
          <h3 className="text-lg font-bold text-yellow-400 mb-2">Dados do Sensor</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-300">Distância:</span>
              <span className={`font-bold ${
                camera.currentEvent.distance <= 80 ? 'text-red-400' : 'text-green-400'
              }`}>
                {camera.currentEvent.distance}cm
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Status:</span>
              <span className="text-yellow-400">{camera.currentEvent.severity}</span>
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center">
        <Link
          to="/historico"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-blue-700 transition-all font-semibold flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <Activity size={20} />
          Ver Histórico
        </Link>
        
        <button
          className="bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-red-700 transition-all font-semibold flex items-center gap-2"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          Fechar
        </button>
      </div>

      <div className="absolute top-6 left-6 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2">
        <Camera size={16} />
        TRANSMISSÃO AO VIVO
      </div>
    </>
  );
};

// Componente AlertPopups
const AlertPopups = ({ alerts, onClear }) => (
  <div className="fixed top-4 right-4 space-y-2 z-40">
    <AnimatePresence>
      {alerts.map(alert => (
        <motion.div
          key={alert.id}
          initial={{ opacity: 0, x: 100, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 100, scale: 0.8 }}
          transition={{ type: "spring", damping: 25 }}
          className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 min-w-80"
        >
          <div className="bg-white/20 p-2 rounded-full">
            <Bell size={24} className="animate-pulse" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-lg">Alerta de Segurança</p>
            <p className="text-sm opacity-90">
              {alert.camName} - {alert.distance}cm
            </p>
            <p className="text-xs opacity-75">
              {alert.description} • {alert.time}
            </p>
          </div>
          <button 
            onClick={() => onClear(alert.id)}
            className="bg-white/20 hover:bg-white/30 p-1 rounded-full transition"
          >
            ×
          </button>
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);