import { useState, useEffect } from "react";
import { Trash2, Edit, Check, X, Plus, Wifi, Power, Save } from "lucide-react";

const initialCameras = [
  { id: 1, name: "E. PRINCIPAL", url: "http://localhost:8080/cam1", active: true, type: "real" },
  { id: 2, name: "FAUMIL", url: "http://localhost:8080/cam2", active: true, type: "simulated" },
  { id: 3, name: "H. MILITAR", url: "http://localhost:8080/cam3", active: true, type: "simulated" },
  { id: 4, name: "E. SECUNDÁRIA", url: "http://localhost:8080/cam4", active: true, type: "simulated" },
];

export default function ConfigCameras() {
  const [cameras, setCameras] = useState(initialCameras);
  const [editingId, setEditingId] = useState(null);
  const [newCam, setNewCam] = useState({ name: "", url: "", type: "simulated" });
  const [testing, setTesting] = useState({});
  const [saved, setSaved] = useState(false);

  // Carregar configurações salvas
  useEffect(() => {
    const savedCameras = localStorage.getItem('watchbase_cameras');
    if (savedCameras) {
      setCameras(JSON.parse(savedCameras));
    }
  }, []);

  // Salvar configurações
  const saveSettings = () => {
    localStorage.setItem('watchbase_cameras', JSON.stringify(cameras));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // Atualiza câmera existente
  const handleSave = (id, name, url, type) => {
    setCameras(prev =>
      prev.map(cam => (cam.id === id ? { ...cam, name, url, type } : cam))
    );
    setEditingId(null);
  };

  // Remove câmera
  const handleRemove = (id) => {
    setCameras(prev => prev.filter(cam => cam.id !== id));
  };

  // Adicionar nova câmera
  const handleAdd = () => {
    if (!newCam.name || !newCam.url) return;
    const nextId = cameras.length ? Math.max(...cameras.map(c => c.id)) + 1 : 1;
    setCameras([...cameras, { id: nextId, ...newCam, active: true }]);
    setNewCam({ name: "", url: "", type: "simulated" });
  };

  // Toggle ativa/desativa
  const toggleActive = (id) => {
    setCameras(prev =>
      prev.map(cam => cam.id === id ? { ...cam, active: !cam.active } : cam)
    );
  };

  // Testar conexão da câmera
  const testConnection = async (cam) => {
    setTesting(prev => ({ ...prev, [cam.id]: "testando" }));
    try {
      // Para câmeras reais, testar acesso à câmera do dispositivo
      if (cam.type === "real") {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        setTesting(prev => ({ ...prev, [cam.id]: "online" }));
      } else {
        // Para câmeras simuladas, testar URL
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        await fetch(cam.url, { method: "HEAD", signal: controller.signal });
        clearTimeout(timeout);
        setTesting(prev => ({ ...prev, [cam.id]: "online" }));
      }
    } catch (err) {
      setTesting(prev => ({ ...prev, [cam.id]: "offline" }));
    }
  };

  // Reiniciar todas as câmeras
  const restartAllCameras = () => {
    setCameras(prev => prev.map(cam => ({ ...cam, active: true })));
  };

  // Desligar todas as câmeras
  const shutdownAllCameras = () => {
    setCameras(prev => prev.map(cam => ({ ...cam, active: false })));
  };

  return (
    <div className="p-6 min-h-screen bg-gray-900 text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Configuração de Câmeras</h1>
        <div className="flex gap-2">
          <button
            onClick={restartAllCameras}
            className="flex items-center gap-2 bg-green-600 px-4 py-2 rounded-lg hover:bg-green-700 transition"
          >
            <Power size={16} />
            Ligar Todas
          </button>
          <button
            onClick={shutdownAllCameras}
            className="flex items-center gap-2 bg-red-600 px-4 py-2 rounded-lg hover:bg-red-700 transition"
          >
            <Power size={16} />
            Desligar Todas
          </button>
          <button
            onClick={saveSettings}
            className="flex items-center gap-2 bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Save size={16} />
            {saved ? "Salvo!" : "Salvar"}
          </button>
        </div>
      </div>

      {saved && (
        <div className="bg-green-500/20 border border-green-500 rounded-lg p-3 mb-4 flex items-center gap-2">
          <Check size={20} />
          Configurações salvas com sucesso!
        </div>
      )}

      {/* Contadores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800 p-4 rounded-2xl text-center">
          <div className="text-2xl font-bold text-blue-400">{cameras.length}</div>
          <div className="text-gray-400">Total de Câmeras</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-2xl text-center">
          <div className="text-2xl font-bold text-green-400">
            {cameras.filter(c => c.active).length}
          </div>
          <div className="text-gray-400">Câmeras Ativas</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-2xl text-center">
          <div className="text-2xl font-bold text-red-400">
            {cameras.filter(c => !c.active).length}
          </div>
          <div className="text-gray-400">Câmeras Inativas</div>
        </div>
      </div>

      {/* Grid de câmeras */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {cameras.map(cam => (
          <div key={cam.id} className={`bg-gray-800 p-4 rounded-2xl shadow-lg flex flex-col gap-2 border-2 ${
            cam.active ? 'border-green-500/30' : 'border-red-500/30'
          }`}>
            {editingId === cam.id ? (
              <>
                <input
                  type="text"
                  value={cam.name}
                  onChange={e => setCameras(prev =>
                    prev.map(c => c.id === cam.id ? { ...c, name: e.target.value } : c)
                  )}
                  className="p-2 rounded-lg text-black w-full"
                  placeholder="Nome da câmera"
                />
                <input
                  type="text"
                  value={cam.url}
                  onChange={e => setCameras(prev =>
                    prev.map(c => c.id === cam.id ? { ...c, url: e.target.value } : c)
                  )}
                  className="p-2 rounded-lg text-black w-full"
                  placeholder="URL da câmera"
                />
                <select
                  value={cam.type}
                  onChange={e => setCameras(prev =>
                    prev.map(c => c.id === cam.id ? { ...c, type: e.target.value } : c)
                  )}
                  className="p-2 rounded-lg text-black w-full"
                >
                  <option value="simulated">Simulada</option>
                  <option value="real">Real</option>
                </select>
                <div className="flex justify-end gap-2">
                  <button 
                    onClick={() => handleSave(cam.id, cam.name, cam.url, cam.type)} 
                    className="bg-green-600 px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-1"
                  >
                    <Check size={16} /> Salvar
                  </button>
                  <button 
                    onClick={() => setEditingId(null)} 
                    className="bg-red-600 px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-1"
                  >
                    <X size={16} /> Cancelar
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold">{cam.name}</h2>
                    <p className="text-gray-300 text-sm">{cam.url}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      cam.type === "real" 
                        ? "bg-green-500/20 text-green-300" 
                        : "bg-blue-500/20 text-blue-300"
                    }`}>
                      {cam.type === "real" ? "Câmera Real" : "Câmera Simulada"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingId(cam.id)} className="hover:text-blue-400">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => handleRemove(cam.id)} className="hover:text-red-400">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-2">
                  <button 
                    onClick={() => toggleActive(cam.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                      cam.active 
                        ? "bg-red-600 hover:bg-red-700" 
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    <Power size={14} />
                    {cam.active ? "Desativar" : "Ativar"}
                  </button>
                  
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-lg text-sm ${
                      cam.active ? "bg-green-600" : "bg-red-600"
                    }`}>
                      {cam.active ? "Ativa" : "Desativada"}
                    </span>
                    
                    <button
                      onClick={() => testConnection(cam)}
                      className="flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm"
                    >
                      <Wifi size={16} /> Testar
                    </button>
                  </div>
                </div>
                
                {/* Status do teste */}
                <div className="mt-2">
                  {testing[cam.id] === "testando" && (
                    <span className="text-yellow-400 text-sm">Testando conexão...</span>
                  )}
                  {testing[cam.id] === "online" && (
                    <span className="text-green-400 text-sm">✅ Conexão estabelecida</span>
                  )}
                  {testing[cam.id] === "offline" && (
                    <span className="text-red-500 text-sm">❌ Falha na conexão</span>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Adicionar nova câmera */}
      <div className="bg-gray-800 p-4 rounded-2xl shadow-lg">
        <h3 className="text-xl font-bold mb-4">Adicionar Nova Câmera</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
          <input
            type="text"
            placeholder="Nome da câmera"
            value={newCam.name}
            onChange={e => setNewCam(prev => ({ ...prev, name: e.target.value }))}
            className="p-2 rounded-lg text-black"
          />
          <input
            type="text"
            placeholder="URL da câmera"
            value={newCam.url}
            onChange={e => setNewCam(prev => ({ ...prev, url: e.target.value }))}
            className="p-2 rounded-lg text-black"
          />
          <select
            value={newCam.type}
            onChange={e => setNewCam(prev => ({ ...prev, type: e.target.value }))}
            className="p-2 rounded-lg text-black"
          >
            <option value="simulated">Câmera Simulada</option>
            <option value="real">Câmera Real</option>
          </select>
          <button 
            onClick={handleAdd} 
            className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-1 justify-center"
          >
            <Plus size={16} /> Adicionar
          </button>
        </div>
      </div>
    </div>
  );
}