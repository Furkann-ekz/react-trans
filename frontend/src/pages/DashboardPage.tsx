import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { t } from '../i18n';
import { LanguageSwitcher } from '../components/LanguageSwitcher'; // Yeni import

interface User {
  id: number;
  name: string;
  email: string;
}
interface ChatMessage {
  type: 'public' | 'private';
  sender: string;
  content: string;
}

export function DashboardPage() {
  const { user, logout, socket } = useAuth(); // Soketi doğrudan useAuth'dan alıyoruz
  const navigate = useNavigate();

  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState<User | null>(null);
  const messagesEndRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!socket) return;

    socket.on('update user list', (users: User[]) => setOnlineUsers(users));
    socket.on('chat message', (msg: ChatMessage) => setMessages(prev => [...prev, msg]));
    socket.emit('requestUserList');

    return () => {
      socket.off('update user list');
      socket.off('chat message');
    };
  }, [socket]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && socket) {
      if (selectedRecipient) {
        socket.emit('private message', { recipientId: selectedRecipient.id, message: newMessage });
      } else {
        socket.emit('chat message', newMessage);
      }
      setNewMessage('');
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-100">
      <nav className="bg-gray-800 text-white p-4 flex justify-between items-center w-full">
        <div className="w-1/3">
          <LanguageSwitcher />
        </div>
        <div className="w-1/3 text-center"><h1 className="text-xl font-bold">Transcendence</h1></div>
        <div className="w-1/3 flex justify-end items-center space-x-4">
          <Link to="/lobby" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">{t('go_to_game')}</Link>
          <button onClick={handleLogout} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">{t('logout')}</button>
        </div>
      </nav>

      <div className="flex flex-grow overflow-hidden p-4 space-x-4">
        <div className="w-1/4 bg-white p-4 rounded-lg shadow-md overflow-y-auto">
          <h2 className="text-lg font-bold mb-4">{t('online_users')}</h2>
          <ul className="space-y-2">
            <li onClick={() => setSelectedRecipient(null)} className={`p-2 rounded cursor-pointer ${!selectedRecipient ? 'bg-blue-200' : 'hover:bg-gray-200'}`}>
              {t('everyone')}
            </li>
            {onlineUsers.map(onlineUser => (
              <li key={onlineUser.id} onClick={() => onlineUser.id !== user?.userId && setSelectedRecipient(onlineUser)} 
                  className={`p-2 rounded ${selectedRecipient?.id === onlineUser.id ? 'bg-blue-200' : 'hover:bg-gray-200'} ${onlineUser.id === user?.userId ? 'font-bold text-gray-900' : 'cursor-pointer'}`}>
                <Link to={`/profile/${onlineUser.id}`} className="hover:underline">
                  {onlineUser.name || onlineUser.email} {onlineUser.id === user?.userId ? `(${t('you_suffix')})` : ''}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="w-3/4 flex flex-col bg-white rounded-lg shadow-md">
          <div className="p-4 border-b">
            <strong>{t('recipient')}:</strong> <span>{selectedRecipient ? (selectedRecipient.name || selectedRecipient.email) : t('everyone')}</span>
          </div>
          <ul className="flex-grow p-4 overflow-y-auto">
            {messages.map((msg, index) => (
              <li key={index}>
                <span className="font-semibold">{msg.type === 'private' ? `[${t('chat_private_prefix')}] ` : ''}{msg.sender}: </span>
                {msg.content}
              </li>
            ))}
            <li ref={messagesEndRef} />
          </ul>
          <form onSubmit={handleSendMessage} className="p-4 bg-gray-200 flex rounded-b-lg">
            <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder={t('chat_placeholder')} className="border rounded-l-md p-2 flex-grow" />
            <button type="submit" className="bg-blue-500 text-white px-4 rounded-r-md hover:bg-blue-600">{t('send_button')}</button>
          </form>
        </div>
      </div>
    </div>
  );
}