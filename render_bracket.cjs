const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

const regex = /<div style=\{\{ display: 'flex', gap: '3rem', position: 'relative', minWidth: 'max-content', padding: '1rem' \}\}>[\s\S]*?<\/div>\s*<\/div>\s*\)\s*\}\s*<\/div>\s*<\/div>\s*<\/div>/;

const replacement = `
                  <div style={{ display: 'flex', gap: '3rem', position: 'relative', minWidth: 'max-content', padding: '1rem', justifyContent: 'center' }}>
                    
                    {/* Left Bracket */}
                    <div style={{ display: 'flex', gap: '3rem' }}>
                      {Array.from({ length: Math.max(0, Math.ceil(Math.log2(activeTournament.teams.length)) - 1) }).map((_, rIndex) => {
                        const roundMatches = activeTournament.matches.filter(m => m.roundIndex === rIndex && m.legInfo === 'Leg 1');
                        const subset = roundMatches.slice(0, roundMatches.length / 2);
                        return (
                          <div key={'L'+rIndex} style={{ display: 'flex', flexDirection: 'column', gap: '2rem', justifyContent: 'space-around', position: 'relative' }}>
                            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem', fontWeight: 'bold', letterSpacing: '1px' }}>
                              BABAK {rIndex + 1}
                            </div>
                            {subset.map((match, mIdx) => {
                              const leg2 = activeTournament.matches.find(m => m.roundIndex === rIndex && m.matchIndex === match.matchIndex && m.legInfo === 'Leg 2');
                              let aggA = null; let aggB = null; let penTextA = ''; let penTextB = '';
                              if (match.isPlayed && leg2 && leg2.isPlayed) {
                                 aggA = (parseInt(match.scoreA)||0) + (parseInt(leg2.scoreB)||0);
                                 aggB = (parseInt(match.scoreB)||0) + (parseInt(leg2.scoreA)||0);
                                 const pA = parseInt(leg2.penA); const pB = parseInt(leg2.penB);
                                 if (!isNaN(pA) && !isNaN(pB)) {
                                    penTextA = pB > pA ? \`(P:\${pB})\` : \`(\${pB})\`;
                                    penTextB = pA > pB ? \`(P:\${pA})\` : \`(\${pA})\`;
                                 }
                              }
                              return (
                                <div key={mIdx} style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-color)', width: '220px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', position: 'relative' }}>
                                  <div style={{ position: 'absolute', right: '-1.5rem', top: '50%', width: '1.5rem', height: '2px', background: 'var(--border-color)' }}></div>
                                  {rIndex > 0 && (
                                    <>
                                      <div style={{ position: 'absolute', left: '-1.5rem', top: '50%', width: '1.5rem', height: '2px', background: 'var(--border-color)' }}></div>
                                      {mIdx % 2 === 0 ? <div style={{ position: 'absolute', left: '-1.5rem', top: '50%', bottom: '-100%', width: '2px', background: 'var(--border-color)', marginBottom: '-1rem' }}></div> : null}
                                    </>
                                  )}
                                  <div style={{ padding: '0.6rem 0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <span style={{ fontWeight: 'bold', fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{match.teamA} {penTextA && <span style={{fontSize: '0.75rem', color: '#ef4444', marginLeft: '4px'}}>{penTextA}</span>}</span>
                                    {aggA !== null && <div style={{ background: 'var(--primary)', color: 'var(--bg-dark)', fontWeight: 'bold', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.9rem' }}>{aggA}</div>}
                                  </div>
                                  <div style={{ padding: '0.6rem 0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px' }}>
                                    <span style={{ fontWeight: 'bold', fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{match.teamB} {penTextB && <span style={{fontSize: '0.75rem', color: '#ef4444', marginLeft: '4px'}}>{penTextB}</span>}</span>
                                    {aggB !== null && <div style={{ background: 'var(--primary)', color: 'var(--bg-dark)', fontWeight: 'bold', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.9rem' }}>{aggB}</div>}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )
                      })}
                    </div>

                    {/* Final */}
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {(() => {
                        const rIndex = Math.ceil(Math.log2(activeTournament.teams.length)) - 1;
                        if (rIndex < 0) return null;
                        const match = activeTournament.matches.find(m => m.roundIndex === rIndex && m.legInfo === 'Leg 1');
                        if (!match) return null;
                        const leg2 = activeTournament.matches.find(m => m.roundIndex === rIndex && m.legInfo === 'Leg 2');
                        let aggA = null; let aggB = null; let penTextA = ''; let penTextB = '';
                        if (match.isPlayed && leg2 && leg2.isPlayed) {
                           aggA = (parseInt(match.scoreA)||0) + (parseInt(leg2.scoreB)||0);
                           aggB = (parseInt(match.scoreB)||0) + (parseInt(leg2.scoreA)||0);
                           const pA = parseInt(leg2.penA); const pB = parseInt(leg2.penB);
                           if (!isNaN(pA) && !isNaN(pB)) {
                              penTextA = pB > pA ? \`(P:\${pB})\` : \`(\${pB})\`;
                              penTextB = pA > pB ? \`(P:\${pA})\` : \`(\${pA})\`;
                           }
                        }
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', justifyContent: 'center', position: 'relative', margin: '0 1.5rem' }}>
                            <div style={{ textAlign: 'center', color: 'var(--primary)', fontSize: '1.2rem', marginBottom: '1rem', fontWeight: 'bold', letterSpacing: '2px', textShadow: '0 0 10px rgba(16, 185, 129, 0.5)' }}>
                              FINAL
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', border: '2px solid var(--primary)', width: '260px', boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)', position: 'relative', transform: 'scale(1.1)' }}>
                              <div style={{ position: 'absolute', left: '-3rem', top: '50%', width: '3rem', height: '2px', background: 'var(--border-color)' }}></div>
                              <div style={{ position: 'absolute', right: '-3rem', top: '50%', width: '3rem', height: '2px', background: 'var(--border-color)' }}></div>
                              <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                <span style={{ fontWeight: 'bold', fontSize: '1.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{match.teamA} {penTextA && <span style={{fontSize: '0.8rem', color: '#ef4444', marginLeft: '4px'}}>{penTextA}</span>}</span>
                                {aggA !== null && <div style={{ background: 'var(--primary)', color: 'var(--bg-dark)', fontWeight: 'bold', padding: '0.3rem 0.8rem', borderRadius: '6px', fontSize: '1rem' }}>{aggA}</div>}
                              </div>
                              <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', borderBottomLeftRadius: '10px', borderBottomRightRadius: '10px' }}>
                                <span style={{ fontWeight: 'bold', fontSize: '1.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{match.teamB} {penTextB && <span style={{fontSize: '0.8rem', color: '#ef4444', marginLeft: '4px'}}>{penTextB}</span>}</span>
                                {aggB !== null && <div style={{ background: 'var(--primary)', color: 'var(--bg-dark)', fontWeight: 'bold', padding: '0.3rem 0.8rem', borderRadius: '6px', fontSize: '1rem' }}>{aggB}</div>}
                              </div>
                            </div>
                          </div>
                        )
                      })()}
                    </div>

                    {/* Right Bracket */}
                    <div style={{ display: 'flex', gap: '3rem', flexDirection: 'row-reverse' }}>
                      {Array.from({ length: Math.max(0, Math.ceil(Math.log2(activeTournament.teams.length)) - 1) }).map((_, rIndex) => {
                        const roundMatches = activeTournament.matches.filter(m => m.roundIndex === rIndex && m.legInfo === 'Leg 1');
                        const subset = roundMatches.slice(roundMatches.length / 2);
                        return (
                          <div key={'R'+rIndex} style={{ display: 'flex', flexDirection: 'column', gap: '2rem', justifyContent: 'space-around', position: 'relative' }}>
                            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem', fontWeight: 'bold', letterSpacing: '1px' }}>
                              BABAK {rIndex + 1}
                            </div>
                            {subset.map((match, mIdx) => {
                              const leg2 = activeTournament.matches.find(m => m.roundIndex === rIndex && m.matchIndex === match.matchIndex && m.legInfo === 'Leg 2');
                              let aggA = null; let aggB = null; let penTextA = ''; let penTextB = '';
                              if (match.isPlayed && leg2 && leg2.isPlayed) {
                                 aggA = (parseInt(match.scoreA)||0) + (parseInt(leg2.scoreB)||0);
                                 aggB = (parseInt(match.scoreB)||0) + (parseInt(leg2.scoreA)||0);
                                 const pA = parseInt(leg2.penA); const pB = parseInt(leg2.penB);
                                 if (!isNaN(pA) && !isNaN(pB)) {
                                    penTextA = pB > pA ? \`(P:\${pB})\` : \`(\${pB})\`;
                                    penTextB = pA > pB ? \`(P:\${pA})\` : \`(\${pA})\`;
                                 }
                              }
                              return (
                                <div key={mIdx} style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-color)', width: '220px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', position: 'relative' }}>
                                  <div style={{ position: 'absolute', left: '-1.5rem', top: '50%', width: '1.5rem', height: '2px', background: 'var(--border-color)' }}></div>
                                  {rIndex > 0 && (
                                    <>
                                      <div style={{ position: 'absolute', right: '-1.5rem', top: '50%', width: '1.5rem', height: '2px', background: 'var(--border-color)' }}></div>
                                      {mIdx % 2 === 0 ? <div style={{ position: 'absolute', right: '-1.5rem', top: '50%', bottom: '-100%', width: '2px', background: 'var(--border-color)', marginBottom: '-1rem' }}></div> : null}
                                    </>
                                  )}
                                  <div style={{ padding: '0.6rem 0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <span style={{ fontWeight: 'bold', fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{match.teamA} {penTextA && <span style={{fontSize: '0.75rem', color: '#ef4444', marginLeft: '4px'}}>{penTextA}</span>}</span>
                                    {aggA !== null && <div style={{ background: 'var(--primary)', color: 'var(--bg-dark)', fontWeight: 'bold', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.9rem' }}>{aggA}</div>}
                                  </div>
                                  <div style={{ padding: '0.6rem 0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px' }}>
                                    <span style={{ fontWeight: 'bold', fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{match.teamB} {penTextB && <span style={{fontSize: '0.75rem', color: '#ef4444', marginLeft: '4px'}}>{penTextB}</span>}</span>
                                    {aggB !== null && <div style={{ background: 'var(--primary)', color: 'var(--bg-dark)', fontWeight: 'bold', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.9rem' }}>{aggB}</div>}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
`;

if (regex.test(code)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/App.jsx', code, 'utf8');
  console.log('Bracket rendered symmetrically.');
} else {
  console.log('Could not find regex match');
}
