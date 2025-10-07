import { useState, useEffect } from "react";
import { Lock, User, Eye, EyeOff, AlertCircle, CheckCircle, Mail } from "lucide-react";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // Estados para recuperação de senha
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Efeito para carregar credenciais salvas
  useEffect(() => {
    const savedUsername = localStorage.getItem("watchbase_username");
    const savedRememberMe = localStorage.getItem("watchbase_rememberMe");
    
    if (savedUsername && savedRememberMe === "true") {
      setUsername(savedUsername);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      // Em uma aplicação real, isso seria uma chamada à API
      const mockUsers = [
        { id: 1, name: "Thomas Shelby", username: "Shelby", password: "Thomas884@*#", role: "Admin" },
        { id: 2, name: "Pedro Guambe", username: "Guambe", password: "1234", role: "Viewer" },
      ];

      const user = mockUsers.find(u => u.username === username && u.password === password);
      
      if (user) {
        // Salvar preferências
        if (rememberMe) {
          localStorage.setItem("watchbase_username", username);
          localStorage.setItem("watchbase_rememberMe", "true");
        } else {
          localStorage.removeItem("watchbase_username");
          localStorage.removeItem("watchbase_rememberMe");
        }
        
        onLogin(user);
      } else {
        setError("Credenciais inválidas. Verifique utilizador e senha.");
      }
    } catch (err) {
      setError("Erro ao fazer login. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError("");
    setResetLoading(true);

    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      // Em uma aplicação real, isso enviaria um email para o usuário
      if (resetEmail) {
        setResetSent(true);
        setError("");
      } else {
        setError("Por favor, insira seu email cadastrado.");
      }
    } catch (err) {
      setError("Erro ao enviar email de recuperação. Tente novamente.");
    } finally {
      setResetLoading(false);
    }
  };

  const resetPasswordForm = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Mail className="text-white" size={28} />
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Recuperar Senha
        </h2>
        <p className="text-gray-400 mt-2">
          {resetSent 
            ? "Verifique seu email para redefinir a senha" 
            : "Digite seu email para receber as instruções"
          }
        </p>
      </div>

      {resetSent ? (
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-green-400">
            <CheckCircle size={20} />
            Email enviado com sucesso!
          </div>
          <p className="text-sm text-gray-400">
            Enviamos um link de recuperação para: <strong>{resetEmail}</strong>
          </p>
          <button
            onClick={() => {
              setForgotPassword(false);
              setResetSent(false);
              setResetEmail("");
            }}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 py-3 rounded-xl font-bold text-white transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Voltar ao Login
          </button>
        </div>
      ) : (
        <form onSubmit={handlePasswordReset} className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Email cadastrado</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="w-full p-3 pl-10 pr-4 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="seu.email@exemplo.com"
                required
                disabled={resetLoading}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setForgotPassword(false);
                setResetEmail("");
                setError("");
              }}
              className="flex-1 bg-gray-600 hover:bg-gray-700 py-3 rounded-xl font-bold text-white transition-all duration-300 border border-gray-500"
              disabled={resetLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={resetLoading}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 py-3 rounded-xl font-bold text-white transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {resetLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Mail size={20} />
                  Enviar
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );

  const loginForm = () => (
    <form onSubmit={handleLogin} className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Username Field */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">Utilizador</label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 pl-10 pr-4 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            placeholder="Digite seu utilizador"
            required
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">Senha</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 pl-10 pr-10 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            placeholder="Digite sua senha"
            required
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors duration-200"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

      {/* Remember Me & Forgot Password */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            disabled={isLoading}
          />
          Lembrar utilizador
        </label>
        <button
          type="button"
          onClick={() => setForgotPassword(true)}
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors duration-200"
          disabled={isLoading}
        >
          Esqueceu a senha?
        </button>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 py-3 rounded-xl font-bold text-white transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Entrando...
          </>
        ) : (
          <>
            <CheckCircle size={20} />
            Entrar
          </>
        )}
      </button>
    </form>
  );

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-800">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-20">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full animate-pulse"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 bg-gray-800/90 backdrop-blur-lg p-8 rounded-3xl shadow-2xl w-96 border border-gray-700">
        {/* Header */}
        {!forgotPassword && (
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Lock className="text-white" size={28} />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              WatchBase
            </h2>
            <p className="text-gray-400 mt-2">Faça login para continuar</p>
          </div>
        )}

        {/* Conteúdo principal - alterna entre login e recuperação de senha */}
        {forgotPassword ? resetPasswordForm() : loginForm()}

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            © 2025 WatchBase. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}