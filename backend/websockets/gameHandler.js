const prisma = require('../prisma/db');

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

async function updatePlayerStats(playerIds, outcome) {
    const fieldToIncrement = outcome === 'win' ? 'wins' : 'losses';
    try {
        await prisma.user.updateMany({
            where: { id: { in: playerIds } },
            data: { [fieldToIncrement]: { increment: 1 } }
        });
    } catch (error) {
        console.error("Failed to update player stats:", error);
    }
}

async function saveMatch(game, winnerTeam, wasForfeit = false) {
    const { players, gameState, mode, startTime } = game;
    const team1 = players.filter(p => p.team === 1);
    const team2 = players.filter(p => p.team === 2);
    
    const player1Id = team1[0].id;
    const player2Id = team2[0].id;
    const durationInSeconds = Math.floor((Date.now() - startTime) / 1000);

    try {
        await prisma.match.create({
            data: {
                mode: mode,
                durationInSeconds: durationInSeconds,
                player1Id: player1Id,
                player3Id: team1[1]?.id,
                player2Id: player2Id,
                player4Id: team2[1]?.id,
                team1Score: gameState.team1Score,
                team2Score: gameState.team2Score,
                winnerTeam: winnerTeam,
                winnerId: winnerTeam === 1 ? player1Id : player2Id,
                wasForfeit: wasForfeit,
                team1Hits: players.filter(p => p.team === 1).reduce((sum, p) => sum + (p.hits || 0), 0),
                team1Misses: gameState.team2Score,
                team2Hits: players.filter(p => p.team === 2).reduce((sum, p) => sum + (p.hits || 0), 0),
                team2Misses: gameState.team1Score
            }
        });
        console.log("Maç başarıyla kaydedildi.");
    } catch (error) { 
        console.error("Maç kaydedilemedi:", error); 
    }
}

