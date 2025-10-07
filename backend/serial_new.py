import asyncio
import websockets
import serial
import json
import time
import logging
import cv2
import numpy as np

logging.basicConfig(level=logging.ERROR)

class FastArduinoBridge:
    def __init__(self, serial_port='COM7', baud_rate=9600):
        print("🚀 Inicializando FastArduinoBridge...")
        self.serial_port = serial_port
        self.baud_rate = baud_rate
        self.serial_conn = None
        self.clients = set()
        self.last_broadcast_time = 0
        self.broadcast_interval = 0.1

        # === YOLO CONFIG ===
        print("📦 Carregando modelo YOLOv3...")
        self.net = cv2.dnn.readNet("models/yolov3.weights", "models/yolov3.cfg")
        self.layer_names = self.net.getLayerNames()
        self.output_layers = [self.layer_names[i - 1] for i in self.net.getUnconnectedOutLayers()]
        with open("coco.names", "r") as f:
            self.classes = [line.strip() for line in f.readlines()]
        print(f"✅ Modelo carregado com {len(self.classes)} classes.")

        # Abrir câmera
        print("📷 Iniciando câmera...")
        self.cap = cv2.VideoCapture(0)
        if not self.cap.isOpened():
            print("❌ ERRO: não foi possível abrir a câmera.")
        else:
            print("✅ Câmera iniciada com sucesso.")

    def detect_objects(self, frame):
        height, width, _ = frame.shape
        blob = cv2.dnn.blobFromImage(frame, 0.00392, (416, 416), (0, 0, 0), True, crop=False)
        self.net.setInput(blob)
        outs = self.net.forward(self.output_layers)

        class_ids, confidences, boxes = [], [], []
        person_detected = False

        for out in outs:
            for detection in out:
                scores = detection[5:]
                class_id = np.argmax(scores)
                confidence = scores[class_id]

                if confidence > 0.5:
                    center_x = int(detection[0] * width)
                    center_y = int(detection[1] * height)
                    w = int(detection[2] * width)
                    h = int(detection[3] * height)

                    x = int(center_x - w / 2)
                    y = int(center_y - h / 2)

                    boxes.append([x, y, w, h])
                    confidences.append(float(confidence))
                    class_ids.append(class_id)

        indexes = cv2.dnn.NMSBoxes(boxes, confidences, 0.5, 0.4)

        for i in range(len(boxes)):
            if i in indexes:
                x, y, w, h = boxes[i]
                label = str(self.classes[class_ids[i]])
                color = (0, 255, 0) if label == "person" else (0, 0, 255)
                cv2.rectangle(frame, (x, y), (x + w, y + h), color, 2)
                cv2.putText(frame, f"{label} {confidences[i]:.2f}", (x, y - 5),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
                if label == "person":
                    person_detected = True

        return person_detected, frame

    async def show_frame(self, frame):
        """Mostra o frame em outra thread para não bloquear asyncio"""
        await asyncio.to_thread(cv2.imshow, "YOLOv3 Detection", frame)
        key = cv2.waitKey(1)
        if key & 0xFF == ord('q'):
            print("🛑 Fechando janela de vídeo.")
            return False
        return True

    async def handle_serial(self):
        """Processamento da serial + detecção de objetos + exibição"""
        buffer = ""
        while True:
            if not self.serial_conn or not getattr(self.serial_conn, "is_open", False):
                try:
                    print(f"🔌 Conectando ao Arduino na porta {self.serial_port}...")
                    self.serial_conn = serial.Serial(self.serial_port, self.baud_rate, timeout=0.1)
                    print(f"✅ Arduino conectado em {self.serial_port}")
                except Exception:
                    print("⏳ Tentando reconectar serial em 1s...")
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
                                await self.process_line(line)
                await asyncio.sleep(0.01)
            except Exception as e:
                print(f"❌ Erro ao ler serial: {e}")
                await asyncio.sleep(0.5)

    async def process_line(self, line):
       # print(f"📥 Linha recebida da serial: {line}")
        distance = None
        severity = "NORMAL"

        if line.isdigit():
            distance = int(line)
            print(f"📏 Distância recebida: {distance} cm")

            ret, frame = self.cap.read()
            if not ret:
                print("⚠️ Falha ao capturar frame da câmera.")
                return

            if distance <= 80:
                person_detected, frame = self.detect_objects(frame)
                if person_detected:
                    severity = "ALERTA"
                    print("🚨 ALERTA: Pessoa confirmada no perímetro!")
                else:
                    print("🐾 Movimento detectado, mas não é pessoa.")
            else:
                _, frame = self.detect_objects(frame)

            # Mostrar frame sem bloquear asyncio
            continue_show = await self.show_frame(frame)
            if not continue_show:
                # Usuário fechou janela
                self.cap.release()
                cv2.destroyAllWindows()
                print("🔻 Janela de vídeo fechada.")
                return

        if distance is not None:
            data = {
                "distance": distance,
                "severity": severity,
                "timestamp": int(time.time() * 1000),
                "time": time.strftime("%H:%M:%S")
            }
            await self.broadcast(data)

    async def broadcast(self, data):
        current_time = time.time()
        if current_time - self.last_broadcast_time < self.broadcast_interval:
            return
        self.last_broadcast_time = current_time

        if not self.clients:
            print("⚠️ Nenhum cliente conectado, dados não enviados.")
            return

        message = json.dumps(data)
        disconnected = set()
        for client in list(self.clients):
            try:
                await client.send(message)
                print(f"📡 Dados enviados para cliente WebSocket: {data}")
            except Exception:
                disconnected.add(client)
        if disconnected:
            self.clients -= disconnected
            print(f"🔧 Clientes desconectados: {len(disconnected)}")

    async def websocket_handler(self, websocket, path=None):
        self.clients.add(websocket)
        print(f"👤 Cliente conectado. Total: {len(self.clients)}")
        try:
            await websocket.wait_closed()
        finally:
            self.clients.remove(websocket)
            print(f"👤 Cliente desconectado. Restantes: {len(self.clients)}")

    async def run(self):
        print("🌍 Iniciando servidor WebSocket em ws://localhost:8080 ...")
        server = await websockets.serve(
            self.websocket_handler, "localhost", 8080,
            ping_interval=20, ping_timeout=10, close_timeout=10
        )
        print("✅ Servidor WebSocket iniciado com sucesso.")
        try:
            await self.handle_serial()
        except KeyboardInterrupt:
            print("\n👋 Servidor finalizado manualmente (Ctrl+C).")
        finally:
            server.close()
            await server.wait_closed()
            if self.cap.isOpened():
                self.cap.release()
            cv2.destroyAllWindows()
            print("🔻 Câmera e servidor WebSocket finalizados.")

if __name__ == "__main__":
    bridge = FastArduinoBridge()
    try:
        asyncio.run(bridge.run())
    except KeyboardInterrupt:
        print("\n👋 Servidor finalizado manualmente (Ctrl+C).")
        if bridge.serial_conn and getattr(bridge.serial_conn, "is_open", False):
            try:
                bridge.serial_conn.close()
            except Exception:
                pass
