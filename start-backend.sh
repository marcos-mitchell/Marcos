#!/bin/bash
echo "🚀 Iniciando servidor Arduino WebSocket..."
echo "📂 Diretório atual: $(pwd)"
echo "💻 Sistema: $(uname -s)"

# Verificar se a pasta backend existe
if [ ! -d "backend" ]; then
    echo "❌ Pasta 'backend' não encontrada!"
    exit 1
fi

cd backend

# Verificar Python
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo "❌ Python não encontrado!"
    exit 1
fi

echo "✅ Python: $($PYTHON_CMD --version 2>&1)"

# Verificar portas Arduino disponíveis
echo "🔍 Procurando dispositivos Arduino..."
ls /dev/ttyUSB* 2>/dev/null && echo "✅ Portas USB encontradas"
ls /dev/ttyACM* 2>/dev/null && echo "✅ Portas ACM encontradas"

echo "🌐 Iniciando servidor WebSocket..."
echo "📍 Endereço: ws://localhost:8080"
echo "🎯 Alertas ativados quando distância <= 80cm"
echo "🛑 Pressione Ctrl+C para parar"
echo "=" * 50

$PYTHON_CMD arduino_server.py