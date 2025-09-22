const prisma = require('../prisma/db');
const authenticate = require('../middleware/authenticate');

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

async function tournamentRoutes(fastify, options) {

    async function startTournament(tournamentId) {
        try {
            const participants = await prisma.tournamentParticipant.findMany({
                where: { tournamentId: tournamentId },
            });
            shuffleArray(participants);
            for (let i = 0; i < participants.length; i += 2) {
                const player1 = participants[i];
                const player2 = participants[i + 1];
                if (player1 && player2) {
                    await prisma.match.create({
                        data: {
                            mode: '1v1_tournament',
                            player1Id: player1.userId,
                            player2Id: player2.userId,
                            tournamentId: tournamentId,
                            roundNumber: 1,
                            durationInSeconds: 0, team1Score: 0, team2Score: 0,
                            winnerId: player1.userId,
                            winnerTeam: 0
                        }
                    });
                }
            }
            await prisma.tournament.update({
                where: { id: tournamentId },
                data: { status: 'IN_PROGRESS' },
            });
            console.log(`Tournament #${tournamentId} has started!`);
        } catch(error) {
            console.error(`Failed to start tournament #${tournamentId}:`, error);
        }
    }

    fastify.get('/tournaments/:id', { preHandler: [authenticate] }, async (request, reply) => {
        const tournamentId = parseInt(request.params.id, 10);
        try {
            const tournament = await prisma.tournament.findUnique({
                where: { id: tournamentId },
                include: {
                    participants: {
                        orderBy: { id: 'asc' },
                        include: { user: { select: { id: true, name: true } } }
                    },
                    matches: {
                        orderBy: { roundNumber: 'asc' },
                        include: {
                            player1: { select: { id: true, name: true } },
                            player2: { select: { id: true, name: true } },
                            winner: { select: { id: true, name: true } }
                        }
                    }
                }
            });
            if (!tournament) {
                return reply.code(404).send({ error: 'Tournament not found' });
            }
            return tournament;
        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Could not fetch tournament details' });
        }
    });

    fastify.post('/tournaments', { preHandler: [authenticate] }, async (request, reply) => {
        const { size, name } = request.body;
        const creatorId = request.user.userId;
        const existingParticipation = await prisma.tournamentParticipant.findFirst({
            where: { userId: creatorId, tournament: { status: { not: 'COMPLETED' } } }
        });
        if (existingParticipation) {
            return reply.code(409).send({ error: 'You are already in an active tournament.' });
        }
        if (![4, 8, 16].includes(size)) {
            return reply.code(400).send({ error: 'Invalid tournament size.' });
        }
        try {
            const tournamentName = (typeof name === 'string' && name.trim() !== '') ? name.trim() : `Tournament #${Date.now().toString().slice(-4)}`;
            const newTournament = await prisma.tournament.create({
                data: { name: tournamentName, size: size, participants: { create: { userId: creatorId } } }
            });
            await prisma.user.update({
                where: { id: creatorId }, data: { tournamentsPlayed: { increment: 1 } }
            });
            return reply.code(201).send(newTournament);
        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Could not create tournament' });
        }
    });

    fastify.get('/tournaments', { preHandler: [authenticate] }, async (request, reply) => {
        try {
            const availableTournaments = await prisma.tournament.findMany({
                where: { status: 'WAITING_FOR_PLAYERS' },
                include: { participants: { select: { user: { select: { id: true, name: true } } } } },
                orderBy: { createdAt: 'desc' }
            });
            return availableTournaments;
        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Could not fetch tournaments' });
        }
    });

    fastify.post('/tournaments/:id/join', { preHandler: [authenticate] }, async (request, reply) => {
        const tournamentId = parseInt(request.params.id, 10);
        const userId = request.user.userId;
        const existingParticipation = await prisma.tournamentParticipant.findFirst({
            where: { userId: userId, tournament: { status: { not: 'COMPLETED' } } }
        });
        if (existingParticipation) {
            return reply.code(409).send({ error: 'You are already in an active tournament.' });
        }
        try {
            const tournament = await prisma.tournament.findFirst({
                where: { id: tournamentId, status: 'WAITING_FOR_PLAYERS' },
                include: { _count: { select: { participants: true } } }
            });
            if (!tournament) return reply.code(404).send({ error: 'Tournament not found or has already started' });
            if (tournament._count.participants >= tournament.size) return reply.code(403).send({ error: 'This tournament is full' });

            await prisma.tournamentParticipant.create({
                data: { tournamentId: tournamentId, userId: userId }
            });
            await prisma.user.update({
                where: { id: userId }, data: { tournamentsPlayed: { increment: 1 } }
            });
            const updatedTournament = await prisma.tournament.findUnique({
                where: { id: tournamentId },
                include: { participants: { include: { user: { select: { id: true, name: true } } } } }
            });
            return reply.code(200).send(updatedTournament);
        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Could not join tournament' });
        }
    });
    
    fastify.delete('/tournaments/:id/leave', { preHandler: [authenticate] }, async (request, reply) => {
        const tournamentId = parseInt(request.params.id, 10);
        const userId = request.user.userId;
        try {
            await prisma.tournamentParticipant.delete({
                where: { tournamentId_userId: { tournamentId, userId } }
            });
            await prisma.user.update({
                where: { id: userId }, data: { tournamentsPlayed: { decrement: 1 } }
            });
            const remaining = await prisma.tournamentParticipant.count({ where: { tournamentId } });
            if (remaining === 0) {
                await prisma.tournament.delete({ where: { id: tournamentId } });
            }
            return { message: 'Successfully left the tournament' };
        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Could not leave tournament' });
        }
    });

    fastify.post('/tournaments/:id/ready', { preHandler: [authenticate] }, async (request, reply) => {
        const tournamentId = parseInt(request.params.id, 10);
        const userId = request.user.userId;
        try {
            const participant = await prisma.tournamentParticipant.findUnique({
                where: { tournamentId_userId: { tournamentId, userId } }
            });
            const newReadyState = !participant.isReady;
            await prisma.tournamentParticipant.update({
                where: { tournamentId_userId: { tournamentId, userId } },
                data: { isReady: newReadyState }
            });
            const tournament = await prisma.tournament.findUnique({
                where: { id: tournamentId }, include: { participants: true }
            });
            const isFull = tournament.participants.length === tournament.size;
            const allReady = tournament.participants.every(p => p.isReady);
            if (isFull && allReady) {
                await startTournament(tournamentId);
            }
            return { message: `You are now ${newReadyState ? 'ready' : 'not ready'}` };
        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Could not set ready status' });
        }
    });
}

module.exports = tournamentRoutes;