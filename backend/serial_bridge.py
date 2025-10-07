
import asyncio
import websockets
import serial
import json
import time
import logging

# Configurar logging apenas para erros
logging.basicConfig(level=logging.ERROR)

class FastArduinoBridge:
    def __init__(self, serial_port='COM7', baud_rate=9600):
        self.serial_port = serial_port
        self.baud_rate = baud_rate
        self.serial_conn = None
        self.clients = set()
        self.last_broadcast_time = 0
        self.broadcast_interval = 0.1

    async def handle_serial(self):
        """Processamento da serial"""
        try:
            # Abre a porta serial (pode levantar serial.SerialException)
            self.serial_conn = serial.Serial(self.serial_port, self.baud_rate, timeout=0.1)
            print(f"✅ Arduino conectado em {self.serial_port}")

            buffer = ""
            while True:
                # Se a conexão serial foi fechada externamente, tenta reabrir
                if not self.serial_conn or not self.serial_conn.is_open:
                    try:
                        self.serial_conn = serial.Serial(self.serial_port, self.baud_rate, timeout=0.1)
                        print(f"♻️ Reconectado na {self.serial_port}")
                    except Exception:
                        await asyncio.sleep(1)
                        continue

                try:
                    if self.serial_conn.in_waiting > 0:
                        data = self.serial_conn.read(self.serial_conn.in_waiting).decode('utf-8', errors='ignore')
                        buffer += data

                        if '\n' in buffer:
                            lines = buffer.split('\n')
                            buffer = lines[-1]

                            for line in lines[:-1]:
                                line = line.strip()
                                if line:
                                    parsed_data = self.parse_data(line)
                                    if parsed_data:
                                        await self.broadcast(parsed_data)
                except Exception as e:
                    # Erro de leitura, tenta recuperar
                    print(f"❌ Erro ao ler serial: {e}")
                    await asyncio.sleep(0.5)

                # pequeno yield para não bloquear o loop de eventos
                await asyncio.sleep(0)
        except Exception as e:
            print(f"❌ Erro inicializando serial: {e}")
            # tenta reconectar periodicamente
            while True:
                try:
                    self.serial_conn = serial.Serial(self.serial_port, self.baud_rate, timeout=0.1)
                    print(f"✅ Arduino conectado em {self.serial_port}")
                    return await self.handle_serial()
                except Exception:
                    print("⏳ Tentando reconectar serial em 1s...")
                    await asyncio.sleep(1)

    def parse_data(self, line):
        """Parser de dados"""
        try:
            if 'Distancia:' in line and 'cm' in line:
                parts = line.split('Distancia:')
                if len(parts) > 1:
                    dist_str = parts[1].split('cm')[0].strip()
                    distance = int(dist_str)
                    return {
                        'distance': distance,
                        'severity': 'ALERTA' if distance <= 80 else 'NORMAL',
                        'timestamp': int(time.time() * 1000),
                        'time': time.strftime('%H:%M:%S')
                    }

            elif line.isdigit():
                distance = int(line)
                return {
                    'distance': distance,
                    'severity': 'ALERTA' if distance <= 80 else 'NORMAL',
                    'timestamp': int(time.time() * 1000),
                    'time': time.strftime('%H:%M:%S')
                }

        except Exception:
            # Falha no parse — ignora linha
            return None
        return None

    async def broadcast(self, data):
        """Envio para clientes"""
        current_time = time.time()

        if current_time - self.last_broadcast_time < self.broadcast_interval:
            return

        self.last_broadcast_time = current_time

        if not self.clients:
            return

        message = json.dumps(data)
        disconnected = set()

        for client in list(self.clients):
            try:
                await client.send(message)
                print(f"📤 {data['distance']}cm ({data['severity']})")
            except Exception:
                disconnected.add(client)

        if disconnected:
            self.clients -= disconnected
            print(f"🔧 Clientes desconectados: {len(disconnected)}")

    async def websocket_handler(self, websocket, path=None):
        """
        Handler WebSocket compatível:
        - aceita (websocket, path) quando a versão do websockets fornece path
        - aceita apenas (websocket) quando a versão fornece só websocket
        """
        self.clients.add(websocket)
        print(f"👤 Cliente WebSocket conectado. Total: {len(self.clients)}")

        try:
            # Mantém a conexão aberta até o fechamento do cliente
            await websocket.wait_closed()
        except Exception:
            pass
        finally:
            if websocket in self.clients:
                self.clients.remove(websocket)
            print(f"👤 Cliente desconectado. Restantes: {len(self.clients)}")

    async def run(self):
        """Execução principal"""
        print("🚀 Bridge Arduino-WebSocket Iniciada")
        print(f"📍 WebSocket: ws://localhost:8080")
        print("🛑 Ctrl+C para parar\n")

        # Configuração do servidor WebSocket
        start_server = websockets.serve(
            self.websocket_handler,
            "localhost",
            8080,
            ping_interval=20,
            ping_timeout=10,
            close_timeout=10
        )

        server = await start_server
        print("✅ Servidor WebSocket pronto")

        try:
            # Executar serial (bloqueante até interrupção)
            await self.handle_serial()
        except KeyboardInterrupt:
            print("\n👋 Parando servidor...")
        finally:
            server.close()
            await server.wait_closed()

if __name__ == "__main__":
    bridge = FastArduinoBridge()

    try:
        asyncio.run(bridge.run())
    except KeyboardInterrupt:
        print("\n👋 Servidor finalizado")
        if bridge.serial_conn and getattr(bridge.serial_conn, "is_open", False):
            try:
                bridge.serial_conn.close()
            except Exception:
                pass
