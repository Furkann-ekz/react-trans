import { createContext, useState, useContext, useEffect } from 'react';
import type { ReactNode } from 'react'; // Hatanın çözümü için import'u bu şekilde güncelledik
import { io, Socket } from 'socket.io-client';
import { jwt_decode } from '../utils';

const SOCKET_URL = `https://${window.location.hostname}`;

interface AuthContextType {
  token: string | null;
  user: any;
  socket: Socket | null;
  login: (newToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<any>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    let newSocket: Socket | null = null;
    if (token) {
      try {
        const decodedUser = jwt_decode(token);
        setUser(decodedUser);
        
        // Sadece yeni bir bağlantı yoksa oluştur
        newSocket = io(SOCKET_URL, {
          path: '/api/socket.io',
          auth: { token },
        });
        setSocket(newSocket);
        
        newSocket.on('forceDisconnect', (reason: string) => {
            console.log(`Sunucu tarafından bağlantı sonlandırıldı: ${reason}`);
            alert('Başka bir konumdan giriş yapıldığı için bu oturum sonlandırıldı.');
            logout();
        });

      } catch (e) {
        console.error("Geçersiz token, çıkış yapılıyor.", e);
        logout();
      }
    }

    // Bu effect'ten çıkıldığında (logout olduğunda veya component unmount olduğunda) soketi kapat
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const login = (newToken: string) => {
    setToken(newToken);
    localStorage.setItem('token', newToken);
  };

  const logout = () => {
    // Önce soketi kapat
    if(socket) {
      socket.disconnect();
    }
    // Sonra state'leri temizle
    setSocket(null);
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  const value = { token, user, socket, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};