function startGameLoop(room, players, io, mode, gameConfig) {
    const startTime = Date.now();
    const WINNING_SCORE = 5;
    const BALL_RADIUS = 10;
    
    const game = { players, mode, gameState: {}, intervalId: null, startTime };

    let gameState = {
        ballX: gameConfig.canvasSize / 2, ballY: gameConfig.canvasSize / 2, ballSpeedX: 6, ballSpeedY: 6,
        team1Score: 0, team2Score: 0,
        players: players.map(p => ({ ...p, hits: 0 }))
    };
    game.gameState = gameState;
    
    const intervalId = setInterval(async () => {
        if (!game.gameState) return;
        const gs = game.gameState;
        gs.ballX += gs.ballSpeedX;
        gs.ballY += gs.ballSpeedY;

        gs.players.forEach(p => {
            if (p.position === 'left' || p.position === 'right') {
                const paddleEdgeX = (p.position === 'left') ? gameConfig.paddleThickness : gameConfig.canvasSize - gameConfig.paddleThickness;
                const ballEdgeX = (p.position === 'left') ? gs.ballX - BALL_RADIUS : gs.ballX + BALL_RADIUS;
                if (((p.position === 'left' && ballEdgeX <= paddleEdgeX && gs.ballSpeedX < 0) || (p.position === 'right' && ballEdgeX >= paddleEdgeX && gs.ballSpeedX > 0)) &&
                    (gs.ballY > p.y && gs.ballY < p.y + gameConfig.paddleSize)) {
                    gs.ballSpeedX = -gs.ballSpeedX;
                    p.hits++;
                }
            } else {
                const paddleEdgeY = (p.position === 'top') ? gameConfig.paddleThickness : gameConfig.canvasSize - gameConfig.paddleThickness;
                const ballEdgeY = (p.position === 'top') ? gs.ballY - BALL_RADIUS : gs.ballY + BALL_RADIUS;
                if (((p.position === 'top' && ballEdgeY <= paddleEdgeY && gs.ballSpeedY < 0) || (p.position === 'bottom' && ballEdgeY >= paddleEdgeY && gs.ballSpeedY > 0)) &&
                    (gs.ballX > p.x && gs.ballX < p.x + gameConfig.paddleSize)) {
                    gs.ballSpeedY = -gs.ballSpeedY;
                    p.hits++;
                }
            }
        });

        let scored = false;
        let scoringTeam = null;
        if (gs.ballX - BALL_RADIUS < 0) { const player = gs.players.find(p => p.position === 'left'); if(player) scoringTeam = player.team === 1 ? 2 : 1; scored = true; } 
        else if (gs.ballX + BALL_RADIUS > gameConfig.canvasSize) { const player = gs.players.find(p => p.position === 'right'); if(player) scoringTeam = player.team === 1 ? 2 : 1; scored = true; }
        if (mode === '2v2') {
            if (gs.ballY - BALL_RADIUS < 0) { const player = gs.players.find(p => p.position === 'top'); if(player) scoringTeam = player.team === 1 ? 2 : 1; scored = true; } 
            else if (gs.ballY + BALL_RADIUS > gameConfig.canvasSize) { const player = gs.players.find(p => p.position === 'bottom'); if(player) scoringTeam = player.team === 1 ? 2 : 1; scored = true; }
        } else { if (gs.ballY - BALL_RADIUS <= 0 || gs.ballY + BALL_RADIUS >= gameConfig.canvasSize) { gs.ballSpeedY = -gs.ballSpeedY; } }
        
        if (scored && scoringTeam) {
            if(scoringTeam === 1) gs.team1Score++; else gs.team2Score++;
            io.to(room).emit('gameStateUpdate', gs);

            if (gs.team1Score >= WINNING_SCORE || gs.team2Score >= WINNING_SCORE) {
                clearInterval(intervalId);
                const winners = players.filter(p => p.team === scoringTeam);
                const losers = players.filter(p => p.team !== scoringTeam);
                
                await updatePlayerStats(winners.map(p => p.id), 'win');
                await updatePlayerStats(losers.map(p => p.id), 'loss');
                await saveMatch(game, scoringTeam, false);

                io.to(room).emit('gameOver', { winners, losers, reason: 'score' });
                const playerSockets = players.map(p => io.sockets.sockets.get(p.socketId)).filter(Boolean);
                playerSockets.forEach(sock => { sock.leave(room); sock.gameRoom = null; });
                return; 
            }
            
            gs.ballX = gameConfig.canvasSize / 2;
            gs.ballY = gameConfig.canvasSize / 2;
            gs.ballSpeedX = -gs.ballSpeedX;
        }
        
        if (!scored) {
            io.to(room).emit('gameStateUpdate', gs);
        }
    }, 1000 / 60);

    game.intervalId = intervalId;

    const gameStartPayload = {
        players: players.map(p => ({id: p.id, name: p.name, email: p.email, position: p.position, team: p.team})),
        mode,
        ...gameConfig
    };
    io.to(room).emit('gameStart', gameStartPayload);
    return game;
}

