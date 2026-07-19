const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// Add more teams to playersDb
const newPlayers = `
      'Senegal': ['Mane', 'Sarr', 'Koulibaly', 'Gueye', 'Mendy'],
      'South Korea': ['Son', 'Hwang', 'Lee', 'Kim', 'Cho'],
      'Switzerland': ['Shaqiri', 'Xhaka', 'Akanji', 'Embolo', 'Sommer'],
      'Denmark': ['Eriksen', 'Hojbjerg', 'Christensen', 'Schmeichel', 'Poulsen'],
      'Mexico': ['Lozano', 'Alvarez', 'Jimenez', 'Ochoa', 'Herrera'],
      'Ecuador': ['Valencia', 'Caicedo', 'Estupinan', 'Hincapie', 'Plata'],
      'Poland': ['Lewandowski', 'Zielinski', 'Milik', 'Szczesny', 'Cash'],
      'Australia': ['Ryan', 'Mooy', 'Irvine', 'Souttar', 'Leckie'],
      'Cameroon': ['Aboubakar', 'Choupo-Moting', 'Onana', 'Anguissa', 'Toko Ekambi'],
      'Canada': ['Davies', 'David', 'Buchanan', 'Eustaquio', 'Borjan'],
      'Serbia': ['Mitrovic', 'Vlahovic', 'Tadic', 'Milinkovic-Savic', 'Kostic'],
      'Ghana': ['Partey', 'Kudus', 'Ayew', 'Williams', 'Amartey'],
      'Saudi Arabia': ['Al-Dawsari', 'Al-Shehri', 'Al-Faraj', 'Al-Owais', 'Kanno'],
      'Iran': ['Taremi', 'Azmoun', 'Jahanbakhsh', 'Hosseini', 'Ezatolahi'],
      'Wales': ['Bale', 'Ramsey', 'James', 'Davies', 'Moore'],
      'Costa Rica': ['Navas', 'Campbell', 'Borges', 'Ruiz', 'Duarte'],
`;
code = code.replace(
  /'USA': \['Pulisic', 'Weah', 'Balogun', 'McKennie', 'Reyna'\],/g,
  `'USA': ['Pulisic', 'Weah', 'Balogun', 'McKennie', 'Reyna'],${newPlayers}`
);

// Update fifa teams array
const oldFifaTeams = `teams = ['Argentina', 'France', 'Brazil', 'England', 'Spain', 'Portugal', 'Germany', 'Netherlands', 'Italy', 'Croatia', 'Uruguay', 'Colombia', 'Belgium', 'Morocco', 'Japan', 'USA'];`;
const newFifaTeams = `teams = ['Argentina', 'France', 'Brazil', 'England', 'Spain', 'Portugal', 'Germany', 'Netherlands', 'Italy', 'Croatia', 'Uruguay', 'Colombia', 'Belgium', 'Morocco', 'Japan', 'USA', 'Senegal', 'South Korea', 'Switzerland', 'Denmark', 'Mexico', 'Ecuador', 'Poland', 'Australia', 'Cameroon', 'Canada', 'Serbia', 'Ghana', 'Saudi Arabia', 'Iran', 'Wales', 'Costa Rica'];`;

code = code.replace(oldFifaTeams, newFifaTeams);

fs.writeFileSync('src/App.jsx', code, 'utf8');
console.log('FIFA World Cup updated to 32 teams');
