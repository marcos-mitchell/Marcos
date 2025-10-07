import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import Layout from "./Layout";
import Dashboard from "./pages/Dashboard";
import Historico from "./pages/Historico";
import ConfigCameras from "./pages/ConfigCameras";
import ConfigUsers from "./pages/ConfigUsers";
import Login from "./pages/Login";

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);

  if (!currentUser) {
    return <Login onLogin={setCurrentUser} />;
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={<Layout currentUser={currentUser} onLogout={() => setCurrentUser(null)} />}
        >
          <Route index element={<Dashboard currentUser={currentUser} />} />
          <Route path="historico" element={<Historico currentUser={currentUser} />} />
          <Route path="config" element={<ConfigCameras currentUser={currentUser} />} />
          <Route path="usuarios" element={<ConfigUsers currentUser={currentUser} />} />
        </Route>
        
        {/* Redirecionamento para login */}
        <Route path="/login" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}