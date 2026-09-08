import client from './client'

// Every /admin/* endpoint (role: admin). Shapes match the admin* services in
// backend/src/services.

// --- console landing aggregate ---
export function getAdminOverview() {
  return client.get('/admin/overview').then((res) => res.data.overview)
}

// --- coach onboarding queue ---
export function listCoachApplications(status) {
  const query = status ? `?status=${encodeURIComponent(status)}` : ''
  return client.get(`/admin/coach-applications${query}`).then((res) => res.data.applications)
}
export function getCoachApplication(id) {
  return client.get(`/admin/coach-applications/${id}`).then((res) => res.data.application)
}
export function approveCoachApplication(id) {
  return client.post(`/admin/coach-applications/${id}/approve`).then((res) => res.data)
}
export function declineCoachApplication(id, note) {
  return client.post(`/admin/coach-applications/${id}/decline`, { note }).then((res) => res.data.application)
}

// --- drill catalogue ---
export function listAdminDrills() {
  return client.get('/admin/drills').then((res) => res.data.drills)
}
export function createDrill(payload) {
  return client.post('/admin/drills', payload).then((res) => res.data.drill)
}
export function updateDrill(id, patch) {
  return client.patch(`/admin/drills/${id}`, patch).then((res) => res.data.drill)
}
export function setDrillRetired(id, retired) {
  const action = retired ? 'retire' : 'reinstate'
  return client.post(`/admin/drills/${id}/${action}`).then((res) => res.data.drill)
}

// --- competition engine ---
export function createCompetition(payload) {
  return client.post('/admin/competitions', payload).then((res) => res.data.competition)
}
export function updateCompetition(id, patch) {
  return client.patch(`/admin/competitions/${id}`, patch).then((res) => res.data.competition)
}
export function deleteCompetition(id) {
  return client.delete(`/admin/competitions/${id}`).then((res) => res.data)
}
export function recordMatch(competitionId, payload) {
  return client.post(`/admin/competitions/${competitionId}/matches`, payload).then((res) => res.data.match)
}
export function updateMatch(matchId, patch) {
  return client.patch(`/admin/matches/${matchId}`, patch).then((res) => res.data.match)
}
export function deleteMatch(matchId) {
  return client.delete(`/admin/matches/${matchId}`).then(() => undefined)
}

// --- club allocation ---
export function listAdminClubs() {
  return client.get('/admin/clubs').then((res) => res.data.clubs)
}
export function provisionClub(payload) {
  return client.post('/admin/clubs', payload).then((res) => res.data.club)
}
export function archiveClub(id) {
  return client.post(`/admin/clubs/${id}/archive`).then((res) => res.data.club)
}
export function restoreClub(id) {
  return client.post(`/admin/clubs/${id}/restore`).then((res) => res.data.club)
}
