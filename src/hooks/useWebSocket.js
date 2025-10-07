import { useState, useEffect, useRef } from 'react';

export const useWebSocket = () => {
  const [latestEvent, setLatestEvent] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const lastEventTimeRef = useRef(0);

  useEffect(() => {
    const connect = () => {
      try {
        // Fechar conexão existente
        if (wsRef.current) {
          wsRef.current.close();
        }

        console.log('🔄 Tentando conectar WebSocket...');
        wsRef.current = new WebSocket('ws://localhost:8080');
        
        wsRef.current.onopen = () => {
          console.log('✅ Conectado ao Arduino WebSocket');
          setIsConnected(true);
        };

        wsRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('📡 Dados recebidos:', data);
            
            // Debounce simples: ignorar eventos com menos de 200ms
            const now = Date.now();
            if (now - lastEventTimeRef.current < 200) {
              return;
            }
            lastEventTimeRef.current = now;
            
            // Adicionar timestamp de recebimento
            data.receivedAt = now;
            setLatestEvent(data);
            console.log(`⚠️ Alerta: ${data.object} a ${data.distance}cm`);
          } catch (error) {
            console.error('❌ Erro ao parsear dados:', error);
          }
        };

        wsRef.current.onclose = (event) => {
          console.log('🔌 Conexão WebSocket fechada');
          setIsConnected(false);
          
          // Tentar reconectar após 2 segundos
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('🔄 Tentando reconectar...');
            connect();
          }, 2000);
        };

        wsRef.current.onerror = (error) => {
          console.error('❌ Erro WebSocket:', error);
        };

      } catch (error) {
        console.error('❌ Erro ao criar WebSocket:', error);
        // Tentar novamente após 3 segundos em caso de erro
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      }
    };

    connect();

    // Cleanup
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []); // ✅ Array vazio - executa apenas uma vez

  return {
    isConnected,
    latestEvent
  };
};