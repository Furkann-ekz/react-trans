import { Link, useNavigate } from 'react-router-dom';
import { t } from '../i18n';
import { useAuth } from '../context/AuthContext';

export function OnlineLobbyPage() {
  const { socket } = useAuth();
  const navigate = useNavigate();

  const handleJoinMatchmaking = (mode: '1v1' | '2v2') => {
    if (socket) {
      // Sunucuya hangi modda eşleştirmeye katılmak istediğimizi bildir
      socket.emit('joinMatchmaking', { mode });
      // Ardından oyun bekleme ekranına yönlendir
      navigate('/online-game');
    } else {
      // Soket bağlantısı yoksa bir uyarı göster
      alert('Connection error, please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-6">{t('online_lobby_title')}</h2>
        <div className="flex flex-col space-y-4">
          <button 
            onClick={() => handleJoinMatchmaking('1v1')} 
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded"
          >
            {t('play_1v1_button')}
          </button>
          <button 
            onClick={() => handleJoinMatchmaking('2v2')} 
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-4 rounded"
          >
            {t('play_2v2_button')}
          </button>
        </div>
        <Link to="/lobby" className="mt-8 inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800">
          {t('back_button')}
        </Link>
      </div>
    </div>
  );
}