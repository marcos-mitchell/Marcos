// D:\Projects\watchbase-web\src\components\RealCamera.jsx
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Camera, AlertTriangle, Cpu, Usb, Maximize2 } from "lucide-react";

const RealCamera = ({ 
  id, 
  name, 
  location, 
  isActive, 
  currentEvent, 
  serialInfo, 
  onClick,
  totalEventos 
}) => {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Inicializar câmera automaticamente quando o componente montar
  useEffect(() => {
    let mediaStream = null;

    const initializeCamera = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Solicitar acesso à câmera do usuário
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'environment' 
          } 
        });
        
        setStream(mediaStream);
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        
        console.log(`✅ Câmera real ativada para: ${name}`);
      } catch (err) {
        console.error('❌ Erro ao acessar câmera:', err);
        setError(`Erro na câmera: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    initializeCamera();

    // Cleanup function para parar a câmera quando o componente desmontar
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        console.log(`🛑 Câmera real parada para: ${name}`);
      }
    };
  }, [name]);

  // Atualizar o stream no video element quando disponível
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const formattedTime = new Date().toLocaleTimeString('pt-PT', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const handleClick = () => {
    if (onClick) {
      onClick(id);
    }
  };

  return (
    <motion.div
      layout
      className={`relative rounded-xl overflow-hidden shadow-2xl cursor-pointer transform transition-all duration-300 hover:scale-105 group ${
        currentEvent?.distance <= 80 
          ? "ring-3 ring-red-500 animate-pulse" 
          : "ring-1 ring-gray-600 hover:ring-2 hover:ring-blue-400"
      }`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
    >
      <div className="relative">
        {/* Video da câmera real */}
        <div className="w-full h-48 bg-black flex items-center justify-center relative">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center text-gray-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
              <span className="text-sm">Iniciando câmera...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center text-red-400 p-4">
              <Camera size={32} className="mb-2" />
              <span className="text-sm text-center">{error}</span>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              {/* Overlay de hover para zoom */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                  <div className="bg-black/70 rounded-lg px-3 py-2 text-sm flex items-center gap-2">
                    <Maximize2 size={16} />
                    Clique para ampliar
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* Overlay de informações */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-3">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-bold text-white truncate flex items-center gap-2">
                <Camera size={16} className="text-green-400" />
                {name}
              </h3>
              <div className="text-xs text-gray-300 mt-1">
                <div>{location}</div>
                <div className="font-mono">{formattedTime}</div>
              </div>
            </div>
            
            <div className="flex flex-col items-center">
              <div
                className={`w-3 h-3 rounded-full mb-1 ${
                  currentEvent?.distance <= 80 ? "bg-red-500 animate-pulse" : "bg-green-400"
                }`}
              ></div>
              {currentEvent?.distance <= 80 && (
                <AlertTriangle className="text-red-400" size={14} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Informações do Arduino Serial */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
        <div className="flex justify-between items-center text-xs">
          <div className="flex items-center gap-1">
            <Usb size={10} className="text-yellow-400" />
            <span className="text-gray-300">{serialInfo}</span>
          </div>
          
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            currentEvent?.distance <= 80 
              ? "bg-red-500/20 text-red-300 border border-red-500/30" 
              : "bg-green-500/20 text-green-300 border border-green-500/30"
          }`}>
            {currentEvent?.distance <= 80 ? "ALERTA" : "NORMAL"}
          </div>
        </div>
        
        {/* Dados do sensor em tempo real */}
        {currentEvent && (
          <div className="mt-2 text-xs bg-black/30 rounded p-2">
            <div className="flex justify-between">
              <span className="text-gray-300">Distância:</span>
              <span className={`font-bold ${
                currentEvent.distance <= 80 ? 'text-red-400' : 'text-green-400'
              }`}>
                {currentEvent.distance}cm
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Status:</span>
              <span className="text-yellow-400">{currentEvent.severity}</span>
            </div>
          </div>
        )}
      </div>

      {/* Indicador de câmera real */}
      <div className="absolute top-2 right-2">
        <div className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
          <Cpu size={10} />
          <span>REAL</span>
        </div>
      </div>

      {/* Contador de eventos */}
      <div className="absolute bottom-2 left-2">
        <div className="bg-black/70 text-white px-2 py-1 rounded-full text-xs">
          Eventos: {totalEventos || 0}
        </div>
      </div>
    </motion.div>
  );
};

export default RealCamera;