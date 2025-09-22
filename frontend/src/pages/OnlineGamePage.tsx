import { useRef, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { t } from '../i18n';

// Sunucudan gelecek oyun durumu ve ayarları için tipler
interface PlayerState {
  id: number;
  name: string;
  position: 'left' | 'right' | 'top' | 'bottom';
  team: number;
  x: number;
  y: number;
}
interface GameState {
  ballX: number;
  ballY: number;
  team1Score: number;
  team2Score: number;
  players: PlayerState[];
}
interface GameConfig {
    canvasSize: number;
    paddleSize: number;
    paddleThickness: number;
    mode: '1v1' | '2v2';
    players: PlayerState[];
}

export function OnlineGamePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { user, socket } = useAuth();
  const navigate = useNavigate();

  const [statusMessage, setStatusMessage] = useState(t('waiting_for_opponent'));
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
  const [gameOverInfo, setGameOverInfo] = useState<{ text: string; reason: string } | null>(null);

  // Klavye girdisini sunucuya gönderme
  useEffect(() => {
    if (!socket || !gameConfig) return;

    const handlePlayerMove = (event: KeyboardEvent) => {
      const myPlayer = gameConfig.players.find(p => p.id === user.userId);
      if (!myPlayer) return;

      // Oyuncunun mevcut dikey veya yatay pozisyonunu bul
      const playerState = gameState?.players.find(p => p.id === myPlayer.id);
      if (!playerState) return;
      const currentPos = (myPlayer.position === 'left' || myPlayer.position === 'right') ? playerState.y : playerState.x;

      let newPos: number | undefined;
      if (event.key === 'w' || event.key === 'ArrowUp') newPos = currentPos - 30;
      else if (event.key === 's' || event.key === 'ArrowDown') newPos = currentPos + 30;

      if (newPos !== undefined) {
        socket.emit('playerMove', { newPosition: newPos });
      }
    };

    window.addEventListener('keydown', handlePlayerMove);
    return () => window.removeEventListener('keydown', handlePlayerMove);
  }, [socket, user, gameState, gameConfig]);

  // Soket olaylarını dinleme
  useEffect(() => {
    if (!socket) return;

    socket.on('updateQueue', ({ queueSize, requiredSize }) => {
      setStatusMessage(`${t('waiting_for_opponent')} (${queueSize}/${requiredSize})`);
    });

    socket.on('gameStart', (payload: GameConfig) => {
      setGameConfig(payload);
      setStatusMessage('');
    });

    socket.on('gameStateUpdate', (newGameState: GameState) => {
      setGameState(newGameState);
    });

    socket.on('gameOver', ({ winners, reason }) => {
      const isWinner = winners.some((winner: any) => winner.id === user.userId);
      setGameOverInfo({
        text: isWinner ? t('you_win') : t('you_lose'),
        reason: reason
      });
    });

    // Component ekrandan ayrılırken, oyuncuyu lobi veya oyundan çıkar
    return () => {
      socket.emit('leaveGameOrLobby');
      socket.off('updateQueue');
      socket.off('gameStart');
      socket.off('gameStateUpdate');
      socket.off('gameOver');
    };
  }, [socket, user, navigate]);

  // Oyunu canvas üzerine çizme
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameState || !gameConfig) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = gameConfig.canvasSize;
    canvas.height = gameConfig.canvasSize;

    context.fillStyle = 'black';
    context.fillRect(0, 0, gameConfig.canvasSize, gameConfig.canvasSize);

    context.fillStyle = 'white';
    context.font = '75px fantasy';
    context.textAlign = 'center';
    context.fillText(gameState.team1Score.toString(), gameConfig.canvasSize / 4, gameConfig.canvasSize / 5);
    context.fillText(gameState.team2Score.toString(), (gameConfig.canvasSize * 3) / 4, gameConfig.canvasSize / 5);

    gameState.players.forEach((player) => {
      context.fillStyle = player.team === 1 ? '#60a5fa' : '#f87171';
      if (player.position === 'left' || player.position === 'right') {
        context.fillRect(player.x, player.y, gameConfig.paddleThickness, gameConfig.paddleSize);
      } else {
        context.fillRect(player.x, player.y, gameConfig.paddleSize, gameConfig.paddleThickness);
      }
    });

    context.fillStyle = 'white';
    context.beginPath();
    context.arc(gameState.ballX, gameState.ballY, 10, 0, Math.PI * 2);
    context.fill();
    
  }, [gameState, gameConfig]);

  return (
    <div className="h-screen w-screen bg-gray-900 flex flex-col items-center justify-center relative">
      {!gameOverInfo && <h1 className="text-3xl text-white mb-4">{statusMessage}</h1>}
      <canvas ref={canvasRef} className={`bg-black border border-white ${!!gameConfig ? '' : 'hidden'}`} />
      
      {gameOverInfo && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center text-white">
          <h2 className="text-6xl font-bold mb-8">{gameOverInfo.text}</h2>
          <p className="text-xl mb-4">{t('return_to_lobby')}</p>
          <Link to="/lobby" className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded">
            {t('lobby_title')}
          </Link>
        </div>
      )}

      {!gameOverInfo && (
        <Link to="/online-lobby" className="mt-4 text-blue-400 hover:text-blue-300">
          {t('leave_lobby')}
        </Link>
      )}
    </div>
  );
}