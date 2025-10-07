@echo off
chcp 65001 >nul
title Arduino-WebSocket Bridge

echo 🚀 Iniciando Arduino-WebSocket Bridge...
echo 📂 Diretório: %CD%

cd backend

echo 📦 Verificando dependências...
python -m pip install -r requirements.txt

echo.
echo 🔌 Conectando Arduino na porta COM7...
echo 🌐 WebSocket: ws://localhost:8080
echo 📡 Aguardando dados do sensor...
echo 🛑 Ctrl+C para parar
echo ========================================

python serial_bridge.py
pause
