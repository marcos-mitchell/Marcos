// D:\Projects\watchbase-web\src\Dashboard.jsx
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Filter, Camera, AlertTriangle, Clock, Activity, RefreshCw, AlertCircle, Cpu, Cable, Usb } from "lucide-react";
import { Link } from "react-router-dom";
import { LoadingCard, LoadingCamera } from "../components/LoadingSpinner";
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
    serialDevice: "Arduino UNO - COM7"
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

  // WebSocket integration para dados SERIAL do Arduino
  const { isConnected, events, connectionStatus, simulateArduinoEvent, latestEvent } = useWebSocket();

  // Verificar permissão da câmera ao iniciar
  useEffect(() => {
    const checkCameraPermission = async () => {
      try {
        // Verificar se a API de mídia está disponível
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setCameraPermission('unsupported');
          return;
        }

        // Verificar permissões (apenas verificação básica)
        const permissions = await navigator.permissions.query({ name: 'camera' });
        setCameraPermission(permissions.state);
        
        console.log('📷 Status da câmera:', permissions.state);
      } catch (err) {
        console.warn('⚠️ Não foi possível verificar permissões da câmera:', err);
        setCameraPermission('prompt');
      }
    };

    checkCameraPermission();
  }, []);

  // Mapear eventos do Arduino Serial para câmeras
  useEffect(() => {
    if (latestEvent && cameras.length > 0) {
      console.log('🎯 Processando evento serial do Arduino:', latestEvent);
      
      const cameraNameMap = {
        'Camera Principal': 'E. PRINCIPAL',
        'Camera Entrada': 'FAUMIL', 
        'Camera Garagem': 'H. MILITAR',
        'Camera Jardim': 'E. SECUNDÁRIA'
      };
      
      const cameraName = cameraNameMap[latestEvent.camera] || 'E. PRINCIPAL';
      const cameraId = cameras.find(cam => cam.name === cameraName)?.id || 1;

      // Atualizar estado da câmera com evento real do Arduino
      setCameras(prev => prev.map(cam => {
        if (cam.id === cameraId) {
          const isAlert = latestEvent.distance <= 80;
          const newAlert = {
            id: Date.now(),
            camName: cam.name,
            time: latestEvent.time || new Date().toLocaleTimeString(),
            distance: latestEvent.distance,
            description: latestEvent.description,
            severity: latestEvent.severity,
            source: 'arduino-serial'
          };

          if (isAlert) {
            setAlerts(prevAlerts => [newAlert, ...prevAlerts.slice(0, 9)]);
          }

          return { 
            ...cam, 
            alert: isAlert, 
            totalEventos: cam.totalEventos + 1,
            currentEvent: latestEvent
          };
        }
        return cam;
      }));

      // Destacar câmera com evento por 5 segundos
      setActiveCam(cameraId);
      setTimeout(() => setActiveCam(null), 5000);
    }
  }, [latestEvent, cameras.length]);

  // Carregar câmeras com inicialização automática da câmera real
  useEffect(() => {
    const loadCameras = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Simular carga das câmeras
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Atualizar mock da câmera real com status de permissão
        const updatedCameras = camerasMock.map(cam => 
          cam.isRealCamera 
            ? { ...cam, cameraPermission } 
            : cam
        );
        
        setCameras(updatedCameras);
        
        // Adicionar alerta informativo sobre a câmera
        if (cameraPermission === 'granted') {
          setAlerts(prev => [{
            id: Date.now(),
            camName: "Sistema",
            time: new Date().toLocaleTimeString(),
            message: "Câmera real ativada com sucesso!",
            source: 'camera-system'
          }, ...prev.slice(0, 9)]);
        }
        
      } catch (err) {
        setError("Falha ao carregar câmeras.");
      } finally {
        setLoading(false);
      }
    };

    loadCameras();
  }, [cameraPermission]);

  // Relógio em tempo real
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Remove popups automaticamente
  useEffect(() => {
    if (alerts.length === 0) return;
    const timer = setTimeout(() => setAlerts(prev => prev.slice(1)), 5000);
    return () => clearTimeout(timer);
  }, [alerts]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setCameras(prevCameras => 
        prevCameras.map(cam => ({
          ...cam,
          totalEventos: cam.totalEventos + Math.floor(Math.random() * 3)
        }))
      );
      
      setAlerts(prev => [...prev, {
        id: Date.now(),
        camName: "Sistema",
        time: new Date().toLocaleTimeString(),
        message: "Dados atualizados com sucesso!",
        source: 'system'
      }]);
      
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

  // Função para testar simulação de evento do Arduino
  const testArduinoSimulation = () => {
    simulateArduinoEvent(
      "Camera Principal", 
      Math.floor(Math.random() * 150), 
      "Teste de simulação serial"
    );
  };

  const getSerialStatusColor = () => {
    switch (connectionStatus) {
      case 'conectado': return 'text-green-400';
      case 'conectando...': return 'text-yellow-400';
      case 'erro': return 'text-red-400';
      default: return 'text-red-400';
    }
  };

  const getSerialStatusIcon = () => {
    switch (connectionStatus) {
      case 'conectado': return <Cable className="text-green-400" size={16} />;
      case 'conectando...': return <Cable className="text-yellow-400 animate-pulse" size={16} />;
      default: return <Cable className="text-red-400" size={16} />;
    }
  };

  const getCameraStatusText = () => {
    switch (cameraPermission) {
      case 'granted': return 'Câmera: Ativa ✅';
      case 'denied': return 'Câmera: Bloqueada ❌';
      case 'prompt': return 'Câmera: Aguardando permissão ⏳';
      case 'unsupported': return 'Câmera: Não suportada ⚠️';
      default: return 'Câmera: Verificando...';
    }
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
            <LoadingCard key={i} />
          ))}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <LoadingCamera key={i} />
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
      {/* Cabeçalho com status SERIAL e CÂMERA */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">WatchBase Dashboard</h1>
          <div className="text-gray-400 flex items-center gap-3 mt-1">
            <div className="flex items-center gap-1">
              {getSerialStatusIcon()}
              <span className={getSerialStatusColor()}>
                Arduino Serial: {connectionStatus}
              </span>
            </div>
            <div className="flex items-center gap-1 text-blue-400">
              <Camera size={14} />
              <span>{getCameraStatusText()}</span>
            </div>
            {latestEvent && (
              <div className="flex items-center gap-1 text-yellow-400">
                <Usb size={14} />
                <span>Último: {latestEvent.distance}cm ({latestEvent.severity})</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={testArduinoSimulation}
            className="flex items-center gap-2 bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            title="Simular dados do Arduino para teste"
          >
            <Cpu size={16} />
            Testar Arduino
          </button>
          
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
      </div>

      {/* Indicador de refresh */}
      {refreshing && (
        <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-3 mb-4 flex items-center gap-2">
          <RefreshCw size={16} className="animate-spin" />
          <span>Atualizando dados das câmeras...</span>
        </div>
      )}

      {/* Cards de resumo com info SERIAL */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div
          onClick={() => setFilterAlert(false)}
          className="bg-gray-800 p-4 rounded-2xl shadow-lg flex flex-col items-center gap-2 cursor-pointer hover:bg-gray-700 relative"
        >
          <Camera className="text-green-400 w-8 h-8" />
          <h3 className="text-lg font-semibold">Câmeras Ativas</h3>
          <p className="text-3xl font-bold text-green-400">{totalCameras}</p>
        </div>

        <div
          onClick={() => setFilterAlert(true)}
          className="bg-gray-800 p-4 rounded-2xl shadow-lg flex flex-col items-center gap-2 cursor-pointer hover:bg-gray-700 relative"
        >
          <AlertTriangle className="text-red-400 w-8 h-8" />
          <h3 className="text-lg font-semibold">Eventos Atuais</h3>
          <p className="text-3xl font-bold text-red-500">{totalAlerts}</p>
          {totalAlerts > 0 && (
            <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {totalAlerts}
            </span>
          )}
        </div>

        <div className="bg-gray-800 p-4 rounded-2xl shadow-lg flex flex-col items-center gap-2">
          <Cable className="text-yellow-400 w-8 h-8" />
          <h3 className="text-lg font-semibold">Porta Serial</h3>
          <p className="text-lg font-bold text-yellow-400">COM7</p>
        </div>

        <div className="bg-gray-800 p-4 rounded-2xl shadow-lg flex flex-col items-center gap-2">
          <Activity className="text-blue-400 w-8 h-8" />
          <h3 className="text-lg font-semibold">Total Eventos 24h</h3>
          <p className="text-3xl font-bold text-blue-400">{totalEventos}</p>
        </div>
      </div>

      {/* Botão filtro */}
      <div className="flex justify-end mb-4">
        <button
          className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg hover:bg-gray-700"
          onClick={() => setFilterAlert(!filterAlert)}
        >
          <Filter size={20} />
          {filterAlert ? "Mostrar todas câmeras" : "Mostrar apenas alertas"}
        </button>
      </div>

      {/* Grid de câmeras */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredCameras.map(cam => (
          cam.isRealCamera ? (
            // Câmera Real com vídeo ao vivo
            <RealCamera
              key={cam.id}
              id={cam.id}
              name={cam.name}
              location={cam.location}
              isActive={true}
              currentEvent={cam.currentEvent}
              serialInfo={cam.serialDevice}
            />
          ) : (
            // Câmeras Simuladas
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

      {/* Zoom Fullscreen */}
      <AnimatePresence>
        {activeCam && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative w-full max-w-6xl h-full max-h-[90vh] bg-black rounded-2xl overflow-hidden"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
            >
              <img
                src={cameras.find(c => c.id === activeCam)?.url}
                alt="Zoom camera"
                className="w-full h-full object-contain"
              />
              
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {cameras.find(c => c.id === activeCam)?.name}
                    </h2>
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
                      Eventos: {cameras.find(c => c.id === activeCam)?.totalEventos}
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                      cameras.find(c => c.id === activeCam)?.alert
                        ? "bg-red-500 text-white animate-pulse"
                        : "bg-green-500 text-white"
                    }`}>
                      {cameras.find(c => c.id === activeCam)?.alert ? "🚨 ALERTA ATIVO" : "✅ STATUS NORMAL"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center">
                <Link
                  to="/historico"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-blue-700 transition-all font-semibold flex items-center gap-2"
                >
                  <Activity size={20} />
                  Ver Histórico Completo
                </Link>
                
                <button
                  className="bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-red-700 transition-all font-semibold flex items-center gap-2"
                  onClick={() => setActiveCam(null)}
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Popups de alerta do ARDUINO */}
      <AlertPopups alerts={alerts} onClear={id => setAlerts(prev => prev.filter(a => a.id !== id))} />
    </div>
  );
}

// Componente CameraCard (mantido do design original)
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
      layout
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
              {camera.alert && (
                <Bell className="text-red-400" size={14} />
              )}
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

// Componente AlertPopups (adaptado para Arduino)
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
            <p className="font-bold text-lg">
              {alert.source === 'arduino-serial' ? 'Alerta Arduino' : 
               alert.source === 'camera-system' ? 'Sistema de Câmera' : 'Alerta de Segurança'}
            </p>
            <p className="text-sm opacity-90">
              {alert.source === 'arduino-serial' 
                ? `${alert.camName} - ${alert.distance}cm` 
                : `Câmera: ${alert.camName}`}
            </p>
            <p className="text-xs opacity-75">
              {alert.source === 'arduino-serial' 
                ? alert.description 
                : alert.message || `Hora: ${alert.time}`}
            </p>
            {alert.message && alert.source !== 'arduino-serial' && (
              <p className="text-xs opacity-75">{alert.message}</p>
            )}
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