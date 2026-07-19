import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Cpu, Zap, ArrowRight, Activity, Users, Eye, BarChart, Goal, Plus, List, Network, PlusCircle, Trash2, Download, Share2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

function App() {
  const [showModal, setShowModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('footylabs_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });
  
  const [tournamentType, setTournamentType] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  
  const getStorageKey = (currentUser) => {
    return currentUser ? `footylabs_tournaments_${currentUser.email}` : 'footylabs_tournaments';
  };

  const loadData = (currentUser) => {
    try {
      const saved = localStorage.getItem(getStorageKey(currentUser));
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return parsed.map(t => ({
        ...t,
        matches: t.matches.map(m => ({
          ...m,
          goalsA: Array.isArray(m.goalsA) ? m.goalsA : [],
          goalsB: Array.isArray(m.goalsB) ? m.goalsB : []
        }))
      }));
    } catch (e) {
      return [];
    }
  };

  const [customTournaments, setCustomTournaments] = useState(() => loadData(user));
  const [activeTournament, setActiveTournament] = useState(null);

  // Sync state when user logs in or out
  useEffect(() => {
    if (user) {
      localStorage.setItem('footylabs_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('footylabs_user');
    }
    setCustomTournaments(loadData(user));
    setActiveTournament(null); // Tutup turnamen aktif agar tidak bug saat switch akun
  }, [user]);

  useEffect(() => {
    localStorage.setItem(getStorageKey(user), JSON.stringify(customTournaments));
  }, [customTournaments, user]);

  // Form states
  
  const [formName, setFormName] = useState('');
  const [formCount, setFormCount] = useState(8);
  const [formTeams, setFormTeams] = useState('');
  const [formShuffle, setFormShuffle] = useState(false);
  
  const openModal = (type) => {
    setTournamentType(type);
    setFormName('');
    setFormCount(8);
    setFormTeams('');
    setFormShuffle(false);
    setShowModal(true);
  };
  
  const closeModal = () => {
    setShowModal(false);
  };

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleLinkClick = (e, message) => {
    e.preventDefault();
    showToast(message);
  };

  const generateMatches = (teams, type) => {
    const matches = [];
    if (type === 'liga') {
      // Kandang-Tandang (Home & Away) Round Robin
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          matches.push({ id: `L-H-${i}-${j}`, teamA: teams[i], teamB: teams[j], scoreA: '', scoreB: '', goalsA: [], goalsB: [], isPlayed: false, legInfo: 'Kandang' });
          matches.push({ id: `L-A-${i}-${j}`, teamA: teams[j], teamB: teams[i], scoreA: '', scoreB: '', goalsA: [], goalsB: [], isPlayed: false, legInfo: 'Tandang' });
        }
      }
    } else {
      // Knockout with all rounds
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
          matches.push({ id: `K-${roundIndex}-${i}-1`, roundIndex, matchIndex: i, teamA, teamB, scoreA: '', scoreB: '', penA: '', penB: '', goalsA: [], goalsB: [], isPlayed: false, legInfo: 'Leg 1' });
          matches.push({ id: `K-${roundIndex}-${i}-2`, roundIndex, matchIndex: i, teamA: teamB, teamB: teamA, scoreA: '', scoreB: '', penA: '', penB: '', goalsA: [], goalsB: [], isPlayed: false, legInfo: 'Leg 2' });
        }
        matchCount += matchesInRound;
        currentRoundTeamsCount = Math.ceil(currentRoundTeamsCount / 2);
        roundIndex++;
      }
    }
    return matches;
  };


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
            
            const leg1 = updatedMatches.find(m => m.id === `K-${roundIndex}-${mIndex}-1`);
            const leg2 = updatedMatches.find(m => m.id === `K-${roundIndex}-${mIndex}-2`);
            
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

  const updateScore = (matchId, newScoreA, newScoreB) => {
    const isScoreFilled = newScoreA !== '' && newScoreB !== '';
    const updatedTournaments = customTournaments.map(t => {
      if (t.id === activeTournament.id) {
        let updatedMatches = t.matches.map(m => {
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
            
            const leg1 = updatedMatches.find(m => m.id === `K-${roundIndex}-${mIndex}-1`);
            const leg2 = updatedMatches.find(m => m.id === `K-${roundIndex}-${mIndex}-2`);
            
            if (leg1 && leg2 && leg1.isPlayed && leg2.isPlayed) {
              const aggA = (parseInt(leg1.scoreA)||0) + (parseInt(leg2.scoreB)||0);
              const aggB = (parseInt(leg1.scoreB)||0) + (parseInt(leg2.scoreA)||0);
              
              let winner = 'TBD';
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
              });
            }
          }
        }
        return { ...t, matches: updatedMatches };
      }
      return t;
    });
    setCustomTournaments(updatedTournaments);
    setActiveTournament(updatedTournaments.find(t => t.id === activeTournament.id));
    // Don't show toast for every keystroke to keep it clean, or show a subtle one.
  };

  const addGoal = (matchId, teamKey) => {
    const updatedTournaments = customTournaments.map(t => {
      if (t.id === activeTournament.id) {
        const updatedMatches = t.matches.map(m => {
          if (m.id === matchId) {
            const newGoal = { id: Date.now() + Math.random(), name: '', time: '', assist: '' };
            return { ...m, [teamKey]: [...m[teamKey], newGoal] };
          }
          return m;
        });
        return { ...t, matches: updatedMatches };
      }
      return t;
    });
    setCustomTournaments(updatedTournaments);
    setActiveTournament(updatedTournaments.find(t => t.id === activeTournament.id));
  };

  const updateGoal = (matchId, teamKey, goalId, field, value) => {
    const updatedTournaments = customTournaments.map(t => {
      if (t.id === activeTournament.id) {
        const updatedMatches = t.matches.map(m => {
          if (m.id === matchId) {
            const updatedGoals = m[teamKey].map(g => g.id === goalId ? { ...g, [field]: value } : g);
            return { ...m, [teamKey]: updatedGoals };
          }
          return m;
        });
        return { ...t, matches: updatedMatches };
      }
      return t;
    });
    setCustomTournaments(updatedTournaments);
    setActiveTournament(updatedTournaments.find(t => t.id === activeTournament.id));
  };

  const removeGoal = (matchId, teamKey, goalId) => {
    const updatedTournaments = customTournaments.map(t => {
      if (t.id === activeTournament.id) {
        const updatedMatches = t.matches.map(m => {
          if (m.id === matchId) {
            const updatedGoals = m[teamKey].filter(g => g.id !== goalId);
            return { ...m, [teamKey]: updatedGoals };
          }
          return m;
        });
        return { ...t, matches: updatedMatches };
      }
      return t;
    });
    setCustomTournaments(updatedTournaments);
    setActiveTournament(updatedTournaments.find(t => t.id === activeTournament.id));
  };
  const deleteTournament = (id) => {
      const updated = customTournaments.filter(t => t.id !== id);
      setCustomTournaments(updated);
      if (activeTournament && activeTournament.id === id) {
        setActiveTournament(null);
      }
      showToast('Turnamen berhasil dihapus');
  };
  const calculateStandings = (teams, matches) => {
    const standings = teams.map(team => ({ name: team, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, GD: 0, Pts: 0 }));
    
    matches.forEach(match => {
      if (match.isPlayed && match.scoreA !== '' && match.scoreB !== '') {
        const scoreA = parseInt(match.scoreA) || 0;
        const scoreB = parseInt(match.scoreB) || 0;
        
        const teamA = standings.find(s => s.name === match.teamA);
        const teamB = standings.find(s => s.name === match.teamB);
        
        if (teamA && teamB) {
          teamA.P += 1;
          teamB.P += 1;
          
          teamA.GF += scoreA;
          teamA.GA += scoreB;
          teamB.GF += scoreB;
          teamB.GA += scoreA;
          
          teamA.GD = teamA.GF - teamA.GA;
          teamB.GD = teamB.GF - teamB.GA;
          
          if (scoreA > scoreB) {
            teamA.W += 1;
            teamB.L += 1;
            teamA.Pts += 3;
          } else if (scoreA < scoreB) {
            teamB.W += 1;
            teamA.L += 1;
            teamB.Pts += 3;
          } else {
            teamA.D += 1;
            teamB.D += 1;
            teamA.Pts += 1;
            teamB.Pts += 1;
          }
        }
      }
    });
    
    // Sort logic: Points > Goal Difference > Goals For > Alphabetical
    standings.sort((a, b) => {
      if (b.Pts !== a.Pts) return b.Pts - a.Pts;
      if (b.GD !== a.GD) return b.GD - a.GD;
      if (b.GF !== a.GF) return b.GF - a.GF;
      return a.name.localeCompare(b.name);
    });
    
    return standings;
  };

  const exportTournamentImage = async () => {
    const element = document.getElementById('tournament-view');
    if (element) {
      showToast('Menyiapkan gambar turnamen...');
      try {
        const canvas = await html2canvas(element, {
          backgroundColor: '#111827', // Menyesuaikan dengan tema gelap
          scale: 2, // Resolusi tinggi (HD)
          useCORS: true
        });
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `Klasemen_${activeTournament.name.replace(/\s+/g, '_')}.png`;
        link.click();
        showToast('Gambar turnamen berhasil diunduh!');
      } catch (error) {
        showToast('Gagal mengunduh gambar.');
      }
    }
  };

  
  const calculateTopScorers = (matches) => {
    const players = {};
    matches.forEach(match => {
      if (match.isPlayed) {
        match.goalsA.forEach(g => {
          const name = g.name.trim();
          if (name) {
            const key = `${name}-${match.teamA}`;
            if (!players[key]) players[key] = { name, team: match.teamA, goals: 0 };
            players[key].goals += 1;
          }
        });
        match.goalsB.forEach(g => {
          const name = g.name.trim();
          if (name) {
            const key = `${name}-${match.teamB}`;
            if (!players[key]) players[key] = { name, team: match.teamB, goals: 0 };
            players[key].goals += 1;
          }
        });
      }
    });
    return Object.values(players)
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 5); // Ambil Top 5
  };

  if (activeTournament) {
    const standings = activeTournament.type === 'liga' ? calculateStandings(activeTournament.teams, activeTournament.matches) : [];
    const topScorers = calculateTopScorers(activeTournament.matches);

    return (
      <GoogleOAuthProvider clientId="108106792583-mpcoqnl1a7kct90nn1n60maa5s6u9nr5.apps.googleusercontent.com">
        <div style={{ padding: '2rem 5%', minHeight: '100vh', background: 'var(--bg-dark)' }}>
        <button className="btn btn-outline" style={{ marginBottom: '2rem' }} onClick={() => setActiveTournament(null)}>
          ← Kembali ke Beranda
        </button>
        <div id="tournament-view" className="glass-panel" style={{ padding: '3rem', background: 'var(--bg-card)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '3rem' }}>
            <div>
              <div className="badge" style={{ marginBottom: '1rem' }}>
                {activeTournament.type === 'liga' ? 'League Format' : 'Knockout Format'}
              </div>
              <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem', color: 'var(--primary)' }}>
                {activeTournament.name}
              </h1>
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                Jumlah Peserta: {activeTournament.count} Tim
              </p>
            </div>
            <button className="btn btn-primary" onClick={exportTournamentImage} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Download size={18} /> Unduh Gambar
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: activeTournament.type === 'liga' ? '1.5fr 2.5fr' : '1fr 2.5fr', gap: '3rem' }}>
            {/* Kiri: Klasemen atau Tim Peserta */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <h3 style={{ margin: 0 }}>
                  {activeTournament.type === 'liga' ? 'Klasemen (Live)' : 'Tim Peserta'}
                </h3>
                
              </div>
              
              {activeTournament.type === 'liga' ? (
                <div id="klasemen-board" style={{ overflowX: 'auto', padding: '1rem', background: 'var(--bg-card)', borderRadius: '12px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--primary)' }}>
                        <th style={{ padding: '0.8rem', borderBottom: '1px solid var(--border-color)' }}>Pos</th>
                        <th style={{ padding: '0.8rem', borderBottom: '1px solid var(--border-color)' }}>Tim</th>
                        <th style={{ padding: '0.8rem', borderBottom: '1px solid var(--border-color)' }}>P</th>
                        <th style={{ padding: '0.8rem', borderBottom: '1px solid var(--border-color)' }}>GD</th>
                        <th style={{ padding: '0.8rem', borderBottom: '1px solid var(--border-color)' }}>Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {standings.map((team, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '0.8rem', fontWeight: 'bold' }}>{idx + 1}</td>
                          <td style={{ padding: '0.8rem', fontWeight: '500' }}>{team.name}</td>
                          <td style={{ padding: '0.8rem', color: 'var(--text-muted)' }}>{team.P}</td>
                          <td style={{ padding: '0.8rem', color: team.GD > 0 ? '#10b981' : (team.GD < 0 ? '#ef4444' : 'var(--text-muted)') }}>{team.GD > 0 ? `+${team.GD}` : team.GD}</td>
                          <td style={{ padding: '0.8rem', fontWeight: 'bold', color: 'var(--primary)' }}>{team.Pts}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: '1rem', background: 'var(--bg-card)', borderRadius: '12px', overflowX: 'auto' }}>
                  <h4 style={{ color: 'var(--primary)', marginBottom: '1.5rem', textAlign: 'center', letterSpacing: '1px' }}>BRACKET TURNAMEN</h4>
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
                              penTextA = pB > pA ? `(P:\${pB})` : `(\${pB})`;
                              penTextB = pA > pB ? `(P:\${pA})` : `(\${pA})`;
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

                        // Adjusting vertical line position properly: from the center of the first child to the center of the last child.
                        // We achieve this perfectly by wrapping children in a flex column, and using pseudo elements or just absolute divs!
                        // For a column of 2 items, the line starts 25% from top and ends 25% from bottom. (assuming equal height children and equal gaps)
                        
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

              {/* TOP SKOR */}
              <div style={{ marginTop: '3rem' }}>
                <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Goal size={20} color="var(--primary)" /> Top Skor
                </h3>
                {topScorers.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {topScorers.map((player, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', borderLeft: idx === 0 ? '4px solid #fbbf24' : '4px solid transparent' }}>
                        <div style={{ fontWeight: '500' }}>
                          <span style={{ color: 'var(--text-muted)', marginRight: '1rem' }}>{idx + 1}</span>
                          {player.name} 
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                            ({player.team})
                          </span>
                        </div>
                        <div style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{player.goals} Gol</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                    Belum ada data pencetak gol. Tambahkan gol di jadwal pertandingan.
                  </div>
                )}
              </div>

            </div>
            
            {/* Kanan: Jadwal */}
            <div>
              <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                Jadwal Pertandingan
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '700px', overflowY: 'auto', paddingRight: '1rem' }}>
                {activeTournament.matches.length > 0 ? (
                  activeTournament.matches.map((match) => (
                    <div key={match.id} style={{
                      padding: '1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '12px',
                      display: 'flex', flexDirection: 'column', alignItems: 'center'
                    }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.8rem', letterSpacing: '1px', background: 'rgba(16, 185, 129, 0.1)', padding: '0.2rem 0.8rem', borderRadius: '10px' }}>
                        {match.legInfo}
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '1rem' }}>
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
                              const leg1 = activeTournament.matches.find(m => m.id === `K-${rIdx}-${mIdx}-1`);
                              if (leg1 && leg1.isPlayed && match.isPlayed) {
                                const aggA = (parseInt(leg1.scoreA)||0) + (parseInt(match.scoreB)||0);
                                const aggB = (parseInt(leg1.scoreB)||0) + (parseInt(match.scoreA)||0);
                                if (aggA === aggB) {
                                  return (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '8px', border: '1px dashed #ef4444' }}>
                                      <span style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 'bold' }}>PEN:</span>
                                      <span style={{ fontSize: '0.7rem', color: 'white', fontWeight: 'bold', marginLeft: '4px', maxWidth: '40px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{match.teamA}</span>
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
                                      <span style={{ fontSize: '0.7rem', color: 'white', fontWeight: 'bold', marginRight: '4px', maxWidth: '40px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{match.teamB}</span>
                                    </div>
                                  );
                                }
                              }
                            }
                            return null;
                          })()}
                        </div>
                        
                        <div style={{ flex: 1, textAlign: 'left', fontWeight: 'bold', fontSize: '1.2rem' }}>{match.teamB}</div>
                      </div>
                      
                      {/* Detailed Goal Inputs */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: '2rem', borderTop: '1px dashed var(--border-color)', paddingTop: '1rem' }}>
                        
                        {/* Team A Goals */}
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Pencetak Gol ({match.teamA})</span>
                            <button onClick={() => addGoal(match.id, 'goalsA')} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}>
                              <PlusCircle size={14} /> Tambah
                            </button>
                          </div>
                          {match.goalsA.map((g) => (
                            <div key={g.id} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                              <input 
                                type="text" placeholder="Nama Pemain" value={g.name} onChange={(e) => updateGoal(match.id, 'goalsA', g.id, 'name', e.target.value)}
                                style={{ flex: 2, padding: '0.4rem', fontSize: '0.85rem', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', outline: 'none' }}
                              />
                              <input 
                                type="number" placeholder="Menit" value={g.time} onChange={(e) => updateGoal(match.id, 'goalsA', g.id, 'time', e.target.value)}
                                style={{ flex: 1, padding: '0.4rem', fontSize: '0.85rem', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', outline: 'none' }}
                              />
<input type="text" placeholder="Assist" value={g.assist || ''} onChange={(e) => updateGoal(match.id, 'goalsA', g.id, 'assist', e.target.value)} style={{ flex: 1.5, padding: '0.4rem', fontSize: '0.85rem', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', outline: 'none' }} />
                              <button onClick={() => removeGoal(match.id, 'goalsA', g.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 4px' }}>
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Team B Goals */}
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Pencetak Gol ({match.teamB})</span>
                            <button onClick={() => addGoal(match.id, 'goalsB')} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}>
                              <PlusCircle size={14} /> Tambah
                            </button>
                          </div>
                          {match.goalsB.map((g) => (
                            <div key={g.id} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                              <input 
                                type="text" placeholder="Nama Pemain" value={g.name} onChange={(e) => updateGoal(match.id, 'goalsB', g.id, 'name', e.target.value)}
                                style={{ flex: 2, padding: '0.4rem', fontSize: '0.85rem', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', outline: 'none' }}
                              />
                              <input 
                                type="number" placeholder="Menit" value={g.time} onChange={(e) => updateGoal(match.id, 'goalsB', g.id, 'time', e.target.value)}
                                style={{ flex: 1, padding: '0.4rem', fontSize: '0.85rem', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', outline: 'none' }}
                              />
<input type="text" placeholder="Assist" value={g.assist || ''} onChange={(e) => updateGoal(match.id, 'goalsB', g.id, 'assist', e.target.value)} style={{ flex: 1.5, padding: '0.4rem', fontSize: '0.85rem', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', outline: 'none' }} />
                              <button onClick={() => removeGoal(match.id, 'goalsB', g.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 4px' }}>
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                        </div>

                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: '12px' }}>
                    Tidak ada jadwal pertandingan. Pastikan Anda mendaftarkan tim yang cukup.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      </GoogleOAuthProvider>
    );
  }

  return (
    <GoogleOAuthProvider clientId="108106792583-mpcoqnl1a7kct90nn1n60maa5s6u9nr5.apps.googleusercontent.com">
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
          background: 'var(--primary)', color: 'white', padding: '1rem 2rem',
          borderRadius: '30px', zIndex: 9999, fontWeight: 'bold',
          boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)', animation: 'fadeInOut 3s forwards'
        }}>
          {toastMessage}
        </div>
      )}

      <style>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translate(-50%, 20px); }
          10% { opacity: 1; transform: translate(-50%, 0); }
          90% { opacity: 1; transform: translate(-50%, 0); }
          100% { opacity: 0; transform: translate(-50%, -20px); }
        }
        
        /* Custom Scrollbar for list */
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.2); 
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb {
          background: var(--primary-glow); 
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: var(--primary); 
        }
      `}</style>

      <nav className="navbar">
        <div className="logo" onClick={() => window.scrollTo(0,0)} style={{cursor: 'pointer'}}>
          <Goal size={24} color="#10b981" />
          Footy<span>Labs</span>
        </div>
        <div className="nav-links">
          <a href="#simulator">Simulator</a>
          <a href="#features">Features</a>
          <a href="#custom-tournament">Buat Turnamen</a>
          <a href="#about" onClick={(e) => handleLinkClick(e, 'Halaman "About" sedang dalam pengembangan')}>About</a>
        </div>
        <div className="nav-actions">
          <button className="btn btn-outline" onClick={() => showToast('Mengarahkan ke halaman Upgrade Pro...')}>Pro Version</button>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', background: 'rgba(255,255,255,0.05)', padding: '0.3rem 0.8rem', borderRadius: '30px' }}>
              <img src={user.photo} alt="Avatar" style={{ width: '30px', height: '30px', borderRadius: '50%' }} />
              <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{user.name}</span>
              <button onClick={() => { setUser(null); showToast('Berhasil Logout'); }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', marginLeft: '0.5rem', fontSize: '0.8rem', fontWeight: 'bold' }} title="Logout">
                Keluar
              </button>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={() => setShowLoginModal(true)}>Login</button>
          )}
        </div>
      </nav>

      <header className="hero">
        <div className="badge">Football Simulator</div>
        <h1>Interactive Football Simulator for Every Fan</h1>
        <p>Visualize tournament brackets, simulate matches, and explore non-official knockout scenarios with a fast and fully interactive experience.</p>
        
      </header>

      <section id="features" className="section">
        <div className="section-header">
          <h2 className="section-title">Why FootyLabs?</h2>
          <p className="section-subtitle">Fitur-fitur yang bikin simulasi turnamen sepak bola lebih seru, akurat, dan aesthetic.</p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <Trophy />
            </div>
            <h3 className="feature-title">Group & Knockout Simulator</h3>
            <p className="feature-desc">Coba berbagai skenario bracket, geser tim sesuka hati, dan lihat siapa yang lolos ke Final Liga Champions atau Piala Dunia.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <Activity />
            </div>
            <h3 className="feature-title">Interactive Realtime Data</h3>
            <p className="feature-desc">Klasemen liga dan riwayat pertandingan yang sinkron secara langsung. Tidak perlu input manual.</p>
          </div>
          
        </div>
      </section>

      

      {/* Render Custom Tournaments if any */}
      {customTournaments.length > 0 && (
        <section id="my-tournaments" className="section">
          <div className="section-header">
            <h2 className="section-title">Turnamen Saya</h2>
            <p className="section-subtitle">Daftar turnamen custom yang telah Anda buat.</p>
          </div>
          <div className="tournaments-grid">
            {customTournaments.map((t, idx) => (
              <div key={idx} className="tournament-card" style={{ borderColor: 'var(--primary)', position: 'relative' }}>
                <button 
                  onClick={() => deleteTournament(t.id)}
                  style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, transition: 'all 0.2s' }}
                  title="Hapus Turnamen"
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = '#ef4444'; }}
                >
                  ✕
                </button>
                <div className="t-logo-placeholder" style={{ color: '#fff', background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
                  {t.type === 'liga' ? 'LG' : 'KN'}
                </div>
                <h3 className="t-title">{t.name}</h3>
                <p className="t-desc">{t.type === 'liga' ? 'Format Liga (Round Robin)' : 'Format Sistem Gugur'} • {t.count} Tim</p>
                <a href="#" className="t-action" onClick={(e) => { e.preventDefault(); setActiveTournament(t); window.scrollTo(0,0); }}>
                  Buka {t.type === 'liga' ? 'Klasemen' : 'Bracket'} <ArrowRight size={16} />
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      <section id="custom-tournament" className="section" style={{ background: 'var(--bg-card-hover)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="section-header">
          <h2 className="section-title">Buat Turnamen Sendiri</h2>
          <p className="section-subtitle">Tidak menemukan turnamen favoritmu? Buat skenario turnamenmu sendiri dari awal, atur formatnya, dan bagikan ke teman-teman.</p>
        </div>

        <div className="tournaments-grid">
          <div className="feature-card" style={{ textAlign: 'center' }}>
            <div className="feature-icon" style={{ margin: '0 auto 1.5rem auto' }}>
              <List />
            </div>
            <h3 className="feature-title">Sistem Liga (League)</h3>
            <p className="feature-desc" style={{ marginBottom: '1.5rem' }}>Buat turnamen dengan format poin penuh. Setiap tim akan bertemu satu sama lain (Round Robin). Cocok untuk liga domestik.</p>
            <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }} onClick={(e) => { e.preventDefault(); openModal('liga'); }}><Plus size={16} /> Buat Liga</button>
          </div>

          <div className="feature-card" style={{ textAlign: 'center' }}>
            <div className="feature-icon" style={{ margin: '0 auto 1.5rem auto' }}>
              <Network />
            </div>
            <h3 className="feature-title">Sistem Gugur (Knockout)</h3>
            <p className="feature-desc" style={{ marginBottom: '1.5rem' }}>Buat bracket sistem gugur, mulai dari babak 16 besar hingga final. Cocok untuk piala domestik atau format cup.</p>
            <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }} onClick={(e) => { e.preventDefault(); openModal('knockout'); }}><Plus size={16} /> Buat Bracket Gugur</button>
          </div>
        </div>
      </section>

      <footer>
        <div className="footer-content">
          <div className="footer-brand">
            <div className="logo" onClick={() => window.scrollTo(0,0)} style={{cursor: 'pointer'}}>
              <Goal size={24} color="#10b981" />
              Footy<span>Labs</span>
            </div>
            <p>Independent fan-made football simulator. Visualize tournament brackets and simulate matches with a fast and fully interactive experience.</p>
          </div>
          
          <div className="footer-links">
            <h4>Project</h4>
            <ul>
              <li><a href="#features">Features</a></li>
              <li><a href="#" onClick={(e) => handleLinkClick(e, 'Memuat Changelog...')}>Changelog</a></li>
              <li><a href="#" onClick={(e) => handleLinkClick(e, 'Memuat Halaman About...')}>About</a></li>
              <li><a href="#" onClick={(e) => handleLinkClick(e, 'Mengarahkan ke Halaman Kontak...')}>Contact Us</a></li>
            </ul>
          </div>
          
          <div className="footer-links">
            <h4>Legal</h4>
            <ul>
              <li><a href="#" onClick={(e) => handleLinkClick(e, 'Memuat Kebijakan Privasi...')}>Privacy Policy</a></li>
              <li><a href="#" onClick={(e) => handleLinkClick(e, 'Memuat Ketentuan Penggunaan...')}>Terms of Use</a></li>
              <li><a href="#" onClick={(e) => handleLinkClick(e, 'Memuat Penyangkalan (Disclaimer)...')}>Disclaimer</a></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <div>Fan-Made Project © 2026 FootyLabs v1.0.0</div>
          <div>@mfaqihridho</div>
        </div>
      </footer>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 999, display: 'flex', 
          alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)'
        }}>
          <div className="modal-content glass-panel" style={{
            padding: '2.5rem', width: '90%', maxWidth: '500px', 
            background: 'var(--bg-card)', border: '1px solid var(--primary)'
          }}>
            <h2 style={{ marginBottom: '0.5rem', color: 'var(--primary)' }}>
              {tournamentType === 'liga' ? 'Buat Turnamen Liga' : 'Buat Turnamen Sistem Gugur'}
            </h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>Masukkan detail turnamen dan tim yang akan bertanding.</p>
            
            <form onSubmit={(e) => { 
              e.preventDefault();
              const teamsArray = formTeams.split(/\n|,/).map(t => t.trim()).filter(Boolean);
              
              if (formShuffle) {
                // Fisher-Yates shuffle
                for (let i = teamsArray.length - 1; i > 0; i--) {
                  const j = Math.floor(Math.random() * (i + 1));
                  [teamsArray[i], teamsArray[j]] = [teamsArray[j], teamsArray[i]];
                }
              }
              
              const matches = generateMatches(teamsArray, tournamentType);
              
              setCustomTournaments([...customTournaments, {
                id: Date.now().toString(),
                name: formName,
                type: tournamentType,
                count: formCount,
                teams: teamsArray,
                matches: matches
              }]);
              closeModal();
              showToast('Turnamen berhasil dibuat! Gulir ke atas untuk melihatnya.');
            }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Nama Turnamen</label>
                <input type="text" required placeholder="Cth: Liga Tarkam 2026" 
                  value={formName} onChange={(e) => setFormName(e.target.value)}
                  style={{
                  width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)',
                  background: 'rgba(0,0,0,0.5)', color: 'white', outline: 'none'
                }} />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Jumlah Tim</label>
                <input type="number" min="2" max="20" required 
                  value={formCount} onChange={(e) => setFormCount(Number(e.target.value))}
                  style={{
                  width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)',
                  background: 'rgba(0,0,0,0.5)', color: 'white', outline: 'none'
                }} />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Daftar Tim (Pisahkan dengan koma atau baris baru)</label>
                <textarea required rows="4" placeholder="Cth: Arsenal, Chelsea, Liverpool, Manchester City..." 
                  value={formTeams} onChange={(e) => setFormTeams(e.target.value)}
                  style={{
                  width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)',
                  background: 'rgba(0,0,0,0.5)', color: 'white', outline: 'none', resize: 'vertical'
                }}></textarea>
              </div>

              {tournamentType === 'knockout' && (
                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Pengaturan Bracket</label>
                  <div style={{ display: 'flex', gap: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                      <input type="radio" name="shuffle" checked={!formShuffle} onChange={() => setFormShuffle(false)} style={{ accentColor: 'var(--primary)' }} />
                      Sesuai Urutan
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                      <input type="radio" name="shuffle" checked={formShuffle} onChange={() => setFormShuffle(true)} style={{ accentColor: 'var(--primary)' }} />
                      Acak Otomatis (Shuffle)
                    </label>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={closeModal}>Batal</button>
                <button type="submit" className="btn btn-primary">Generate Turnamen</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', 
          alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)'
        }}>
          <div className="modal-content glass-panel" style={{
            padding: '2.5rem', width: '90%', maxWidth: '400px', 
            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            textAlign: 'center'
          }}>
            <h2 style={{ marginBottom: '1rem', color: 'white' }}>Masuk ke FootyLabs</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
              Simpan data turnamen Anda secara permanen di cloud dan akses fitur eksklusif.
            </p>
            
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
              <GoogleLogin
                onSuccess={(credentialResponse) => {
                  // JWT berisi data akun Google user (nama, email, foto profil)
                  const decoded = jwtDecode(credentialResponse.credential);
                  
                  setUser({
                    name: decoded.name,
                    email: decoded.email,
                    photo: decoded.picture
                  });
                  
                  setShowLoginModal(false);
                  showToast(`Selamat datang, ${decoded.name}!`);
                }}
                onError={() => {
                  showToast('Gagal terhubung ke layanan Google.');
                }}
                useOneTap
                theme="filled_black"
                shape="pill"
                size="large"
              />
            </div>
            
            <button onClick={() => setShowLoginModal(false)} style={{ marginTop: '2rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem' }}>
              Batal
            </button>
          </div>
        </div>
      )}
    </GoogleOAuthProvider>
  );
}

export default App;
