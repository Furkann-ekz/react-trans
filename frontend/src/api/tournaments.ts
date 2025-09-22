// frontend/src/api/tournaments.ts
import apiClient from './axiosConfig';

// Mevcut, oyuncu bekleyen turnuvaları listeler
export async function listTournaments() {
  const response = await apiClient.get('/tournaments');
  return response.data;
}

// Yeni bir turnuva oluşturur
export async function createTournament(size: number) {
  const response = await apiClient.post('/tournaments', { size });
  return response.data;
}

// Belirli bir turnuvaya katılır
export async function joinTournament(tournamentId: string) {
  const response = await apiClient.post(`/tournaments/${tournamentId}/join`);
  return response.data;
}

// Belirli bir turnuvanın tüm detaylarını getirir
export async function getTournamentDetails(tournamentId: string) {
  const response = await apiClient.get(`/tournaments/${tournamentId}`);
  return response.data;
}

// Belirli bir turnuvadan ayrılır
export async function leaveTournament(tournamentId: string) {
  const response = await apiClient.delete(`/tournaments/${tournamentId}/leave`);
  return response.data;
}

// Bir turnuvada hazır olduğunu belirtir
export async function setReadyTournament(tournamentId: string) {
  const response = await apiClient.post(`/tournaments/${tournamentId}/ready`);
  return response.data;
}