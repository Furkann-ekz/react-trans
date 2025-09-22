import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { t } from '../i18n';
import { useAuth } from '../context/AuthContext';
import { getCurrentUserProfile, updateUserProfile, changePassword } from '../api/users';


export function ProfileEditPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Sayfa yüklendiğinde mevcut kullanıcı adını alıp input'a yaz
  useEffect(() => {
    const fetchCurrentName = async () => {
      try {
        const profile = await getCurrentUserProfile();
        setName(profile.name || '');
      } catch (error) {
        console.error("Could not fetch user name", error);
      }
    };
    fetchCurrentName();
  }, []);

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateUserProfile({ name });
      alert(t('profile_update_success'));
      if (user) navigate(`/profile/${user.userId}`);
    } catch (err: any) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert(t('passwords_do_not_match'));
      return;
    }
    if (newPassword.length < 6) {
      alert(t('password_too_short'));
      return;
    }
    try {
      await changePassword({ currentPassword, newPassword });
      alert(t('password_update_success'));
      // Formu temizle
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      alert(err.response?.data?.error || err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        
        <h2 className="text-2xl font-bold mb-6 text-center">{t('edit_profile_title')}</h2>
        <form onSubmit={handleNameSubmit} className="mb-8">
          <div className="mb-4">
            <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">{t('name_label')}</label>
            <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" required />
          </div>
          <div className="flex items-center justify-between">
            <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              {t('save_name_button')}
            </button>
            <Link to={`/profile/${user?.userId}`} className="inline-block align-baseline font-bold text-sm text-gray-500 hover:text-gray-800">
              {t('back_button')}
            </Link>
          </div>
        </form>

        <hr/>

        <h3 className="text-xl font-bold my-6 text-center">{t('change_password_title')}</h3>
        <form onSubmit={handlePasswordSubmit}>
            <div className="mb-4">
                <label htmlFor="current-password">{t('current_password_label')}</label>
                <input type="password" id="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" required />
            </div>
            <div className="mb-4">
                <label htmlFor="new-password">{t('new_password_label')}</label>
                <input type="password" id="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" required />
            </div>
            <div className="mb-6">
                <label htmlFor="confirm-password">{t('confirm_password_label')}</label>
                <input type="password" id="confirm-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" required />
            </div>
            <div className="flex items-center justify-start">
                <button type="submit" className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                    {t('change_password_button')}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
}