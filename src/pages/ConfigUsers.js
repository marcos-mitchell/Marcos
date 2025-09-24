import { useState } from "react";
import { Trash2, Edit, Check, X, Plus } from "lucide-react";

const roles = ["admin", "editor", "viewer"];

const initialUsers = [
  { id: 1, name: "Admin", email: "admin@watchbase.com", role: "admin" },
  { id: 2, name: "Operador1", email: "operador1@watchbase.com", role: "editor" },
  { id: 3, name: "Visualizador1", email: "viewer1@watchbase.com", role: "viewer" },
];

export default function ConfigUsers() {
  const [users, setUsers] = useState(initialUsers);
  const [editingId, setEditingId] = useState(null);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "viewer" });

  // Salvar edição
  const handleSave = (id, name, email, role) => {
    setUsers(prev =>
      prev.map(u => (u.id === id ? { ...u, name, email, role } : u))
    );
    setEditingId(null);
  };

  // Remover usuário
  const handleRemove = (id) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  // Adicionar novo usuário
  const handleAdd = () => {
    if (!newUser.name || !newUser.email) return;
    const nextId = users.length ? Math.max(...users.map(u => u.id)) + 1 : 1;
    setUsers([...users, { id: nextId, ...newUser }]);
    setNewUser({ name: "", email: "", role: "viewer" });
  };

  return (
    <div className="p-6 min-h-screen bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-6">Usuários e Permissões</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {users.map(user => (
          <div key={user.id} className="bg-gray-800 p-4 rounded-2xl shadow-lg flex flex-col gap-2">
            {editingId === user.id ? (
              <>
                <input
                  type="text"
                  value={user.name}
                  onChange={e => setUsers(prev =>
                    prev.map(u => u.id === user.id ? { ...u, name: e.target.value } : u)
                  )}
                  className="p-2 rounded-lg text-black w-full"
                />
                <input
                  type="email"
                  value={user.email}
                  onChange={e => setUsers(prev =>
                    prev.map(u => u.id === user.id ? { ...u, email: e.target.value } : u)
                  )}
                  className="p-2 rounded-lg text-black w-full"
                />
                <select
                  value={user.role}
                  onChange={e => setUsers(prev =>
                    prev.map(u => u.id === user.id ? { ...u, role: e.target.value } : u)
                  )}
                  className="p-2 rounded-lg text-black w-full"
                >
                  {roles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <div className="flex justify-end gap-2 mt-2">
                  <button onClick={() => handleSave(user.id, user.name, user.email, user.role)} className="bg-green-600 px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-1">
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
                  <h2 className="text-xl font-semibold">{user.name}</h2>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingId(user.id)} className="hover:text-blue-400">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => handleRemove(user.id)} className="hover:text-red-400">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <p className="text-gray-300 text-sm">{user.email}</p>
                <span className={`px-2 py-1 rounded-lg text-sm ${user.role === "admin" ? "bg-red-600" : user.role === "editor" ? "bg-yellow-600" : "bg-green-600"}`}>
                  {user.role}
                </span>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Adicionar novo usuário */}
      <div className="bg-gray-800 p-4 rounded-2xl shadow-lg flex flex-col md:flex-row gap-2 items-center">
        <input
          type="text"
          placeholder="Nome do usuário"
          value={newUser.name}
          onChange={e => setNewUser(prev => ({ ...prev, name: e.target.value }))}
          className="p-2 rounded-lg text-black w-full md:w-1/4"
        />
        <input
          type="email"
          placeholder="Email do usuário"
          value={newUser.email}
          onChange={e => setNewUser(prev => ({ ...prev, email: e.target.value }))}
          className="p-2 rounded-lg text-black w-full md:w-1/3"
        />
        <select
          value={newUser.role}
          onChange={e => setNewUser(prev => ({ ...prev, role: e.target.value }))}
          className="p-2 rounded-lg text-black w-full md:w-1/6"
        >
          {roles.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <button onClick={handleAdd} className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-1">
          <Plus size={16} /> Adicionar
        </button>
      </div>
    </div>
  );
}

