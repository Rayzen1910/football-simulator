const matches = [];  
let currentRoundTeamsCount = 16;  
let roundIndex = 0;  
let matchCount = 0;  
while (currentRoundTeamsCount > 1) {  
  const matchesInRound = Math.floor(currentRoundTeamsCount / 2);  
  for (let i = 0; i < matchesInRound; i++) {  
    const matchId = matchCount + i;  
    let teamA = 'TBD';  
    let teamB = 'TBD';  
    if (roundIndex === 0) {  
      teamA = 'Team ' + (i * 2);  
      teamB = 'Team ' + (i * 2 + 1);  
    }  
    matches.push({ id: 'K-'+roundIndex+'-'+i+'-1', roundIndex, matchIndex: i, teamA, teamB, scoreA: '', scoreB: '', penA: '', penB: '', legInfo: 'Leg 1' });  
    matches.push({ id: 'K-'+roundIndex+'-'+i+'-2', roundIndex, matchIndex: i, teamA: teamB, teamB: teamA, scoreA: '', scoreB: '', penA: '', penB: '', legInfo: 'Leg 2' });  
  }  
  matchCount += matchesInRound;  
  currentRoundTeamsCount = Math.ceil(currentRoundTeamsCount / 2);  
  roundIndex++;  
}  
const maxRound = Math.max(...matches.map(m => m.roundIndex || 0));  
for (let r = 0; r <= maxRound; r++) {  
  let leg1s = matches.filter(m => m.roundIndex === r && m.legInfo === 'Leg 1');  
  let leg2s = matches.filter(m => m.roundIndex === r && m.legInfo === 'Leg 2');  
  leg1s.forEach(l1 => {  
    const l2 = leg2s.find(m => m.matchIndex === l1.matchIndex);  
    if (l1.teamA === 'TBD' || l1.teamB === 'TBD' || l1.teamB === 'BYE') return;  
    l1.scoreA = '2'; l1.scoreB = '1';  
    l2.scoreA = '1'; l2.scoreB = '2';  
    const nextR = r + 1;  
    const nextM = Math.floor(l1.matchIndex / 2);  
    const nextMatch1 = matches.find(m => m.roundIndex === nextR && m.matchIndex === nextM && m.legInfo === 'Leg 1');  
    const nextMatch2 = matches.find(m => m.roundIndex === nextR && m.matchIndex === nextM && m.legInfo === 'Leg 2');  
    if (nextMatch1 && nextMatch2) {  
      if (l1.matchIndex %% 2 === 0) {  
        nextMatch1.teamA = l1.teamA;  
        nextMatch2.teamB = l1.teamA;  
      } else {  
        nextMatch1.teamB = l1.teamA;  
        nextMatch2.teamA = l1.teamA;  
      }  
    }  
  });  
}  
console.log(matches.filter(m => m.roundIndex === 1).map(m => m.teamA + ' vs ' + m.teamB));  
