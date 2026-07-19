const fs = require('fs');

let content = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Update generateMatches to include penA and penB
const oldGenerateMatches = `          matches.push({ id: \`K-\${roundIndex}-\${i}-1\`, roundIndex, matchIndex: i, teamA, teamB, scoreA: '', scoreB: '', goalsA: [], goalsB: [], isPlayed: false, legInfo: 'Leg 1' });
          matches.push({ id: \`K-\${roundIndex}-\${i}-2\`, roundIndex, matchIndex: i, teamA: teamB, teamB: teamA, scoreA: '', scoreB: '', goalsA: [], goalsB: [], isPlayed: false, legInfo: 'Leg 2' });`;

const newGenerateMatches = `          matches.push({ id: \`K-\${roundIndex}-\${i}-1\`, roundIndex, matchIndex: i, teamA, teamB, scoreA: '', scoreB: '', penA: '', penB: '', goalsA: [], goalsB: [], isPlayed: false, legInfo: 'Leg 1' });
          matches.push({ id: \`K-\${roundIndex}-\${i}-2\`, roundIndex, matchIndex: i, teamA: teamB, teamB: teamA, scoreA: '', scoreB: '', penA: '', penB: '', goalsA: [], goalsB: [], isPlayed: false, legInfo: 'Leg 2' });`;

content = content.replace(oldGenerateMatches, newGenerateMatches);

// 2. Add updatePenalty function
const updatePenaltyFunc = `
  const updatePenalty = (matchId, newPenA, newPenB) => {
    const updatedTournaments = customTournaments.map(t => {
      if (t.id === activeTournament.id) {
        let updatedMatches = t.matches.map(m => {
          if (m.id === matchId) {
            return { ...m, penA: newPenA, penB: newPenB };
          }
          return m;
        });
        
        if (t.type === 'knockout') {
          const matchParts = matchId.split('-');
          if (matchParts.length === 4 && matchParts[0] === 'K') {
            const roundIndex = parseInt(matchParts[1]);
            const mIndex = parseInt(matchParts[2]);
            
            const leg1 = updatedMatches.find(m => m.id === \`K-\${roundIndex}-\${mIndex}-1\`);
            const leg2 = updatedMatches.find(m => m.id === \`K-\${roundIndex}-\${mIndex}-2\`);
            
            if (leg1 && leg2 && leg1.isPlayed && leg2.isPlayed) {
              const aggA = (parseInt(leg1.scoreA)||0) + (parseInt(leg2.scoreB)||0);
              const aggB = (parseInt(leg1.scoreB)||0) + (parseInt(leg2.scoreA)||0);
              
              if (aggA === aggB) {
                const pA = parseInt(leg2.penA);
                const pB = parseInt(leg2.penB);
                let winner = 'TBD';
                if (!isNaN(pA) && !isNaN(pB) && pA !== pB) {
                  if (pA > pB) winner = leg2.teamA;
                  else winner = leg2.teamB;
                }
                
                const nextRoundIndex = roundIndex + 1;
                const nextMIndex = Math.floor(mIndex / 2);
                updatedMatches = updatedMatches.map(m => {
                  if (m.roundIndex === nextRoundIndex && m.matchIndex === nextMIndex) {
                     if (mIndex % 2 === 0) {
                       if (m.legInfo === 'Leg 1') return { ...m, teamA: winner };
                       if (m.legInfo === 'Leg 2') return { ...m, teamB: winner };
                     } else {
                       if (m.legInfo === 'Leg 1') return { ...m, teamB: winner };
                       if (m.legInfo === 'Leg 2') return { ...m, teamA: winner };
                     }
                  }
                  return m;
                });
              }
            }
          }
        }
        return { ...t, matches: updatedMatches };
      }
      return t;
    });
    setCustomTournaments(updatedTournaments);
    setActiveTournament(updatedTournaments.find(t => t.id === activeTournament.id));
  };
`;

const updateScoreMarker = `  const updateScore = (matchId, newScoreA, newScoreB) => {`;
content = content.replace(updateScoreMarker, updatePenaltyFunc + '\n' + updateScoreMarker);

// 3. Update updateScore logic to check for penalty
const oldWinnerLogic = `              let winner = 'TBD';
              if (aggA > aggB) winner = leg1.teamA;
              else if (aggB > aggA) winner = leg1.teamB;
              else winner = \`\${leg1.teamA} (Win Pen)\`; // Simplified tiebreaker
              
              const nextRoundIndex = roundIndex + 1;
              const nextMIndex = Math.floor(mIndex / 2);
              
              updatedMatches = updatedMatches.map(m => {
                if (m.roundIndex === nextRoundIndex && m.matchIndex === nextMIndex) {
                   if (mIndex % 2 === 0) {
                     if (m.legInfo === 'Leg 1') return { ...m, teamA: winner };
                     if (m.legInfo === 'Leg 2') return { ...m, teamB: winner };
                   } else {
                     if (m.legInfo === 'Leg 1') return { ...m, teamB: winner };
                     if (m.legInfo === 'Leg 2') return { ...m, teamA: winner };
                   }
                }
                return m;
              });`;

