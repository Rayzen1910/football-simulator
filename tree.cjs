const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

const regex = /<div style=\{\{ display: 'flex', gap: '3rem', position: 'relative', minWidth: 'max-content', padding: '1rem', justifyContent: 'center' \}\}>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*\)\s*\}\s*<\/div>\s*<\/div>\s*<\/div>/;

const treeCode = `
                  <div style={{ display: 'flex', gap: '4rem', position: 'relative', minWidth: 'max-content', padding: '2rem', justifyContent: 'center', alignItems: 'center' }}>
                    
                    {/* Bracket Node Component */}
                    {(() => {
                      const MatchNode = ({ match, allMatches, direction, isFinal }) => {
                        const leg2 = allMatches.find(m => m.roundIndex === match.roundIndex && m.matchIndex === match.matchIndex && m.legInfo === 'Leg 2');
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

                        // Find children matches from previous round
                        let children = [];
                        if (match.roundIndex > 0 && !isFinal) {
                          children = allMatches.filter(m => m.roundIndex === match.roundIndex - 1 && Math.floor(m.matchIndex / 2) === match.matchIndex && m.legInfo === 'Leg 1');
                        } else if (isFinal) {
                          // Final takes two semifinals
                          children = allMatches.filter(m => m.roundIndex === match.roundIndex - 1 && m.legInfo === 'Leg 1');
                        }

                        const cardWidth = isFinal ? '280px' : '220px';
                        
                        const renderCard = () => (
                          <div style={{ display: 'flex', flexDirection: 'column', background: isFinal ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.03)', borderRadius: '8px', border: isFinal ? '2px solid var(--primary)' : '1px solid var(--border-color)', width: cardWidth, boxShadow: isFinal ? '0 0 20px rgba(16, 185, 129, 0.3)' : '0 4px 6px rgba(0,0,0,0.3)', position: 'relative', zIndex: 2 }}>
                            {isFinal && <div style={{ textAlign: 'center', color: 'var(--primary)', fontSize: '1rem', padding: '0.5rem', fontWeight: 'bold', letterSpacing: '2px', borderBottom: '1px solid rgba(16, 185, 129, 0.2)' }}>FINAL</div>}
                            <div style={{ padding: '0.6rem 0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: isFinal ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(255,255,255,0.05)' }}>
                              <span style={{ fontWeight: 'bold', fontSize: isFinal ? '1.1rem' : '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{match.teamA} {penTextA && <span style={{fontSize: '0.75rem', color: '#ef4444', marginLeft: '4px'}}>{penTextA}</span>}</span>
                              {aggA !== null && <div style={{ background: 'var(--primary)', color: 'var(--bg-dark)', fontWeight: 'bold', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.9rem' }}>{aggA}</div>}
                            </div>
                            <div style={{ padding: '0.6rem 0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px' }}>
                              <span style={{ fontWeight: 'bold', fontSize: isFinal ? '1.1rem' : '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{match.teamB} {penTextB && <span style={{fontSize: '0.75rem', color: '#ef4444', marginLeft: '4px'}}>{penTextB}</span>}</span>
                              {aggB !== null && <div style={{ background: 'var(--primary)', color: 'var(--bg-dark)', fontWeight: 'bold', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.9rem' }}>{aggB}</div>}
                            </div>
                            
                            {/* Connectors */}
                            {!isFinal && match.roundIndex < Math.ceil(Math.log2(activeTournament.teams.length)) - 1 && (
                              <div style={{ position: 'absolute', [direction === 'left' ? 'right' : 'left']: '-2rem', top: '50%', width: '2rem', height: '2px', background: 'var(--border-color)', zIndex: 1 }}></div>
                            )}
                          </div>
                        );

                        if (children.length === 0) {
                          return <div style={{ position: 'relative', margin: '1rem 0' }}>{renderCard()}</div>;
                        }

                        if (isFinal) {
                           return (
                             <div style={{ display: 'flex', alignItems: 'center', gap: '4rem' }}>
                                <MatchNode match={children[0]} allMatches={allMatches} direction="left" />
                                <div style={{ position: 'relative' }}>
                                   <div style={{ position: 'absolute', left: '-2rem', top: '50%', width: '2rem', height: '2px', background: 'var(--border-color)', zIndex: 1 }}></div>
                                   <div style={{ position: 'absolute', right: '-2rem', top: '50%', width: '2rem', height: '2px', background: 'var(--border-color)', zIndex: 1 }}></div>
                                   {renderCard()}
                                </div>
                                <MatchNode match={children[1]} allMatches={allMatches} direction="right" />
                             </div>
                           );
                        }

                        return (
                          <div style={{ display: 'flex', flexDirection: direction === 'left' ? 'row' : 'row-reverse', alignItems: 'center', gap: '2rem', margin: '1rem 0' }}>
                             <div style={{ display: 'flex', flexDirection: 'column', position: 'relative', gap: '2rem' }}>
                                {/* Vertical Connector Line */}
                                <div style={{ position: 'absolute', [direction === 'left' ? 'right' : 'left']: '-2rem', top: '25%', bottom: '25%', width: '2px', background: 'var(--border-color)', zIndex: 1 }}></div>
                                
                                {children.map((child, idx) => (
                                  <div key={child.id} style={{ position: 'relative' }}>
                                    <div style={{ position: 'absolute', [direction === 'left' ? 'right' : 'left']: '-2rem', top: '50%', width: '2rem', height: '2px', background: 'var(--border-color)', zIndex: 1 }}></div>
                                    <MatchNode match={child} allMatches={allMatches} direction={direction} />
                                  </div>
                                ))}
                             </div>
                             <div style={{ position: 'relative' }}>
                                {renderCard()}
                             </div>
                          </div>
                        );
                      };

                      const totalRounds = Math.ceil(Math.log2(activeTournament.teams.length));
                      if (totalRounds <= 0) return null;
                      const finalMatch = activeTournament.matches.find(m => m.roundIndex === totalRounds - 1 && m.legInfo === 'Leg 1');
                      if (!finalMatch) return null;

                      return <MatchNode match={finalMatch} allMatches={activeTournament.matches} direction="center" isFinal={true} />;
                    })()}

                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
`;

if (regex.test(code)) {
  code = code.replace(regex, treeCode);
  fs.writeFileSync('src/App.jsx', code, 'utf8');
  console.log('Replaced with Tree Bracket');
} else {
  console.log('Regex did not match');
}
