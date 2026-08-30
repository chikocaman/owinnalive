const ids = {
  premier: 23, laLiga: 15, bundesliga: 10, serieA: 12, ligue1: 9, champions: 2,
  europa: 2310, conference: 2579, worldCup: 4, mls: 19, saudi: 2178, cafChampions: 1979,
};
for (const [name, id] of Object.entries(ids)) {
  const url = `https://a.espncdn.com/i/leaguelogos/soccer/500/${id}.png`;
  const r = await fetch(url, { method: 'HEAD' });
  console.log(`${name}\t${id}\t${r.status}\t${r.headers.get('content-type') || ''}`);
}
