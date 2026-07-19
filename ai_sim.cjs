const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Add Top Assists Logic
const topScorersRegex = /const calculateTopScorers = \([^)]+\) => \{[\s\S]*?return Object\.values\(players\)\.sort\(\(a, b\) => b\.goals - a\.goals\)\.slice\(0, 10\);\s*\};/g;

const topScorersMatch = code.match(topScorersRegex);
if (topScorersMatch) {
  const topAssistsCode = `
  const calculateTopAssists = (matches) => {
    const players = {};
    matches.forEach(match => {
      if (match.isPlayed) {
        match.goalsA.forEach(g => {
          const name = (g.assist || '').trim();
          if (name) {
            const key = \`\${name}-\${match.teamA}\`;
            if (!players[key]) players[key] = { name, team: match.teamA, assists: 0 };
            players[key].assists += 1;
          }
        });
        match.goalsB.forEach(g => {
          const name = (g.assist || '').trim();
          if (name) {
            const key = \`\${name}-\${match.teamB}\`;
            if (!players[key]) players[key] = { name, team: match.teamB, assists: 0 };
            players[key].assists += 1;
          }
        });
      }
    });
    return Object.values(players).sort((a, b) => b.assists - a.assists).slice(0, 10);
  };
`;
  if (!code.includes('calculateTopAssists')) {
    code = code.replace(topScorersRegex, topScorersMatch[0] + topAssistsCode);
  }
}

// 2. Render Top Assists
const topScorerRenderRegex = /<h3 className="section-title" style={{ fontSize: '1\.2rem', marginBottom: '1rem' }}>Top Skor<\/h3>[\s\S]*?<\/table>\s*<\/div>\s*<\/div>/g;

const topScorerRenderMatch = code.match(topScorerRenderRegex);
if (topScorerRenderMatch && !code.includes('Top Assist')) {
  const topAssistRenderCode = `
            <div className="glass-panel" style={{ flex: 1, padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
              <h3 className="section-title" style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Top Assist</h3>
              <div style={{ overflowX: 'auto' }}>
                <table className="standings-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <th style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>Pemain</th>
                      <th style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>Tim</th>
                      <th style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>Ast</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculateTopAssists(activeTournament.matches).map((p, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>{p.name}</td>
                        <td style={{ padding: '0.5rem', fontSize: '0.85rem' }}>{p.team}</td>
                        <td style={{ padding: '0.5rem', color: 'var(--primary)', fontWeight: 'bold' }}>{p.assists}</td>
                      </tr>
                    ))}
                    {calculateTopAssists(activeTournament.matches).length === 0 && (
                      <tr><td colSpan="3" style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada data assist</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
`;
  code = code.replace(topScorerRenderMatch[0], topScorerRenderMatch[0] + topAssistRenderCode);
}

// Update Top Scorer layout to use flex gap
code = code.replace(/<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>/g, 
  "<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>");

// 3. Update addGoal
code = code.replace(
  /const newGoal = { id: Date.now\(\) \+ Math.random\(\), name: '', time: '' };/g,
  "const newGoal = { id: Date.now() + Math.random(), name: '', time: '', assist: '' };"
);

// 4. Update UI for assists (Goals A & B)
const uiGoalARegex = /<input\s+type="number" placeholder="Menit" value=\{g\.time\} onChange=\{\(e\) => updateGoal\(match\.id, 'goalsA', g\.id, 'time', e\.target\.value\)\}\s+style=\{\{([^}]+)\}\}\s+\/>/g;
const uiGoalBRegex = /<input\s+type="number" placeholder="Menit" value=\{g\.time\} onChange=\{\(e\) => updateGoal\(match\.id, 'goalsB', g\.id, 'time', e\.target\.value\)\}\s+style=\{\{([^}]+)\}\}\s+\/>/g;

if (!code.includes("placeholder=\"Assist\"")) {
  code = code.replace(uiGoalARegex, (match, p1) => {
    return match + `\n<input type="text" placeholder="Assist" value={g.assist || ''} onChange={(e) => updateGoal(match.id, 'goalsA', g.id, 'assist', e.target.value)} style={{ flex: 1.5, padding: '0.4rem', fontSize: '0.85rem', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', outline: 'none' }} />`;
  });
  
  code = code.replace(uiGoalBRegex, (match, p1) => {
    return match + `\n<input type="text" placeholder="Assist" value={g.assist || ''} onChange={(e) => updateGoal(match.id, 'goalsB', g.id, 'assist', e.target.value)} style={{ flex: 1.5, padding: '0.4rem', fontSize: '0.85rem', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', outline: 'none' }} />`;
  });
}

