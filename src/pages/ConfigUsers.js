import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Edit, Check, X, Plus, User, Mail, Shield, Search, Filter, Download, Upload, Eye, EyeOff, Key } from "lucide-react";

const roles = [
  { value: "admin", label: "Administrador", color: "bg-red-500", description: "Acesso total ao sistema" },
  { value: "editor", label: "Editor", color: "bg-yellow-500", description: "Pode editar configurações" },
  { value: "viewer", label: "Visualizador", color: "bg-green-500", description: "Apenas visualização" }
];

const initialUsers = [
  { 
    id: 1, 
    name: "Admin Principal", 
    email: "admin@watchbase.com", 
    role: "admin",
    status: "active",
    lastLogin: "2024-01-15 14:30",
    createdAt: "2024-01-01",
    avatar: "https://i.pravatar.cc/150?img=1"
  },
  { 
    id: 2, 
    name: "Operador 1", 
    email: "operador1@watchbase.com", 
    role: "editor",
    status: "active",
    lastLogin: "2024-01-14 09:15",
    createdAt: "2024-01-05",
    avatar: "https://i.pravatar.cc/150?img=2"
  },
  { 
    id: 3, 
    name: "Visualizador 1", 
    email: "viewer1@watchbase.com", 
    role: "viewer",
    status: "inactive",
    lastLogin: "2024-01-10 16:45",
    createdAt: "2024-01-08",
    avatar: "https://i.pravatar.cc/150?img=3"
  },
];

