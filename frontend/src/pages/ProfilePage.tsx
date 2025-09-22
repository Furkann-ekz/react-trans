import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserProfile } from '../api/users';
import { t } from '../i18n';

interface UserProfile {
  id: number;
  name: string;
  createdAt: string;
  wins: number;
  losses: number;
  tournamentsPlayed: number;
  tournamentsWon: number;
}

export function ProfilePage() {
  const { id } = useParams<{ id: string }>(); // URL'den kullanıcı ID'sini al
  const { user: currentUser } = useAuth(); // Giriş yapmış kullanıcının bilgileri
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        setError('');
        const data = await getUserProfile(id);
        setProfile(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch profile.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [id]); // id her değiştiğinde bu fonksiyon yeniden çalışır

  if (isLoading) return <p className="text-center p-8">{t('loading_profile')}</p>;
  if (error) return <p className="text-red-500 text-center p-8">{error}</p>;
  if (!profile) return null;

  const isMyProfile = currentUser?.userId === profile.id;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-2xl text-center">
        <h2 className="text-3xl font-bold mb-2">{profile.name || 'Unnamed User'}</h2>
        <p className="text-gray-500 text-sm mb-6">
          {t('profile_joined_on')} {new Date(profile.createdAt).toLocaleDateString('tr-TR')}
        </p>
        
        <div className="flex justify-center space-x-8 border-t border-b py-4">
          <div>
            <p className="text-2xl font-bold text-green-500">{profile.wins}</p>
            <p className="text-sm text-gray-600">{t('match_wins')}</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-500">{profile.losses}</p>
            <p className="text-sm text-gray-600">{t('match_losses')}</p>
          </div>
          {/* --- DÜZELTİLMİŞ KISIM --- */}
          <div>
            <p className="text-2xl font-bold text-blue-500">{profile.tournamentsPlayed}</p>
            <p className="text-sm text-gray-600">{t('tournaments_played')}</p>
          </div>
           <div>
            <p className="text-2xl font-bold text-yellow-500">{profile.tournamentsWon}</p>
            <p className="text-sm text-gray-600">{t('tournaments_won')}</p>
          </div>
          {/* --- DÜZELTME SONU --- */}
        </div>
        
        {isMyProfile && (
            <Link to="/profile/edit" className="mt-6 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded block">
                {t('edit_profile_button')}
            </Link>
        )}

        <Link to={`/profile/${profile.id}/history`} className="mt-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded block">
          {t('view_match_history')}
        </Link>

        <Link to="/dashboard" className="mt-8 inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800">
          {t('return_to_chat')}
        </Link>
      </div>
    </div>
  );
}