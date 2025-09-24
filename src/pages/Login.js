import { useState } from "react";
import { Lock, User } from "lucide-react";

const mockUsers = [
  { id: 1, name: "AdminUser", username: "admin", password: "1234", role: "admin" },
  { id: 2, name: "ViewerUser", username: "viewer", password: "1234", role: "viewer" },
];

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    const user = mockUsers.find(u => u.username === username && u.password === password);
    if (user) {
      onLogin(user);
    } else {
      setError("Usuário ou senha inválidos");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-white">
      <form onSubmit={handleLogin} className="bg-gray-800 p-10 rounded-3xl shadow-2xl w-96 flex flex-col gap-6">
        <h2 className="text-3xl font-bold text-center mb-4">🔒 Login WatchBase</h2>

        {error && <p className="text-red-500 text-center">{error}</p>}

        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 pl-10 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Usuário"
            required
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 pl-10 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Senha"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