export default function ConfigUsers() {
  const [users, setUsers] = useState(initialUsers);
  const [editingId, setEditingId] = useState(null);
  const [newUser, setNewUser] = useState({ 
    name: "", 
    email: "", 
    role: "viewer", 
    password: "",
    confirmPassword: ""
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [bulkAction, setBulkAction] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    byRole: {}
  });

  // Calcular estatísticas
  useEffect(() => {
    const total = users.length;
    const active = users.filter(u => u.status === "active").length;
    const inactive = users.filter(u => u.status === "inactive").length;
    
    const byRole = {};
    roles.forEach(role => {
      byRole[role.value] = users.filter(u => u.role === role.value).length;
    });

    setStats({ total, active, inactive, byRole });
  }, [users]);

  // Filtrar usuários
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Salvar edição
  const handleSave = (id, updatedUser) => {
    setUsers(prev =>
      prev.map(u => u.id === id ? { ...u, ...updatedUser } : u)
    );
    setEditingId(null);
  };

  // Remover usuário
  const handleRemove = (id) => {
    if (window.confirm("Tem certeza que deseja remover este usuário?")) {
      setUsers(prev => prev.filter(u => u.id !== id));
      setSelectedUsers(prev => prev.filter(userId => userId !== id));
    }
  };

  // Adicionar novo usuário
  const handleAdd = () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    if (newUser.password !== newUser.confirmPassword) {
      alert("As senhas não coincidem.");
      return;
    }

    if (newUser.password.length < 6) {
      alert("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    const nextId = users.length ? Math.max(...users.map(u => u.id)) + 1 : 1;
    setUsers([...users, { 
      id: nextId, 
      ...newUser,
      status: "active",
      createdAt: new Date().toISOString().split('T')[0],
      lastLogin: "Nunca",
      avatar: `https://i.pravatar.cc/150?img=${nextId + 10}`
    }]);
    
    setNewUser({ 
      name: "", 
      email: "", 
      role: "viewer", 
      password: "",
      confirmPassword: ""
    });
  };

  // Toggle status do usuário
  const toggleUserStatus = (id) => {
    setUsers(prev =>
      prev.map(u =>
        u.id === id ? { ...u, status: u.status === "active" ? "inactive" : "active" } : u
      )
    );
  };

  // Seleção em massa
  const toggleUserSelection = (id) => {
    setSelectedUsers(prev =>
      prev.includes(id)
        ? prev.filter(userId => userId !== id)
        : [...prev, id]
    );
  };

  const selectAllUsers = () => {
    setSelectedUsers(
      selectedUsers.length === filteredUsers.length
        ? []
        : filteredUsers.map(user => user.id)
    );
  };

  // Ação em massa
  const handleBulkAction = () => {
    if (!bulkAction || selectedUsers.length === 0) return;

    switch (bulkAction) {
      case "activate":
        setUsers(prev =>
          prev.map(u =>
            selectedUsers.includes(u.id) ? { ...u, status: "active" } : u
          )
        );
        break;
      case "deactivate":
        setUsers(prev =>
          prev.map(u =>
            selectedUsers.includes(u.id) ? { ...u, status: "inactive" } : u
          )
        );
        break;
      case "delete":
        if (window.confirm(`Tem certeza que deseja remover ${selectedUsers.length} usuário(s)?`)) {
          setUsers(prev => prev.filter(u => !selectedUsers.includes(u.id)));
          setSelectedUsers([]);
        }
        break;
      default:
        break;
    }
    
    setBulkAction("");
  };

  // Exportar dados
  const exportUsers = () => {
    const data = JSON.stringify(users, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "watchbase-users.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Gestão de Utilizadores</h1>
            <p className="text-gray-400">Gerencie utilizadores e permissões do sistema</p>
          </div>
          <button
            onClick={exportUsers}
            className="flex items-center gap-2 bg-green-600 px-4 py-2 rounded-lg hover:bg-green-700 transition"
          >
            <Download size={20} />
            Exportar Dados
          </button>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/20 p-2 rounded-lg">
                <User className="text-blue-400" size={24} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total de Utilizadores</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="bg-green-500/20 p-2 rounded-lg">
                <User className="text-green-400" size={24} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Ativos</p>
                <p className="text-2xl font-bold text-green-400">{stats.active}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="bg-red-500/20 p-2 rounded-lg">
                <User className="text-red-400" size={24} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Inativos</p>
                <p className="text-2xl font-bold text-red-400">{stats.inactive}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="bg-purple-500/20 p-2 rounded-lg">
                <Shield className="text-purple-400" size={24} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Administradores</p>
                <p className="text-2xl font-bold text-purple-400">{stats.byRole.admin || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className="bg-gray-800 p-4 rounded-2xl mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar utilizadores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="p-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
            >
              <option value="all">Todos os cargos</option>
              {roles.map(role => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
            >
              <option value="all">Todos os status</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
            </select>

            <div className="flex gap-2">
              <span className="text-sm text-gray-400 flex items-center">
                {filteredUsers.length} de {users.length} utilizadores
              </span>
            </div>
          </div>
        </div>

        {/* Ações em Massa */}
        {selectedUsers.length > 0 && (
          <div className="bg-blue-500/20 border border-blue-500 rounded-2xl p-4 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter size={20} className="text-blue-400" />
                <span className="text-blue-300">
                  {selectedUsers.length} utilizador(es) selecionado(s)
                </span>
              </div>
              <div className="flex gap-2">
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="p-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Ação em massa...</option>
                  <option value="activate">Ativar</option>
                  <option value="deactivate">Desativar</option>
                  <option value="delete">Remover</option>
                </select>
                <button
                  onClick={handleBulkAction}
                  className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Aplicar
                </button>
                <button
                  onClick={() => setSelectedUsers([])}
                  className="bg-gray-600 px-4 py-2 rounded-lg hover:bg-gray-700 transition"
                >
                  Limpar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Utilizadores */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          {filteredUsers.map(user => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800 rounded-2xl shadow-lg overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => toggleUserSelection(user.id)}
                      className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                    />
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-12 h-12 rounded-full border-2 border-gray-600"
                    />
                    <div>
                      <h3 className="text-lg font-semibold">{user.name}</h3>
                      <p className="text-gray-400 text-sm flex items-center gap-1">
                        <Mail size={14} />
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleUserStatus(user.id)}
                      className={`p-2 rounded-lg ${
                        user.status === "active" 
                          ? "bg-green-500/20 text-green-400 hover:bg-green-500/30" 
                          : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                      }`}
                    >
                      {user.status === "active" ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                    <button
                      onClick={() => setEditingId(editingId === user.id ? null : user.id)}
                      className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleRemove(user.id)}
                      className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <span className="text-gray-400 text-sm">Cargo</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        roles.find(r => r.value === user.role)?.color || 'bg-gray-500'
                      }`}>
                        {roles.find(r => r.value === user.role)?.label || user.role}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Status</span>
                    <div className="mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.status === "active" 
                          ? "bg-green-500/20 text-green-300 border border-green-500/30" 
                          : "bg-red-500/20 text-red-300 border border-red-500/30"
                      }`}>
                        {user.status === "active" ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-gray-400">
                  <div>Último login: {user.lastLogin}</div>
                  <div>Criado em: {user.createdAt}</div>
                </div>

                {/* Formulário de Edição */}
                <AnimatePresence>
                  {editingId === user.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 p-4 bg-gray-700/50 rounded-lg"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          value={user.name}
                          onChange={e => setUsers(prev =>
                            prev.map(u => u.id === user.id ? { ...u, name: e.target.value } : u)
                          )}
                          className="p-2 bg-gray-600 rounded-lg border border-gray-500 focus:border-blue-500 focus:outline-none"
                          placeholder="Nome"
                        />
                        <input
                          type="email"
                          value={user.email}
                          onChange={e => setUsers(prev =>
                            prev.map(u => u.id === user.id ? { ...u, email: e.target.value } : u)
                          )}
                          className="p-2 bg-gray-600 rounded-lg border border-gray-500 focus:border-blue-500 focus:outline-none"
                          placeholder="Email"
                        />
                        <select
                          value={user.role}
                          onChange={e => setUsers(prev =>
                            prev.map(u => u.id === user.id ? { ...u, role: e.target.value } : u)
                          )}
                          className="p-2 bg-gray-600 rounded-lg border border-gray-500 focus:border-blue-500 focus:outline-none"
                        >
                          {roles.map(role => (
                            <option key={role.value} value={role.value}>{role.label}</option>
                          ))}
                        </select>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleSave(user.id, user)}
                            className="flex-1 bg-green-600 px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                          >
                            <Check size={16} />
                            Salvar
                          </button>
                          <button 
                            onClick={() => setEditingId(null)}
                            className="flex-1 bg-red-600 px-4 py-2 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                          >
                            <X size={16} />
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Adicionar Novo Utilizador */}
        <div className="bg-gray-800 rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Plus size={20} />
            Adicionar Novo Utilizador
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Nome *</label>
              <input
                type="text"
                placeholder="Nome completo"
                value={newUser.name}
                onChange={e => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Email *</label>
              <input
                type="email"
                placeholder="email@exemplo.com"
                value={newUser.email}
                onChange={e => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                className="w-full p-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Cargo</label>
              <select
                value={newUser.role}
                onChange={e => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                className="w-full p-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              >
                {roles.map(role => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleAdd}
                className="w-full bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                Adicionar
              </button>
            </div>
          </div>

          {/* Campos de Senha (expandíveis) */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Senha *</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={newUser.password}
                  onChange={e => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full p-2 pr-10 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Confirmar Senha *</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirme a senha"
                  value={newUser.confirmPassword}
                  onChange={e => setNewUser(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full p-2 pr-10 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 top-2 text-gray-400 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}