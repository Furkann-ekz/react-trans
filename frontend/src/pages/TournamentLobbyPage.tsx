import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { t } from '../i18n';
import { listTournaments, createTournament } from '../api/tournaments';

interface TournamentParticipant {
  user: {
    id: number;
    name: string;
  }
}
interface Tournament {
  id: number;
  name: string;
  size: number;
  status: 'WAITING_FOR_PLAYERS' | 'IN_PROGRESS' | 'COMPLETED';
  participants: TournamentParticipant[];
}

export function TournamentLobbyPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTournaments = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await listTournaments();
      setTournaments(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch tournaments.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const handleCreateTournament = async (size: number) => {
    try {
      await createTournament(size);
      fetchTournaments();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const renderTournamentList = () => {
    if (isLoading) {
      return <p className="text-center text-gray-500">{t('loading_tournaments')}</p>;
    }
    if (error) {
      return <p className="text-center text-red-500">{error}</p>;
    }
    if (tournaments.length === 0) {
      return <p className="text-center text-gray-500">{t('no_tournaments_found')}</p>;
    }
    
    return tournaments.map((tournament) => (
      <div key={tournament.id} className="p-4 border rounded-lg block hover:bg-gray-100">
        <Link to={`/tournaments/${tournament.id}`} className="flex justify-between items-center">
          <div>
            <p className="font-bold text-lg">{t('tournament_prefix')} #{tournament.id} ({t('player_count', { count: tournament.size })})</p>
            <p className="text-sm text-gray-600">
              {t('participants')}: {tournament.participants.length} / {tournament.size}
            </p>
          </div>
          <span className={`text-sm font-bold ${tournament.status === 'IN_PROGRESS' ? 'text-red-500' : 'text-green-500'}`}>
            {t(tournament.status)}
          </span>
        </Link>
      </div>
    ));
  };

  return (
    <div className="container mx-auto p-4 sm:p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">{t('tournaments_title')}</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-bold mb-4">{t('create_new_tournament')}</h2>
        <div className="flex items-center space-x-4">
          <button onClick={() => handleCreateTournament(4)} className="create-tournament-btn bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">{t('4_player_tournament')}</button>
          <button onClick={() => handleCreateTournament(8)} className="create-tournament-btn bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">{t('8_player_tournament')}</button>
          <button onClick={() => handleCreateTournament(16)} className="create-tournament-btn bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">{t('16_player_tournament')}</button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">{t('available_tournaments')}</h2>
        <div className="space-y-4">
          {renderTournamentList()}
        </div>
      </div>
      
      <div className="text-center mt-8">
         <Link to="/lobby" className="text-blue-500 hover:text-blue-800">{t('back_to_lobby')}</Link>
      </div>
    </div>
  );
}