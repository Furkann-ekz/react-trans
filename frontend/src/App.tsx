import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Tüm sayfalarımızı gerçek bileşenler olarak import ediyoruz.
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { LobbyPage } from './pages/LobbyPage';
import { OnlineLobbyPage } from './pages/OnlineLobbyPage';
import { LocalGamePage } from './pages/LocalGamePage';
import { OnlineGamePage } from './pages/OnlineGamePage';
import { TournamentLobbyPage } from './pages/TournamentLobbyPage';
import { TournamentDetailsPage } from './pages/TournamentDetailsPage';
import { ProfilePage } from './pages/ProfilePage';
import { ProfileEditPage } from './pages/ProfileEditPage';
import { MatchHistoryPage } from './pages/MatchHistoryPage';

/**
 * Giriş yapmamış kullanıcıların erişemeyeceği rotaları koruyan bileşen
 */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { token } = useAuth();
    if (!token) {
        return <Navigate to="/" replace />;
    }
    return <>{children}</>;
};

/**
 * Tüm uygulama rotalarını tanımlayan bileşen
 */
function AppRoutes() {
  const { token } = useAuth();
  return (
    <Routes>
      {/* Halka Açık Rotalar */}
      <Route path="/" element={token ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/register" element={token ? <Navigate to="/dashboard" /> : <RegisterPage />} />

      {/* Korunmuş Rotalar */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/lobby" element={<ProtectedRoute><LobbyPage /></ProtectedRoute>} />
      <Route path="/online-lobby" element={<ProtectedRoute><OnlineLobbyPage /></ProtectedRoute>} />
      <Route path="/local-game" element={<ProtectedRoute><LocalGamePage /></ProtectedRoute>} />
      <Route path="/online-game" element={<ProtectedRoute><OnlineGamePage /></ProtectedRoute>} />
      <Route path="/tournaments" element={<ProtectedRoute><TournamentLobbyPage /></ProtectedRoute>} />
      <Route path="/tournaments/:id" element={<ProtectedRoute><TournamentDetailsPage /></ProtectedRoute>} />
      <Route path="/profile/edit" element={<ProtectedRoute><ProfileEditPage /></ProtectedRoute>} />
      <Route path="/profile/:id" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/profile/:id/history" element={<ProtectedRoute><MatchHistoryPage /></ProtectedRoute>} />

      {/* Eşleşmeyen tüm yolları ana sayfaya yönlendir */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

/**
 * Uygulamanın en dış katmanı
 */
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;