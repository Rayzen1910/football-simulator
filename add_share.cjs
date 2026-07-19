const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Add Share2 to imports
code = code.replace(/import { Trophy, TrendingUp(.*?) } from 'lucide-react';/, "import { Trophy, TrendingUp$1, Share2 } from 'lucide-react';");

// 2. Add useEffect for decoding URL param
const useEffectStr = `
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tParam = urlParams.get('t');
    if (tParam) {
      try {
        const decoded = JSON.parse(decodeURIComponent(escape(atob(tParam))));
        if (!decoded.id) decoded.id = Date.now().toString();
        setCustomTournaments(prev => {
          if (prev.find(p => p.id === decoded.id)) return prev;
          return [decoded, ...prev];
        });
        setActiveTournament(decoded);
        showToast('Turnamen "' + decoded.name + '" berhasil diimpor!');
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (e) {
        showToast('Gagal memuat turnamen dari link.');
      }
    }
  }, []);
`;
code = code.replace('const [formName, setFormName] = useState(\'\');', useEffectStr + '\n  const [formName, setFormName] = useState(\'\');');

// 3. Add shareTournament function
const shareStr = `
  const shareTournament = async () => {
    try {
      const dataStr = JSON.stringify(activeTournament);
      const base64 = btoa(unescape(encodeURIComponent(dataStr)));
      const url = \`\${window.location.origin}\${window.location.pathname}?t=\${base64}\`;
      await navigator.clipboard.writeText(url);
      showToast('Link turnamen berhasil disalin ke clipboard!');
    } catch (e) {
      showToast('Gagal menyalin link (atau ukuran data terlalu besar).');
    }
  };
`;
code = code.replace('const calculateTopScorers = (matches) => {', shareStr + '\n  const calculateTopScorers = (matches) => {');

// 4. Add the Share button to UI
const titleUIOld = `<div className="badge" style={{ marginBottom: '1rem' }}>
            {activeTournament.type === 'liga' ? 'League Format' : 'Knockout Format'}
          </div>
          <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--primary)' }}>
            {activeTournament.name}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '3rem' }}>
            Jumlah Peserta: {activeTournament.count} Tim
          </p>`;

const titleUINew = `<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '3rem' }}>
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
            <button className="btn btn-primary" onClick={shareTournament} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Share2 size={18} /> Bagikan Link
            </button>
          </div>`;

code = code.replace(titleUIOld, titleUINew);

fs.writeFileSync('src/App.jsx', code, 'utf8');
console.log('Added share feature');
