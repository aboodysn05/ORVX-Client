import client from './client'

export function listCompetitions() {
  return client.get('/competitions').then((res) => res.data.competitions)
}

export function getStandings(competitionId) {
  return client.get(`/competitions/${competitionId}/standings`).then((res) => res.data.standings)
}

export function getFixtures(competitionId) {
  return client.get(`/competitions/${competitionId}/fixtures`).then((res) => res.data.fixtures)
}

export function getBracket(competitionId) {
  return client.get(`/competitions/${competitionId}/bracket`).then((res) => res.data.rounds)
}
