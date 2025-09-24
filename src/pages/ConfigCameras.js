import { useState } from "react";
import { Trash2, Edit, Check, X, Plus, Wifi } from "lucide-react";

const initialCameras = [
  { id: 1, name: "E. PRINCIPAL", url: "http://localhost:8080/cam1", active: true },
  { id: 2, name: "FAUMIL", url: "http://localhost:8080/cam2", active: true },
  { id: 3, name: "H. MILITAR", url: "http://localhost:8080/cam3", active: true },
  { id: 4, name: "E. SECUNDÁRIA", url: "http://localhost:8080/cam4", active: true },
];

export default function ConfigCameras() {
  const [cameras, setCameras] = useState(initialCameras);
  const [editingId, setEditingId] = useState(null);
  const [newCam, setNewCam] = useState({ name: "", url: "" });
  const [testing, setTesting] = useState({}); // { [id]: "online" | "offline" | "testando" }

  // Atualiza câmera existente
  const handleSave = (id, name, url) => {
    setCameras(prev =>
      prev.map(cam => (cam.id === id ? { ...cam, name, url } : cam))
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
    setNewCam({ name: "", url: "" });
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
      // Tentativa de fetch com timeout de 3s
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      await fetch(cam.url, { method: "HEAD", signal: controller.signal });
      clearTimeout(timeout);
      setTesting(prev => ({ ...prev, [cam.id]: "online" }));
    } catch (err) {
      setTesting(prev => ({ ...prev, [cam.id]: "offline" }));
    }
  };

  return (
    <div className="p-6 min-h-screen bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-6">Configuração de Câmeras</h1>

      {/* Grid de câmeras */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {cameras.map(cam => (
          <div key={cam.id} className="bg-gray-800 p-4 rounded-2xl shadow-lg flex flex-col gap-2">
            {editingId === cam.id ? (
              <>
                <input
                  type="text"
                  value={cam.name}
                  onChange={e => setCameras(prev =>
                    prev.map(c => c.id === cam.id ? { ...c, name: e.target.value } : c)
                  )}
                  className="p-2 rounded-lg text-black w-full"
                />
                <input
                  type="text"
                  value={cam.url}
                  onChange={e => setCameras(prev =>
                    prev.map(c => c.id === cam.id ? { ...c, url: e.target.value } : c)
                  )}
                  className="p-2 rounded-lg text-black w-full"
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => handleSave(cam.id, cam.name, cam.url)} className="bg-green-600 px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-1">
                    <Check size={16} /> Salvar
                  </button>
                  <button onClick={() => setEditingId(null)} className="bg-red-600 px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-1">
                    <X size={16} /> Cancelar
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">{cam.name}</h2>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingId(cam.id)} className="hover:text-blue-400">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => handleRemove(cam.id)} className="hover:text-red-400">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <p className="text-gray-300 text-sm">{cam.url}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className={`px-2 py-1 rounded-lg text-sm ${cam.active ? "bg-green-600" : "bg-red-600"}`}>
                    {cam.active ? "Ativa" : "Desativada"}
                  </span>
                  <button onClick={() => toggleActive(cam.id)} className="px-2 py-1 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm">
                    Alternar
                  </button>
                </div>
                {/* Botão de testar conexão */}
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={() => testConnection(cam)}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm"
                  >
                    <Wifi size={16} /> Testar Conexão
                  </button>
                  {testing[cam.id] === "testando" && <span className="text-yellow-400 text-sm">Testando...</span>}
                  {testing[cam.id] === "online" && <span className="text-green-400 text-sm">Online ✅</span>}
                  {testing[cam.id] === "offline" && <span className="text-red-500 text-sm">Offline ❌</span>}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Adicionar nova câmera */}
      <div className="bg-gray-800 p-4 rounded-2xl shadow-lg flex flex-col md:flex-row gap-2 items-center">
        <input
          type="text"
          placeholder="Nome da câmera"
          value={newCam.name}
          onChange={e => setNewCam(prev => ({ ...prev, name: e.target.value }))}
          className="p-2 rounded-lg text-black w-full md:w-1/3"
        />
        <input
          type="text"
          placeholder="URL da câmera"
          value={newCam.url}
          onChange={e => setNewCam(prev => ({ ...prev, url: e.target.value }))}
          className="p-2 rounded-lg text-black w-full md:w-1/2"
        />
        <button onClick={handleAdd} className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-1">
          <Plus size={16} /> Adicionar
        </button>
      </div>
    </div>
  );
}