function handleJoinMatchmaking(io, socket, state, payload) {
    const { mode } = payload;
    console.log(`--- [MATCHMAKING] Adım 1: ${socket.user.email} havuza katılmayı deniyor. Mod: ${mode} ---`);

    if (!mode || !state.waitingPlayers[mode]) {
        console.error(`[MATCHMAKING HATA] Geçersiz mod veya bekleme havuzu yok: ${mode}`);
        return;
    }

    const isInAnyPool = Object.values(state.waitingPlayers).some(pool => pool.some(p => p.user.id === socket.user.id));
    console.log(`[MATCHMAKING] Adım 2: ${socket.user.email} zaten bir havuzda mı? -> ${isInAnyPool}`);

    if (isInAnyPool) {
        console.log(`[MATCHMAKING] UYARI: ${socket.user.email} zaten bir bekleme havuzunda olduğu için işlem durduruldu.`);
        return;
    }

    const pool = state.waitingPlayers[mode];
    pool.push(socket);
    console.log(`[MATCHMAKING] Adım 3: ${socket.user.email} -> ${mode} havuzuna eklendi. (Havuzdaki yeni kişi sayısı: ${pool.length})`);
    pool.forEach(p => p.emit('updateQueue', { queueSize: pool.length, requiredSize: mode === '1v1' ? 2 : 4 }));

    let playerSockets;
    let players;
    const gameConfig = { canvasSize: 800, paddleSize: 100, paddleThickness: 15 };

    console.log(`[MATCHMAKING] Adım 4: Eşleşme kontrolü yapılıyor. Mod: ${mode}, Havuz Boyutu: ${pool.length}`);

    if (mode === '1v1' && pool.length >= 2) {
        console.log(`[MATCHMAKING] Adım 5: 1v1 eşleşmesi bulundu! Oyuncular seçiliyor...`);
        playerSockets = pool.splice(0, 2);
        const [p1, p2] = playerSockets;
        players = [
            { ...p1.user, socketId: p1.id, position: 'left', team: 1, x: 0, y: (gameConfig.canvasSize / 2) - (gameConfig.paddleSize / 2) },
            { ...p2.user, socketId: p2.id, position: 'right', team: 2, x: gameConfig.canvasSize - gameConfig.paddleThickness, y: (gameConfig.canvasSize / 2) - (gameConfig.paddleSize / 2) }
        ];
    }

    if (mode === '2v2' && pool.length >= 4) {
        console.log(`[MATCHMAKING] Adım 5: 2v2 eşleşmesi bulundu! Oyuncular seçiliyor...`);
        playerSockets = pool.splice(0, 4);
        shuffleArray(playerSockets);
        const teamConfig = Math.random() < 0.5 ? 1 : 2;

        if (teamConfig === 1) {
            players = [
                { ...playerSockets[0].user, socketId: playerSockets[0].id, position: 'left', team: 1 },
                { ...playerSockets[1].user, socketId: playerSockets[1].id, position: 'top', team: 1 },
                { ...playerSockets[2].user, socketId: playerSockets[2].id, position: 'right', team: 2 },
                { ...playerSockets[3].user, socketId: playerSockets[3].id, position: 'bottom', team: 2 }
            ];
        } else {
            players = [
                { ...playerSockets[0].user, socketId: playerSockets[0].id, position: 'left', team: 1 },
                { ...playerSockets[1].user, socketId: playerSockets[1].id, position: 'bottom', team: 1 },
                { ...playerSockets[2].user, socketId: playerSockets[2].id, position: 'right', team: 2 },
                { ...playerSockets[3].user, socketId: playerSockets[3].id, position: 'top', team: 2 }
            ];
        }
        players.forEach(p => {
            const center = (gameConfig.canvasSize / 2) - (gameConfig.paddleSize / 2);
            if (p.position === 'left') { p.x = 0; p.y = center; }
            if (p.position === 'right') { p.x = gameConfig.canvasSize - gameConfig.paddleThickness; p.y = center; }
            if (p.position === 'top') { p.y = 0; p.x = center; }
            if (p.position === 'bottom') { p.y = gameConfig.canvasSize - gameConfig.paddleThickness; p.x = center; }
        });
    }

    if (players && playerSockets) {
        console.log(`[MATCHMAKING] Adım 6: Oyun odası oluşturuluyor ve oyun başlatılıyor.`);
        const roomName = `game_${Date.now()}`;
        playerSockets.forEach(sock => {
            sock.join(roomName);
            sock.gameRoom = { id: roomName, mode: mode };
        });
        const game = startGameLoop(roomName, players, io, mode, gameConfig);
        state.gameRooms.set(roomName, game);
    } else {
        console.log(`[MATCHMAKING] Henüz yeterli oyuncu yok, beklemeye devam ediliyor.`);
    }

    socket.on('playerMove', (data) => {
        if (!socket.gameRoom) return;
        const game = state.gameRooms.get(socket.gameRoom.id);
        if (!game || !game.gameState) return;
        const playerState = game.gameState.players.find(p => p.id === socket.user.id);
        if (!playerState) return;
        
        const { newPosition } = data;
        const { canvasSize, paddleSize } = gameConfig;
        let finalPosition = newPosition;
        if (finalPosition < 0) finalPosition = 0;
        if (finalPosition > canvasSize - paddleSize) finalPosition = canvasSize - paddleSize;
        if (playerState.position === 'left' || playerState.position === 'right') playerState.y = finalPosition;
        if (playerState.position === 'top' || playerState.position === 'bottom') playerState.x = finalPosition;
    });
}

module.exports = {
    handleJoinMatchmaking,
    updatePlayerStats,
    saveMatch
};