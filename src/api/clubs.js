import client from './client'

// Public club list (now enriched with headCoachName, rosterCount, squadCap,
// isFull, slot, division, archived, leaguePosition — all additive) plus the
// coach roster / player-application endpoints.

export function listClubs() {
  return client.get('/clubs').then((res) => res.data.clubs)
}

export function getRoster(clubId) {
  return client.get(`/clubs/${clubId}/roster`).then((res) => res.data)
}

export function signPlayer(clubId, { playerId, position }) {
  return client
    .post(`/clubs/${clubId}/roster`, { playerId, position })
    .then((res) => res.data.membership)
}

export function updateRosterPosition(clubId, playerId, position) {
  return client
    .patch(`/clubs/${clubId}/roster/${playerId}`, { position })
    .then((res) => res.data.membership)
}

export function releasePlayer(clubId, playerId) {
  return client.delete(`/clubs/${clubId}/roster/${playerId}`).then(() => undefined)
}

export function listClubApplications(clubId) {
  return client.get(`/clubs/${clubId}/applications`).then((res) => res.data.applications)
}

export function applyToClub(clubId, message) {
  return client.post(`/clubs/${clubId}/applications`, { message }).then((res) => res.data.application)
}

export function decideClubApplication(clubId, appId, decision) {
  return client
    .post(`/clubs/${clubId}/applications/${appId}/${decision}`)
    .then((res) => res.data)
}

export function getScoutingPool() {
  return client.get('/players/scouting-pool').then((res) => res.data.players)
}