// 5. Add AI Simulator function inside App component
const aiSimFunction = `
  const simulateAITournament = (tournament) => {
    const playersDb = {
      'Real Madrid': ['Vinicius Jr', 'Bellingham', 'Rodrygo', 'Valverde', 'Modric'],
      'Man City': ['Haaland', 'De Bruyne', 'Foden', 'Bernardo Silva', 'Rodri'],
      'Bayern Munich': ['Kane', 'Musiala', 'Sane', 'Muller', 'Gnabry'],
      'Arsenal': ['Saka', 'Odegaard', 'Martinelli', 'Rice', 'Havertz'],
      'Barcelona': ['Lewandowski', 'Yamal', 'Pedri', 'Raphinha', 'De Jong'],
      'PSG': ['Mbappe', 'Dembele', 'Asensio', 'Hakimi', 'Ruiz'],
      'Inter Milan': ['Martinez', 'Thuram', 'Barella', 'Calhanoglu', 'Dimarco'],
      'Juventus': ['Vlahovic', 'Chiesa', 'Rabiot', 'Locatelli', 'Bremer'],
      'Liverpool': ['Salah', 'Nunez', 'Diaz', 'Jota', 'Szoboszlai'],
      'Atletico Madrid': ['Griezmann', 'Morata', 'Depay', 'Koke', 'Llorente'],
      'Bayer Leverkusen': ['Boniface', 'Wirtz', 'Frimpong', 'Grimaldo', 'Schick'],
      'Borussia Dortmund': ['Fullkrug', 'Brandt', 'Sancho', 'Reus', 'Malen'],
      'AC Milan': ['Leao', 'Giroud', 'Pulisic', 'Hernandez', 'Loftus-Cheek'],
      'Napoli': ['Osimhen', 'Kvaratskhelia', 'Politano', 'Zielinski', 'Anguissa'],
      'Sporting CP': ['Gyokeres', 'Goncalves', 'Trincao', 'Edwards', 'Paulinho'],
      'PSV Eindhoven': ['De Jong', 'Bakayoko', 'Tillman', 'Lozano', 'Pepi'],
      'Argentina': ['Messi', 'Alvarez', 'Di Maria', 'Mac Allister', 'Fernandez'],
      'France': ['Mbappe', 'Griezmann', 'Giroud', 'Dembele', 'Tchouameni'],
      'Brazil': ['Vinicius Jr', 'Rodrygo', 'Raphinha', 'Richarlison', 'Paqueta'],
      'England': ['Kane', 'Bellingham', 'Saka', 'Foden', 'Rashford'],
      'Spain': ['Morata', 'Yamal', 'Williams', 'Pedri', 'Rodri'],
      'Portugal': ['Ronaldo', 'Silva', 'Fernandes', 'Leao', 'Felix'],
      'Germany': ['Havertz', 'Musiala', 'Wirtz', 'Fullkrug', 'Sane'],
      'Netherlands': ['Gakpo', 'Simons', 'Depay', 'Malen', 'Weghorst'],
      'Italy': ['Chiesa', 'Scamacca', 'Barella', 'Frattesi', 'Pellegrini'],
      'Croatia': ['Kramaric', 'Modric', 'Kovacic', 'Brozovic', 'Perisic'],
      'Uruguay': ['Nunez', 'Valverde', 'De Arrascaeta', 'Pellistri', 'Araujo'],
      'Colombia': ['Diaz', 'Rodriguez', 'Borre', 'Arias', 'Sinisterra'],
      'Belgium': ['Lukaku', 'De Bruyne', 'Doku', 'Trossard', 'Tielemans'],
      'Morocco': ['En-Nesyri', 'Ziyech', 'Hakimi', 'Amrabat', 'Boufal'],
      'Japan': ['Mitoma', 'Kubo', 'Doan', 'Minamino', 'Endo'],
      'USA': ['Pulisic', 'Weah', 'Balogun', 'McKennie', 'Reyna'],
      'Chelsea': ['Jackson', 'Palmer', 'Sterling', 'Mudryk', 'Fernandez'],
      'Tottenham': ['Son', 'Richarlison', 'Maddison', 'Kulusevski', 'Johnson'],
      'Man United': ['Rashford', 'Hojlund', 'Garnacho', 'Fernandes', 'Mount'],
      'Newcastle': ['Isak', 'Gordon', 'Almiron', 'Guimaraes', 'Barnes'],
      'Aston Villa': ['Watkins', 'Bailey', 'Diaby', 'McGinn', 'Luiz']
    };

    const getRandomPlayer = (team) => {
      const roster = playersDb[team] || ['Player 1', 'Player 2', 'Player 3'];
      return roster[Math.floor(Math.random() * roster.length)];
    };

    let simMatches = JSON.parse(JSON.stringify(tournament.matches));
    
    // Helper to simulate a match
    const simMatch = (m) => {
      if (m.teamA === 'TBD' || m.teamB === 'TBD' || m.teamB === 'BYE') return m;
      
      const sA = Math.floor(Math.random() * 4);
      const sB = Math.floor(Math.random() * 4);
      m.scoreA = sA.toString();
      m.scoreB = sB.toString();
      m.isPlayed = true;
      m.goalsA = [];
      m.goalsB = [];
      
      for(let i=0; i<sA; i++) {
        m.goalsA.push({ id: Math.random(), name: getRandomPlayer(m.teamA), time: Math.floor(Math.random()*90)+1, assist: Math.random() > 0.4 ? getRandomPlayer(m.teamA) : '' });
      }
      for(let i=0; i<sB; i++) {
        m.goalsB.push({ id: Math.random(), name: getRandomPlayer(m.teamB), time: Math.floor(Math.random()*90)+1, assist: Math.random() > 0.4 ? getRandomPlayer(m.teamB) : '' });
      }
      return m;
    };

    if (tournament.type === 'liga') {
      simMatches = simMatches.map(simMatch);
    } else {
      // Knockout simulation per round
      const maxRound = Math.max(...simMatches.map(m => m.roundIndex || 0));
      for (let r = 0; r <= maxRound; r++) {
        // Find matches in this round
        let leg1s = simMatches.filter(m => m.roundIndex === r && m.legInfo === 'Leg 1');
        let leg2s = simMatches.filter(m => m.roundIndex === r && m.legInfo === 'Leg 2');
        
        leg1s.forEach(l1 => {
          const l2 = leg2s.find(m => m.matchIndex === l1.matchIndex);
          if (l1.teamA === 'TBD' || l1.teamB === 'TBD' || l1.teamB === 'BYE') return;
          
          simMatch(l1);
          simMatch(l2);
          
          // Advance winner
          const aggA = parseInt(l1.scoreA) + parseInt(l2.scoreB);
          const aggB = parseInt(l1.scoreB) + parseInt(l2.scoreA);
          
          let winner = 'TBD';
          if (aggA > aggB) winner = l1.teamA;
          else if (aggB > aggA) winner = l1.teamB;
          else {
            l2.penA = Math.floor(Math.random()*2) + 4;
            l2.penB = l2.penA - 1 - Math.floor(Math.random()*2);
            winner = l1.teamA; // Simplified
            if (Math.random() > 0.5) {
              const temp = l2.penA; l2.penA = l2.penB; l2.penB = temp;
              winner = l1.teamB;
            }
          }
          
          const nextR = r + 1;
          const nextM = Math.floor(l1.matchIndex / 2);
          const nextMatch1 = simMatches.find(m => m.roundIndex === nextR && m.matchIndex === nextM && m.legInfo === 'Leg 1');
          const nextMatch2 = simMatches.find(m => m.roundIndex === nextR && m.matchIndex === nextM && m.legInfo === 'Leg 2');
          
          if (nextMatch1 && nextMatch2) {
            if (l1.matchIndex % 2 === 0) {
              nextMatch1.teamA = winner;
              nextMatch2.teamB = winner;
            } else {
              nextMatch1.teamB = winner;
              nextMatch2.teamA = winner;
            }
          }
        });
      }
    }
    
    return { ...tournament, matches: simMatches };
  };
`;

if (!code.includes('simulateAITournament')) {
  code = code.replace(/const createTemplateTournament = \(template\) => \{/, aiSimFunction + "\n  const createTemplateTournament = (template) => {");
}

// 6. Hook up the AI simulator inside createTemplateTournament
code = code.replace(
  /const newTournament = \{([^}]*)\};\s*setCustomTournaments\(prev => \[\.\.\.prev, newTournament\]\);/,
  "let newTournament = {$1};\n    newTournament = simulateAITournament(newTournament);\n    setCustomTournaments(prev => [...prev, newTournament]);"
);

fs.writeFileSync('src/App.jsx', code, 'utf8');
console.log('AI Simulation logic injected successfully.');
