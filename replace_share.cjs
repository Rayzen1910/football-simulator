const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Remove the Share useEffect
const shareEffectRegex = /useEffect\(\(\) => \{\s*const urlParams = new URLSearchParams.*?Memuat turnamen dari link\.\'\);\s*\}\s*\}\s*\}, \[\]\);/s;
code = code.replace(shareEffectRegex, '');

// Also catch the exact string we inserted earlier
const exactShareEffectStr = `
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
code = code.replace(exactShareEffectStr, '');

// 2. Remove shareTournament function
const exactShareStr = `
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
code = code.replace(exactShareStr, '');

// 3. Rename exportKlasemen to exportTournamentImage and target tournament-view
code = code.replace('const exportKlasemen = async () => {', 'const exportTournamentImage = async () => {');
code = code.replace('const element = document.getElementById(\'klasemen-board\');', 'const element = document.getElementById(\'tournament-view\');');
code = code.replace('showToast(\'Menyiapkan gambar klasemen...\');', 'showToast(\'Menyiapkan gambar turnamen...\');');
code = code.replace('showToast(\'Gambar klasemen berhasil diunduh!\');', 'showToast(\'Gambar turnamen berhasil diunduh!\');');

// 4. Update the Button UI
const uiOld = `<button className="btn btn-primary" onClick={shareTournament} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Share2 size={18} /> Bagikan Link
            </button>`;
const uiNew = `<button className="btn btn-primary" onClick={exportTournamentImage} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Download size={18} /> Unduh Gambar
            </button>`;
code = code.replace(uiOld, uiNew);

// 5. Remove the old Export PNG button from Klasemen Header
const klasemenExportRegex = /\{activeTournament\.type === 'liga' && \(\s*<button onClick=\{exportKlasemen\}.*?<\/button>\s*\)\}/s;
code = code.replace(klasemenExportRegex, '');

// 6. Add id="tournament-view" to the glass-panel
code = code.replace('<div className="glass-panel" style={{ padding: \'3rem\', background: \'var(--bg-card)\' }}>', '<div id="tournament-view" className="glass-panel" style={{ padding: \'3rem\', background: \'var(--bg-card)\' }}>');


fs.writeFileSync('src/App.jsx', code, 'utf8');
console.log('Replaced share with Image Export');
