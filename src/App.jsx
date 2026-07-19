import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Cpu, Zap, ArrowRight, Activity, Users, Eye, BarChart, Goal, Plus, List, Network, PlusCircle, Trash2, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

function App() {
  const [showModal, setShowModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [user, setUser] = useState(null);
  
  const [tournamentType, setTournamentType] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  
  const [customTournaments, setCustomTournaments] = useState(() => {
    try {
      const saved = localStorage.getItem('footylabs_tournaments');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      // Migrasi data lama agar tidak error (black screen) karena format goals baru
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
  });
  
  const [activeTournament, setActiveTournament] = useState(null);

  useEffect(() => {
    localStorage.setItem('footylabs_tournaments', JSON.stringify(customTournaments));
  }, [customTournaments]);

  // Form states
  const [formName, setFormName] = useState('');
  const [formCount, setFormCount] = useState(8);
  const [formTeams, setFormTeams] = useState('');
  
  const openModal = (type) => {
    setTournamentType(type);
    setFormName('');
    setFormCount(8);
    setFormTeams('');
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
      // Kandang-Tandang (Home & Away) Knockout pairs (first round)
      for (let i = 0; i < teams.length; i += 2) {
        if (i + 1 < teams.length) {
          matches.push({ id: `K-1-${i}`, teamA: teams[i], teamB: teams[i+1], scoreA: '', scoreB: '', goalsA: [], goalsB: [], isPlayed: false, legInfo: 'Leg 1' });
          matches.push({ id: `K-2-${i}`, teamA: teams[i+1], teamB: teams[i], scoreA: '', scoreB: '', goalsA: [], goalsB: [], isPlayed: false, legInfo: 'Leg 2' });
        }
      }
    }
    return matches;
  };

  const updateScore = (matchId, newScoreA, newScoreB) => {
    const isScoreFilled = newScoreA !== '' && newScoreB !== '';
    const updatedTournaments = customTournaments.map(t => {
      if (t.id === activeTournament.id) {
        const updatedMatches = t.matches.map(m => {
          if (m.id === matchId) {
            return { ...m, scoreA: newScoreA, scoreB: newScoreB, isPlayed: isScoreFilled };
          }
          return m;
        });
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
            const newGoal = { id: Date.now() + Math.random(), name: '', time: '' };
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

  const exportKlasemen = async () => {
    const element = document.getElementById('klasemen-board');
    if (element) {
      showToast('Menyiapkan gambar klasemen...');
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
        showToast('Gambar klasemen berhasil diunduh!');
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
        <div className="glass-panel" style={{ padding: '3rem', background: 'var(--bg-card)' }}>
          <div className="badge" style={{ marginBottom: '1rem' }}>
            {activeTournament.type === 'liga' ? 'League Format' : 'Knockout Format'}
          </div>
          <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--primary)' }}>
            {activeTournament.name}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '3rem' }}>
            Jumlah Peserta: {activeTournament.count} Tim
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: activeTournament.type === 'liga' ? '1.5fr 2.5fr' : '1fr 2.5fr', gap: '3rem' }}>
            {/* Kiri: Klasemen atau Tim Peserta */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <h3 style={{ margin: 0 }}>
                  {activeTournament.type === 'liga' ? 'Klasemen (Live)' : 'Tim Peserta'}
                </h3>
                {activeTournament.type === 'liga' && (
                  <button onClick={exportKlasemen} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', gap: '0.4rem' }}>
                    <Download size={14} /> Export PNG
                  </button>
                )}
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
                <div style={{ padding: '1rem', background: 'var(--bg-card)', borderRadius: '12px' }}>
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
        
        <div className="hero-actions">
          <button className="btn btn-primary" onClick={() => document.getElementById('simulator').scrollIntoView({behavior: 'smooth'})}>
            Try Simulation <ArrowRight size={18} />
          </button>
          <button className="btn btn-outline" onClick={() => showToast('Mengarahkan ke halaman Top Up/Donasi...')}>
            <Zap size={18} color="#10b981" /> Power Up
          </button>
        </div>

        <div className="hero-image-container">
          <div className="hero-image">
            <div style={{ textAlign: 'center', padding: '4rem' }}>
              <Trophy size={80} color="rgba(16, 185, 129, 0.2)" style={{ marginBottom: '1rem' }} />
              <h2 style={{ fontSize: '2rem', color: 'var(--text-muted)' }}>Knockout Stage Visualization</h2>
              <p style={{ color: 'rgba(255,255,255,0.3)', marginTop: '0.5rem' }}>Interactive UI Demo</p>
            </div>
          </div>
        </div>
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
          
          <div className="feature-card">
            <div className="feature-icon">
              <Cpu />
            </div>
            <h3 className="feature-title">AI Match Predictions</h3>
            <p className="feature-desc">Bukan tebak-tebakan semata. Prediksi berbasis performa 5 match terakhir, formasi, dan statistik head-to-head.</p>
          </div>
        </div>
      </section>

      <section id="simulator" className="section">
        <div className="section-header">
          <h2 className="section-title">Turnamen Unggulan</h2>
          <p className="section-subtitle">Pilih medan pertempuranmu dan mulai simulasi kompetisi.</p>
        </div>

        <div className="tournaments-grid">
          <div className="tournament-card">
            <div className="t-status status-active">Active</div>
            <div className="t-logo-placeholder">UCL</div>
            <h3 className="t-title">Champions League</h3>
            <p className="t-desc">UEFA Champions League 2026/2027</p>
            <a href="#" className="t-action" onClick={(e) => handleLinkClick(e, 'Memuat Simulator Champions League...')}>Simulate <ArrowRight size={16} /></a>
          </div>

          <div className="tournament-card">
            <div className="t-status status-completed">Completed</div>
            <div className="t-logo-placeholder" style={{ color: '#fbbf24' }}>FIFA</div>
            <h3 className="t-title">FIFA World Cup</h3>
            <p className="t-desc">World Cup 2026</p>
            <a href="#" className="t-action" onClick={(e) => handleLinkClick(e, 'Memuat Simulator FIFA World Cup...')}>Simulate <ArrowRight size={16} /></a>
          </div>

          <div className="tournament-card">
            <div className="t-status status-active">Active</div>
            <div className="t-logo-placeholder">EPL</div>
            <h3 className="t-title">Premier League</h3>
            <p className="t-desc">English Premier League 2026/2027</p>
            <a href="#" className="t-action" onClick={(e) => handleLinkClick(e, 'Memuat Simulator Premier League...')}>Simulate <ArrowRight size={16} /></a>
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
              <div key={idx} className="tournament-card" style={{ borderColor: 'var(--primary)' }}>
                <div className="t-status status-active">Custom</div>
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

      <section className="section" style={{ paddingTop: '2rem' }}>
        <div className="stats-container">
          <div className="stat-item">
            <div className="stat-value">85K+</div>
            <div className="stat-label">Active Fans</div>
            <div className="stat-desc">Participated in simulations</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">120K+</div>
            <div className="stat-label">Total Visits</div>
            <div className="stat-desc">Unique sessions recorded</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">450K+</div>
            <div className="stat-label">Page Views</div>
            <div className="stat-desc">Total pages navigated</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">25K</div>
            <div className="stat-label">Peak Daily Users</div>
            <div className="stat-desc">Concurrent users in one day</div>
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

              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Daftar Tim (Pisahkan dengan koma atau baris baru)</label>
                <textarea required rows="4" placeholder="Cth: Arsenal, Chelsea, Liverpool, Manchester City..." 
                  value={formTeams} onChange={(e) => setFormTeams(e.target.value)}
                  style={{
                  width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)',
                  background: 'rgba(0,0,0,0.5)', color: 'white', outline: 'none', resize: 'vertical'
                }}></textarea>
              </div>

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