const newWinnerLogic = `              let winner = 'TBD';
              if (aggA > aggB) winner = leg1.teamA;
              else if (aggB > aggA) winner = leg1.teamB;
              else {
                const pA = parseInt(leg2.penA);
                const pB = parseInt(leg2.penB);
                if (!isNaN(pA) && !isNaN(pB) && pA !== pB) {
                  if (pA > pB) winner = leg2.teamA;
                  else winner = leg2.teamB;
                }
              }
              
              const nextRoundIndex = roundIndex + 1;
              const nextMIndex = Math.floor(mIndex / 2);
              
              updatedMatches = updatedMatches.map(m => {
                if (m.roundIndex === nextRoundIndex && m.matchIndex === nextMIndex) {
                   if (mIndex % 2 === 0) {
                     if (m.legInfo === 'Leg 1') return { ...m, teamA: winner };
                     if (m.legInfo === 'Leg 2') return { ...m, teamB: winner };
                   } else {
                     if (m.legInfo === 'Leg 1') return { ...m, teamB: winner };
                     if (m.legInfo === 'Leg 2') return { ...m, teamA: winner };
                   }
                }
                return m;
              });`;

content = content.replace(oldWinnerLogic, newWinnerLogic);

// 4. Update the UI to render penalty inputs if needed
const oldMatchUI = `                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '1rem' }}>
                        <div style={{ flex: 1, textAlign: 'right', fontWeight: 'bold', fontSize: '1.2rem' }}>{match.teamA}</div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0 1.5rem' }}>
                          <input 
                            type="number" min="0" placeholder="-" 
                            value={match.scoreA}
                            onChange={(e) => updateScore(match.id, e.target.value, match.scoreB)}
                            style={{
                              width: '50px', height: '50px', textAlign: 'center', fontSize: '1.5rem', fontWeight: 'bold',
                              background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid var(--primary)', borderRadius: '8px', outline: 'none'
                            }} 
                          />
                          <span style={{ color: 'var(--text-muted)', fontWeight: 'bold' }}>VS</span>
                          <input 
                            type="number" min="0" placeholder="-" 
                            value={match.scoreB}
                            onChange={(e) => updateScore(match.id, match.scoreA, e.target.value)}
                            style={{
                              width: '50px', height: '50px', textAlign: 'center', fontSize: '1.5rem', fontWeight: 'bold',
                              background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid var(--primary)', borderRadius: '8px', outline: 'none'
                            }} 
                          />
                        </div>
                        
                        <div style={{ flex: 1, textAlign: 'left', fontWeight: 'bold', fontSize: '1.2rem' }}>{match.teamB}</div>
                      </div>`;

const newMatchUI = `                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '1rem' }}>
                        <div style={{ flex: 1, textAlign: 'right', fontWeight: 'bold', fontSize: '1.2rem' }}>{match.teamA}</div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', margin: '0 1.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <input 
                              type="number" min="0" placeholder="-" 
                              value={match.scoreA}
                              onChange={(e) => updateScore(match.id, e.target.value, match.scoreB)}
                              style={{
                                width: '50px', height: '50px', textAlign: 'center', fontSize: '1.5rem', fontWeight: 'bold',
                                background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid var(--primary)', borderRadius: '8px', outline: 'none'
                              }} 
                            />
                            <span style={{ color: 'var(--text-muted)', fontWeight: 'bold' }}>VS</span>
                            <input 
                              type="number" min="0" placeholder="-" 
                              value={match.scoreB}
                              onChange={(e) => updateScore(match.id, match.scoreA, e.target.value)}
                              style={{
                                width: '50px', height: '50px', textAlign: 'center', fontSize: '1.5rem', fontWeight: 'bold',
                                background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid var(--primary)', borderRadius: '8px', outline: 'none'
                              }} 
                            />
                          </div>
                          
                          {/* Render Penalty UI if it's Leg 2 and Aggregate is tied */}
                          {(() => {
                            if (activeTournament.type === 'knockout' && match.legInfo === 'Leg 2') {
                              const matchParts = match.id.split('-');
                              const rIdx = parseInt(matchParts[1]);
                              const mIdx = parseInt(matchParts[2]);
                              const leg1 = activeTournament.matches.find(m => m.id === \`K-\${rIdx}-\${mIdx}-1\`);
                              if (leg1 && leg1.isPlayed && match.isPlayed) {
                                const aggA = (parseInt(leg1.scoreA)||0) + (parseInt(match.scoreB)||0);
                                const aggB = (parseInt(leg1.scoreB)||0) + (parseInt(match.scoreA)||0);
                                if (aggA === aggB) {
                                  return (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '8px', border: '1px dashed #ef4444' }}>
                                      <span style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 'bold' }}>PEN:</span>
                                      <input 
                                        type="number" min="0" placeholder="-" 
                                        value={match.penA || ''}
                                        onChange={(e) => updatePenalty(match.id, e.target.value, match.penB)}
                                        style={{
                                          width: '35px', height: '35px', textAlign: 'center', fontSize: '1rem', fontWeight: 'bold',
                                          background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid #ef4444', borderRadius: '6px', outline: 'none'
                                        }} 
                                      />
                                      <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '0.8rem' }}>-</span>
                                      <input 
                                        type="number" min="0" placeholder="-" 
                                        value={match.penB || ''}
                                        onChange={(e) => updatePenalty(match.id, match.penA, e.target.value)}
                                        style={{
                                          width: '35px', height: '35px', textAlign: 'center', fontSize: '1rem', fontWeight: 'bold',
                                          background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid #ef4444', borderRadius: '6px', outline: 'none'
                                        }} 
                                      />
                                    </div>
                                  );
                                }
                              }
                            }
                            return null;
                          })()}
                        </div>
                        
                        <div style={{ flex: 1, textAlign: 'left', fontWeight: 'bold', fontSize: '1.2rem' }}>{match.teamB}</div>
                      </div>`;

content = content.replace(oldMatchUI, newMatchUI);

fs.writeFileSync('src/App.jsx', content, 'utf8');
console.log('Penalty logic added successfully!');
