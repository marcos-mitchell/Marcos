@echo off
chcp 65001 >nul
echo 🚀 Iniciando servidor Arduino WebSocket para Windows...
echo 📂 Diretório atual: %CD%
echo 💻 Sistema: Windows

REM Verificar se a pasta backend existe
if not exist "backend" (
    echo ❌ Pasta 'backend' não encontrada!
    pause
    exit /b 1
)

REM Navegar para a pasta backend
cd backend

REM Verificar se Python está instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python não encontrado!
    echo 💡 Instale Python: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo ✅ Python: 
python --version

REM Verificar portas Arduino no Windows
echo 🔍 Procurando portas COM disponíveis...
echo 📋 Portas seriais detectadas:
mode | find "COM"

REM Instalar dependências se necessário
echo 📦 Verificando dependências...
python -m pip install websockets pyserial >nul 2>&1
if errorlevel 1 (
    echo ❌ Erro ao instalar dependências
    echo 💡 Tente manualmente: python -m pip install websockets pyserial
)

echo.
echo 🌐 Iniciando servidor WebSocket...
echo 📍 Endereço: ws://localhost:8080
echo 🎯 Alertas ativados quando distância ^<= 80cm
echo 🔧 Modo: Detecção automática Arduino/Simulação
echo 🛑 Pressione Ctrl+C para parar
echo ==================================================

python arduino_server_windows.py
pause