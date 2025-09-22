import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMatchHistory, getUserProfile } from '../api/users';
import { t } from '../i18n';

interface Match {
  id: number;
  createdAt: string;
  durationInSeconds: number;
  player1: { id: number, name: string };
  player2: { id: number, name: string };
  team1Score: number;
  team2Score: number;
  winnerId: number;
}

// Saniyeyi "dakika:saniye" formatına çeviren yardımcı fonksiyon
function formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function MatchHistoryPage() {
  const { id } = useParams<{ id: string }>();
  const [matches, setMatches] = useState<Match[]>([]);
  const [profileName, setProfileName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError('');
        // Hem maç geçmişini hem de profil adını aynı anda çekelim
        const [matchData, profileData] = await Promise.all([
          getMatchHistory(id),
          getUserProfile(id)
        ]);
        setMatches(matchData);
        setProfileName(profileData.name || 'User');
      } catch (err: any) {
        setError(err.message || 'Failed to fetch data.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (isLoading) return <p className="text-center p-8">{t('loading_history')}</p>;
  if (error) return <p className="text-red-500 text-center p-8">{error}</p>;
  
  const profileOwnerId = parseInt(id || '0', 10);

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
        {t('match_history_for_user', { name: profileName })}
      </h1>
      <div className="space-y-4 max-w-4xl mx-auto max-h-[70vh] overflow-y-auto p-2">
        {matches.length === 0 ? (
          <p className="text-center text-gray-500">{t('no_matches_found')}</p>
        ) : (
          matches.map(match => {
            const isPlayer1ProfileOwner = match.player1.id === profileOwnerId;
            const profileOwnerData = isPlayer1ProfileOwner ? match.player1 : match.player2;
            const opponentData = isPlayer1ProfileOwner ? match.player2 : match.player1;
            const profileOwnerScore = isPlayer1ProfileOwner ? match.team1Score : match.team2Score;
            const opponentScore = isPlayer1ProfileOwner ? match.team2Score : match.team1Score;
            const didProfileOwnerWin = match.winnerId === profileOwnerId;

            return (
              <div key={match.id} className={`bg-white p-4 rounded-lg shadow-md flex items-center justify-between relative`}>
                <div className={`absolute left-0 top-0 bottom-0 w-2 ${didProfileOwnerWin ? 'bg-green-500' : 'bg-red-500'} rounded-l-lg`}></div>
                <div className={`absolute right-0 top-0 bottom-0 w-2 ${!didProfileOwnerWin ? 'bg-green-500' : 'bg-red-500'} rounded-r-lg`}></div>

                <div className="flex-1 text-center">
                  <p className="font-bold text-lg">{profileOwnerData.name}</p>
                  <p className={`text-sm font-bold ${didProfileOwnerWin ? 'text-green-600' : 'text-red-600'}`}>
                    {didProfileOwnerWin ? t('outcome_win') : t('outcome_lose')}
                  </p>
                </div>

                <div className="text-center border-l border-r px-4 mx-4">
                  <p className="text-4xl font-bold">
                    <span>{profileOwnerScore}</span> - <span>{opponentScore}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-2">{new Date(match.createdAt).toLocaleString('tr-TR')}</p>
                  <p className="text-xs text-gray-400">{t('stat_duration')}: {formatDuration(match.durationInSeconds)}</p>
                </div>

                <div className="flex-1 text-center">
                  <p className="font-bold text-lg">{opponentData.name}</p>
                   <p className={`text-sm font-bold ${!didProfileOwnerWin ? 'text-green-600' : 'text-red-600'}`}>
                    {!didProfileOwnerWin ? t('outcome_win') : t('outcome_lose')}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
       <div className="text-center mt-8">
         <Link to={`/profile/${id}`} className="text-blue-500 hover:text-blue-800">{t('back_to_profile')}</Link>
      </div>
    </div>
  );
}