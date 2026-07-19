const fs = require('fs');

let content = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Replace generateMatches
const oldGenerateMatches = `      // Kandang-Tandang (Home & Away) Knockout pairs (first round)
      for (let i = 0; i < teams.length; i += 2) {
        if (i + 1 < teams.length) {
          matches.push({ id: \`K-1-\${i}\`, teamA: teams[i], teamB: teams[i+1], scoreA: '', scoreB: '', goalsA: [], goalsB: [], isPlayed: false, legInfo: 'Leg 1' });
          matches.push({ id: \`K-2-\${i}\`, teamA: teams[i+1], teamB: teams[i], scoreA: '', scoreB: '', goalsA: [], goalsB: [], isPlayed: false, legInfo: 'Leg 2' });
        }
      }`;

const newGenerateMatches = `      // Knockout with all rounds
      let currentRoundTeamsCount = teams.length;
      let roundIndex = 0;
      let matchCount = 0;
      
      while (currentRoundTeamsCount > 1) {
        const matchesInRound = Math.floor(currentRoundTeamsCount / 2);
        for (let i = 0; i < matchesInRound; i++) {
          const matchId = matchCount + i;
          let teamA = 'TBD';
          let teamB = 'TBD';
          if (roundIndex === 0) {
            teamA = teams[i * 2];
            teamB = teams[i * 2 + 1] || 'BYE';
          }
          matches.push({ id: \`K-\${roundIndex}-\${i}-1\`, roundIndex, matchIndex: i, teamA, teamB, scoreA: '', scoreB: '', goalsA: [], goalsB: [], isPlayed: false, legInfo: 'Leg 1' });
          matches.push({ id: \`K-\${roundIndex}-\${i}-2\`, roundIndex, matchIndex: i, teamA: teamB, teamB: teamA, scoreA: '', scoreB: '', goalsA: [], goalsB: [], isPlayed: false, legInfo: 'Leg 2' });
        }
        matchCount += matchesInRound;
        currentRoundTeamsCount = Math.ceil(currentRoundTeamsCount / 2);
        roundIndex++;
      }`;

content = content.replace(oldGenerateMatches, newGenerateMatches);

// 2. Replace updateScore
const oldUpdateScore = `        const updatedMatches = t.matches.map(m => {
          if (m.id === matchId) {
            return { ...m, scoreA: newScoreA, scoreB: newScoreB, isPlayed: isScoreFilled };
          }
          return m;
        });`;

const newUpdateScore = `        let updatedMatches = t.matches.map(m => {
          if (m.id === matchId) {
            return { ...m, scoreA: newScoreA, scoreB: newScoreB, isPlayed: isScoreFilled };
          }
          return m;
        });
        
        // Advance winners for Knockout
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
              
              let winner = 'TBD';
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
              });
            }
          }
        }`;

content = content.replace(oldUpdateScore, newUpdateScore);

// 3. Replace the Knockout Bracket rendering
const oldBracket = `                <div style={{ padding: '1rem', background: 'var(--bg-card)', borderRadius: '12px' }}>
                  <h4 style={{ color: 'var(--primary)', marginBottom: '1.5rem', textAlign: 'center', letterSpacing: '1px' }}>MATCHUPS BABAK AWAL</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
                    {/* Garis vertikal penghubung bracket di sebelah kanan */}
                    <div style={{ position: 'absolute', right: '15px', top: '30px', bottom: '30px', width: '2px', background: 'var(--border-color)', zIndex: 0 }}></div>
                    
                    {Array.from({ length: Math.ceil(activeTournament.teams.length / 2) }).map((_, idx) => {
                      const team1 = activeTournament.teams[idx * 2];
                      const team2 = activeTournament.teams[idx * 2 + 1] || 'BYE (Otomatis Lolos)';
                      return (
                        <div key={idx} style={{ 
                          display: 'flex', flexDirection: 'column', 
                          background: 'rgba(255,255,255,0.03)', 
                          borderRadius: '8px', border: '1px solid var(--border-color)',
                          position: 'relative', zIndex: 1, marginRight: '30px',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                        }}>
                          {/* Garis horizontal konektor ke kanan */}
                          <div style={{ position: 'absolute', right: '-15px', top: '50%', width: '15px', height: '2px', background: 'var(--border-color)' }}></div>
                          
                          <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{team1}</span>
                          </div>
                          <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{team2}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>`;

const newBracket = `                <div style={{ padding: '1rem', background: 'var(--bg-card)', borderRadius: '12px', overflowX: 'auto' }}>
                  <h4 style={{ color: 'var(--primary)', marginBottom: '1.5rem', textAlign: 'center', letterSpacing: '1px' }}>BRACKET TURNAMEN</h4>
                  <div style={{ display: 'flex', gap: '3rem', position: 'relative', minWidth: 'max-content', padding: '1rem' }}>
                    {Array.from({ length: Math.ceil(Math.log2(activeTournament.teams.length)) }).map((_, rIndex) => {
                      const roundMatches = activeTournament.matches.filter(m => m.roundIndex === rIndex && m.legInfo === 'Leg 1');
                      const totalRounds = Math.ceil(Math.log2(activeTournament.teams.length));
                      const isLastRound = rIndex === totalRounds - 1;
                      
                      return (
                        <div key={rIndex} style={{ display: 'flex', flexDirection: 'column', gap: '2rem', justifyContent: 'center', position: 'relative' }}>
                          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem', fontWeight: 'bold', letterSpacing: '1px' }}>
                            {isLastRound ? 'FINAL' : \`BABAK \${rIndex + 1}\`}
                          </div>
                          {roundMatches.map((match, mIdx) => (
                            <div key={mIdx} style={{ 
                              display: 'flex', flexDirection: 'column', 
                              background: 'rgba(255,255,255,0.03)', 
                              borderRadius: '8px', border: '1px solid var(--border-color)',
                              width: '220px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                              position: 'relative'
                            }}>
                              {!isLastRound && (
                                <>
                                  {/* Connector to the right */}
                                  <div style={{ position: 'absolute', right: '-1.5rem', top: '50%', width: '1.5rem', height: '2px', background: 'var(--border-color)' }}></div>
                                </>
                              )}
                              {rIndex > 0 && (
                                <>
                                  {/* Connector to the left */}
                                  <div style={{ position: 'absolute', left: '-1.5rem', top: '50%', width: '1.5rem', height: '2px', background: 'var(--border-color)' }}></div>
                                  {/* Vertical line connecting previous matches */}
                                  {mIdx % 2 === 0 && !isLastRound ? 
                                    <div style={{ position: 'absolute', left: '-1.5rem', top: '50%', bottom: '-100%', width: '2px', background: 'var(--border-color)' }}></div> 
                                    : null
                                  }
                                </>
                              )}
                              
                              <div style={{ padding: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <span style={{ fontWeight: 'bold', fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{match.teamA}</span>
                              </div>
                              <div style={{ padding: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
                                <span style={{ fontWeight: 'bold', fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{match.teamB}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                </div>`;

content = content.replace(oldBracket, newBracket);

// 4. Update the fallback logic for customTournaments (clear it if it's the old knockout format)
// We will just clear all localstorage to avoid crashes since it's a test env, or just let users create a new tournament.
// Actually, let's just make sure activeTournament logic in updateScore doesn't crash on old ones. It won't because the IDs won't match `K-r-m-l`.

fs.writeFileSync('src/App.jsx', content, 'utf8');
console.log('App.jsx updated successfully!');
