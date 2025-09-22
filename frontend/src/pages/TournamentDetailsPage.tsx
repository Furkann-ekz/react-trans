import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { t } from '../i18n';
import { getTournamentDetails, joinTournament, leaveTournament, setReadyTournament } from '../api/tournaments';

// Veri tiplerini tanımlayalım
interface Participant {
  isReady: boolean;
  user: {
    id: number;
    name: string;
  };
}
interface Match {
  id: number;
  player1: { name: string };
  player2: { name: string };
  team1Score: number;
  team2Score: number;
}
interface Tournament {
  id: number;
  name: string;
  size: number;
  status: string;
  createdAt: string;
  participants: Participant[];
  matches: Match[];
}

export function TournamentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTournament = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const data = await getTournamentDetails(id);
      setTournament(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch details.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTournament();
  }, [fetchTournament]);

  const handleJoin = async () => {
    if (!id) return;
    try {
      await joinTournament(id);
      fetchTournament();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const handleLeave = async () => {
    if (!id) return;
    try {
      await leaveTournament(id);
      navigate('/tournaments');
    } catch (err: any) {
      alert(err.response?.data?.error || err.message);
    }
  };
  
  const handleReady = async () => {
     if (!id) return;
    try {
      await setReadyTournament(id);
      fetchTournament();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const renderActionButtons = () => {
    if (!tournament || !user) return null;

    const isParticipant = tournament.participants.some(p => p.user.id === user.userId);
    const myParticipantData = tournament.participants.find(p => p.user.id === user.userId);

    if (tournament.status !== 'WAITING_FOR_PLAYERS') {
      return <p className="text-gray-500">{t('tournament_has_started')}</p>;
    }

    if (isParticipant) {
      return (
        <div className="flex space-x-2">
          <button onClick={handleLeave} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
            {t('leave_tournament_button')}
          </button>
          <button onClick={handleReady} disabled={myParticipantData?.isReady} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400">
            {myParticipantData?.isReady ? t('ready_button_active') : t('ready_button_inactive')}
          </button>
        </div>
      );
    } else if (tournament.participants.length < tournament.size) {
      return (
        <button onClick={handleJoin} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          {t('join_tournament_button')}
        </button>
      );
    } else {
      return <p className="text-gray-500">{t('tournament_is_full')}</p>;
    }
  };
  
  if (isLoading) return <p className="text-center text-gray-500 p-8">{t('loading_tournament_details')}</p>;
  if (error) return <p className="text-red-500 text-center p-8">{error}</p>;
  if (!tournament) return null;

  return (
    <div className="container mx-auto p-4 sm:p-8 max-w-6xl">
        <h1 className="text-3xl font-bold mb-2 text-center">{tournament.name}</h1>
        <p className="text-center text-gray-500 mb-6">{t('tournament_created_on')} {new Date(tournament.createdAt).toLocaleDateString('tr-TR')}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-4">{t('participants')} ({tournament.participants.length} / {tournament.size})</h2>
                <ul className="space-y-2 mb-6">
                    {tournament.participants.map(p => 
                        <li key={p.user.id} className={`p-2 rounded flex justify-between items-center ${p.isReady ? 'bg-green-100' : 'bg-gray-100'}`}>
                            <span>{p.user.name}</span>
                            {p.isReady && <span className="text-green-600 font-bold text-sm">{t('ready_status')}</span>}
                        </li>
                    )}
                </ul>
                <div className="space-y-2">
                    {renderActionButtons()}
                </div>
            </div>

            <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-4">{t('matches')}</h2>
                <ul id="match-list">
                  {tournament.matches.length > 0 
                      ? tournament.matches.map(match => (
                          <li key={match.id} className="p-2 border-t flex justify-between">
                              <span>{match.player1.name} vs {match.player2.name}</span>
                              <span className="font-bold">{match.team1Score} - {match.team2Score}</span>
                          </li>
                      )) 
                      : <li><p className="text-gray-500">{t('matches_not_created_yet')}</p></li>
                  }
              </ul>
            </div>
        </div>
         <div className="text-center mt-8">
            <Link to="/tournaments" className="text-blue-500 hover:text-blue-800">{t('back_to_tournaments')}</Link>
        </div>
    </div>
  );
}