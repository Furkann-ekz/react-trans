import { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { t } from '../i18n';

// Oyun sabitlerini tanımlayalım
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 100;
const BALL_RADIUS = 10;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

export function LocalGamePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Oyunun anlık durumunu (skor, pozisyonlar) tutmak için useState kullanıyoruz.
  const [gameState, setGameState] = useState({
    leftPaddleY: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    rightPaddleY: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    ballX: CANVAS_WIDTH / 2,
    ballY: CANVAS_HEIGHT / 2,
    ballSpeedX: 5,
    ballSpeedY: 5,
    leftScore: 0,
    rightScore: 0,
  });

  // Klavye tuşlarının basılı olup olmadığını takip etmek için useRef kullanıyoruz.
  // Bu, render döngüleri arasında durumu korur ama yeniden render tetiklemez.
  const keysPressed = useRef<{ [key: string]: boolean }>({});

  // Oyun döngüsü için useEffect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    
    let animationFrameId: number;

    const gameLoop = () => {
      // Oyun durumunu güncelle
      setGameState(prev => {
        let newBallX = prev.ballX + prev.ballSpeedX;
        let newBallY = prev.ballY + prev.ballSpeedY;
        let newBallSpeedX = prev.ballSpeedX;
        let newBallSpeedY = prev.ballSpeedY;
        let newLeftScore = prev.leftScore;
        let newRightScore = prev.rightScore;

        // Raket hareketleri
        let newLeftPaddleY = prev.leftPaddleY;
        let newRightPaddleY = prev.rightPaddleY;
        if (keysPressed.current['w'] && newLeftPaddleY > 0) newLeftPaddleY -= 8;
        if (keysPressed.current['s'] && newLeftPaddleY < CANVAS_HEIGHT - PADDLE_HEIGHT) newLeftPaddleY += 8;
        if (keysPressed.current['ArrowUp'] && newRightPaddleY > 0) newRightPaddleY -= 8;
        if (keysPressed.current['ArrowDown'] && newRightPaddleY < CANVAS_HEIGHT - PADDLE_HEIGHT) newRightPaddleY += 8;

        // Topun duvarlarla çarpışması
        if (newBallY - BALL_RADIUS < 0 || newBallY + BALL_RADIUS > CANVAS_HEIGHT) {
          newBallSpeedY = -newBallSpeedY;
        }

        // Topun raketlerle çarpışması
        if (newBallX - BALL_RADIUS < PADDLE_WIDTH && newBallY > newLeftPaddleY && newBallY < newLeftPaddleY + PADDLE_HEIGHT) {
            newBallSpeedX = -newBallSpeedX;
        }
        if (newBallX + BALL_RADIUS > CANVAS_WIDTH - PADDLE_WIDTH && newBallY > newRightPaddleY && newBallY < newRightPaddleY + PADDLE_HEIGHT) {
            newBallSpeedX = -newBallSpeedX;
        }

        // Skor ve topu sıfırlama
        if (newBallX - BALL_RADIUS < 0) {
          newRightScore++;
          newBallX = CANVAS_WIDTH / 2;
          newBallY = CANVAS_HEIGHT / 2;
          newBallSpeedX = -newBallSpeedX;
        } else if (newBallX + BALL_RADIUS > CANVAS_WIDTH) {
          newLeftScore++;
          newBallX = CANVAS_WIDTH / 2;
          newBallY = CANVAS_HEIGHT / 2;
          newBallSpeedX = -newBallSpeedX;
        }

        return {
          leftPaddleY: newLeftPaddleY,
          rightPaddleY: newRightPaddleY,
          ballX: newBallX,
          ballY: newBallY,
          ballSpeedX: newBallSpeedX,
          ballSpeedY: newBallSpeedY,
          leftScore: newLeftScore,
          rightScore: newRightScore,
        };
      });

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    // Component ekrandan ayrılırken oyun döngüsünü temizle
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []); // Boş dizi, bu useEffect'in sadece component ilk render edildiğinde çalışmasını sağlar

  // Çizim için ayrı bir useEffect. Bu, gameState her değiştiğinde çalışır.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    
    // Canvas'ı temizle
    context.fillStyle = 'black';
    context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Skoru çiz
    context.fillStyle = 'white';
    context.font = '75px fantasy';
    context.fillText(gameState.leftScore.toString(), CANVAS_WIDTH / 4, CANVAS_HEIGHT / 5);
    context.fillText(gameState.rightScore.toString(), 3 * CANVAS_WIDTH / 4, CANVAS_HEIGHT / 5);
    
    // Raketleri çiz
    context.fillRect(0, gameState.leftPaddleY, PADDLE_WIDTH, PADDLE_HEIGHT);
    context.fillRect(CANVAS_WIDTH - PADDLE_WIDTH, gameState.rightPaddleY, PADDLE_WIDTH, PADDLE_HEIGHT);
    
    // Topu çiz
    context.beginPath();
    context.arc(gameState.ballX, gameState.ballY, BALL_RADIUS, 0, Math.PI * 2);
    context.fill();

  }, [gameState]); // gameState her değiştiğinde bu çizim fonksiyonu tekrar çalışır

  // Klavye dinleyicileri için useEffect
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => { keysPressed.current[event.key] = true; };
    const handleKeyUp = (event: KeyboardEvent) => { keysPressed.current[event.key] = false; };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Component ekrandan ayrılırken dinleyicileri kaldır
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []); // Bu da sadece bir kere çalışır

  return (
    <div className="h-screen w-screen bg-gray-900 flex flex-col items-center justify-center">
      <h1 className="text-3xl text-white mb-4">Pong Game</h1>
      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="bg-black border border-white" />
      <Link to="/lobby" className="mt-4 text-blue-400 hover:text-blue-300">
        {t('return_to_lobby')}
      </Link>
    </div>
  );
}