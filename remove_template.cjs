const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// Remove simulateAITournament and createTemplateTournament
const simRegex = /\s*const simulateAITournament = \([\s\S]*?showToast\(`\$\{name\} berhasil dibuat!`\);\s*\};\n/g;
if (simRegex.test(code)) {
    code = code.replace(simRegex, '');
    console.log('Removed functions');
} else {
    // If combined regex fails, do it differently
    const startSim = code.indexOf('const simulateAITournament =');
    if (startSim !== -1) {
        const calculateStandingsIndex = code.indexOf('const calculateStandings =');
        code = code.substring(0, startSim) + code.substring(calculateStandingsIndex);
        console.log('Removed functions manually');
    }
}

// Remove the Turnamen Unggulan section
const sectionStart = code.indexOf('<section id="simulator" className="section">');
if (sectionStart !== -1) {
    const sectionEndStr = '</section>';
    let sectionEnd = code.indexOf(sectionEndStr, sectionStart);
    if (sectionEnd !== -1) {
        code = code.substring(0, sectionStart) + code.substring(sectionEnd + sectionEndStr.length);
        console.log('Removed Turnamen Unggulan section');
    }
}

fs.writeFileSync('src/App.jsx', code, 'utf8');
console.log('Removal complete');
