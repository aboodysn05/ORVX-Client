import client from './client'

export function listClubs() {
  return client.get('/clubs').then((res) => res.data.clubs)
}
