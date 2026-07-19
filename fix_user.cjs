const fs = require('fs');

let content = fs.readFileSync('src/App.jsx', 'utf8');

const oldStateLogic = `  const [customTournaments, setCustomTournaments] = useState(() => {
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
  }, [customTournaments]);`;

const newStateLogic = `  const getStorageKey = (currentUser) => {
    return currentUser ? \`footylabs_tournaments_\${currentUser.email}\` : 'footylabs_tournaments';
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

  const [customTournaments, setCustomTournaments] = useState(() => loadData(null));
  const [activeTournament, setActiveTournament] = useState(null);

  // Sync state when user logs in or out
  useEffect(() => {
    setCustomTournaments(loadData(user));
    setActiveTournament(null); // Tutup turnamen aktif agar tidak bug saat switch akun
  }, [user]);

  useEffect(() => {
    localStorage.setItem(getStorageKey(user), JSON.stringify(customTournaments));
  }, [customTournaments, user]);`;

content = content.replace(oldStateLogic, newStateLogic);

fs.writeFileSync('src/App.jsx', content, 'utf8');
console.log('User data isolation fixed successfully!');
