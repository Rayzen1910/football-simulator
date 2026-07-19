const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

const regex = /const deleteTournament = \(id\) => \{\s*if \(window\.confirm\('Apakah Anda yakin ingin menghapus turnamen ini\?'\)\) \{([\s\S]*?)showToast\('Turnamen berhasil dihapus'\);\s*\}\s*\};/;

if (regex.test(code)) {
    code = code.replace(regex, `const deleteTournament = (id) => {$1showToast('Turnamen berhasil dihapus');\n  };`);
    fs.writeFileSync('src/App.jsx', code, 'utf8');
    console.log('Fixed deleteTournament');
} else {
    console.log('Regex failed');
}
