import { Link } from 'react-router-dom';
import { t } from '../i18n';

export function LobbyPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-6">{t('lobby_title')}</h2>
        <div className="flex flex-col space-y-4">
          <Link to="/local-game" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded">
            {t('play_local_button')}
          </Link>
          <Link to="/online-lobby" className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-4 rounded">
            {t('play_online_button')}
          </Link>
          <Link to="/tournaments" className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded">
            {t('tournaments_button')}
          </Link>
        </div>
        <Link to="/dashboard" className="mt-8 inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800">
          {t('return_to_chat')}
        </Link>
      </div>
    </div>
  );
}