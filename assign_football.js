const fs = require('fs');
const data = require('./pokemon.json');

const POSITION_ROLES = {
  'GK': 'Arquero',
  'CB': 'Defensa Central',
  'LB': 'Lateral Izquierdo',
  'RB': 'Lateral Derecho',
  'CDM': 'Mediocentro Defensivo',
  'CM': 'Mediocentro',
  'CAM': 'Mediapunta',
  'LW': 'Extremo Izquierdo',
  'RW': 'Extremo Derecho',
  'ST': 'Delantero Centro'
};

const POSITION_JERSEY_BASE = {
  'GK': 1, 'CB': 4, 'LB': 6, 'RB': 2,
  'CDM': 5, 'CM': 8, 'CAM': 10, 'LW': 11, 'RW': 7, 'ST': 9
};

const TYPE_BONUSES = {
  'Fighting': { ST: 15, CDM: 5 },
  'Rock': { CB: 20, GK: 10 },
  'Steel': { CB: 20, GK: 5, CDM: 5 },
  'Ground': { CB: 15, CDM: 5 },
  'Ice': { CB: 10, GK: 10 },
  'Electric': { LW: 15, RW: 10, RB: 5 },
  'Flying': { LW: 10, RW: 10, LB: 5, RB: 5 },
  'Grass': { CM: 8, LB: 5 },
  'Water': { CM: 12, GK: 5 },
  'Fire': { ST: 20, LW: 5 },
  'Psychic': { CAM: 20, CM: 5 },
  'Ghost': { CAM: 15, LW: 5 },
  'Dark': { LW: 12, ST: 5, RW: 5 },
  'Fairy': { CAM: 15, CM: 5 },
  'Dragon': { ST: 15, CAM: 5 },
  'Normal': { CM: 8 },
  'Bug': { LW: 8, RW: 8 },
  'Poison': { CDM: 12, CM: 5 }
};

const ADVANTAGE_TEMPLATES = {
  'GK': [
    'Su {ability} le da reflejos sobrehumanos para atajar disparos imposibles',
    'Su gran envergadura ({height}m) cubre el arco de lado a lado',
    'Su {ability} lo convierte en un muro infranqueable bajo los tres palos',
    'Su capacidad de reacción ({vel}) le permite responder a cualquier remate'
  ],
  'CB': [
    'Su {ability} lo hace rocoso e impasable en el uno contra uno',
    'Su fuerza bruta ({weight}kg) intimida a cualquier delantero rival',
    'Su {ability} le permite anticipar y cortar cualquier ataque',
    'Su defensa implacable ({def}) no perdía un duelo'
  ],
  'LB': [
    'Su velocidad eléctrica ({vel}) le permite subir y bajar la banda sin descanso',
    'Su {ability} desborda por la izquierda y centra con precisión milimétrica',
    'Su agilidad combina defensa sólida con proyección ofensiva'
  ],
  'RB': [
    'Su explosividad ({vel}) lo hace imparable en la banda derecha',
    'Su {ability} le permite recuperar balones y lanzar contragolpes letales',
    'Su resistencia cubre toda la banda de área a área'
  ],
  'CDM': [
    'Su {ability} rompe jugadas y corta el juego rival con precisión quirúrgica',
    'Su resistencia ({stamina}) le permite barrer todo el mediocampo sin descanso',
    'Su {ability} lo convierte en el escudo protector de la defensa',
    'Su capacidad destructiva neutraliza al mejor mediapunta rival'
  ],
  'CM': [
    'Su {ability} distribuye el juego con una visión privilegiada del campo',
    'Su equilibrio entre defensa y ataque ({ata}/{def}) lo hace indispensable',
    'Su {ability} controla el ritmo del partido desde el mediocampo',
    'Su inteligencia táctica organiza al equipo en ambas fases del juego'
  ],
  'CAM': [
    'Su {ability} crea jugadas de gol con una visión mágica del campo',
    'Su inteligencia lee el juego y asiste a los delanteros con precisión',
    'Su {ability} desequilibra con pases filtrados imposibles de leer',
    'Su creatividad desbloquea defensas cerradas con un solo pase'
  ],
  'LW': [
    'Su velocidad letal ({vel}) desborda defensas por la izquierda sin piedad',
    'Su {ability} regatea rivales como conos y encara al arco con decisión',
    'Su rapidez en el uno contra uno lo convierte en pesadilla de laterales'
  ],
  'RW': [
    'Su explosividad ({vel}) destruye defensas por la banda derecha',
    'Su {ability} recorta hacia adentro y saca disparos potentes al arco',
    'Su velocidad punta deja atrás a cualquier defensor en el sprint'
  ],
  'ST': [
    'Su potencia de fuego ({ata}) define con precisión quirúrgica frente al arco',
    'Su {ability} lo convierte en un cazador implacable dentro del área',
    'Su remate potente ({ata}) y su físico ({weight}kg) lo hacen imparable',
    'Su olfato de gol ({ata}) lo pone siempre en el lugar correcto'
  ]
};

function assignPosition(p) {
  const { ata, def, vel } = p;
  const h = p.pokeapi_details?.height_m || 1.5;
  const w = p.pokeapi_details?.weight_kg || 50;
  const type = p.type || 'Normal';
  const spAta = p.pokeapi_details?.stats_full?.['special-attack'] || ata;

  const scores = {};
  scores['GK'] = def * 2.0 + h * 8 + w / 20;
  scores['CB'] = def * 2.0 + h * 5 + ata * 0.5 + vel * 0.2;
  scores['LB']  = vel * 1.5 + def * 1.2 + ata * 0.3;
  scores['RB']  = vel * 1.5 + def * 1.2 + ata * 0.3;
  scores['CDM'] = def * 1.3 + ata * 0.8 + vel * 0.7;
  scores['CM']  = (ata + def + vel) / 3 * 1.5;
  scores['CAM'] = spAta * 1.0 + ata * 0.5 + vel * 0.5;
  scores['LW']  = vel * 1.8 + ata * 1.0;
  scores['RW']  = vel * 1.8 + ata * 1.0;
  scores['ST']  = ata * 1.8 + vel * 0.6 + spAta * 0.3;

  const bonuses = TYPE_BONUSES[type] || {};
  for (const [pos, bonus] of Object.entries(bonuses)) {
    if (scores[pos]) scores[pos] += bonus;
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);

  if (sorted[0][0] === 'LB' || sorted[0][0] === 'RB') {
    return (p.id % 2 === 0) ? 'RB' : 'LB';
  }
  if (sorted[0][0] === 'LW' || sorted[0][0] === 'RW') {
    return (spAta > ata) ? 'LW' : 'RW';
  }

  return sorted[0][0];
}

const teamJerseys = {};

function assignJersey(position, countryCode) {
  if (!teamJerseys[countryCode]) teamJerseys[countryCode] = {};
  const used = teamJerseys[countryCode];
  const base = POSITION_JERSEY_BASE[position] || 12;
  let number = base;
  while (used[number]) {
    number++;
    if (number > 99) number = 1;
  }
  used[number] = true;
  return number;
}

function generateAdvantage(p, position) {
  const ability = p.pokeapi_details?.abilities?.[0]?.replace(/-/g, ' ') || 'instinto natural';
  const templates = ADVANTAGE_TEMPLATES[position] || ADVANTAGE_TEMPLATES['CM'];
  const template = templates[p.id % templates.length];
  const stamina = Math.round((p.ata + p.def + p.vel) / 3);
  return template
    .replace(/\{ability\}/g, ability)
    .replace(/\{height\}/g, (p.pokeapi_details?.height_m || 1.5).toString())
    .replace(/\{weight\}/g, (p.pokeapi_details?.weight_kg || 50).toString())
    .replace(/\{ata\}/g, p.ata.toString())
    .replace(/\{def\}/g, p.def.toString())
    .replace(/\{vel\}/g, p.vel.toString())
    .replace(/\{stamina\}/g, stamina.toString());
}

let modified = 0;
const updates = data.map(p => {
  if (p.countryCode === '???' || !p.countryName || p.countryName === 'Desconocido') {
    p.football = {
      team: 'Agente Libre',
      position: '—',
      jersey: 0,
      role: 'Sin equipo',
      advantage: 'Este Pokémon aún no tiene equipo. ¡Necesita ser fichado!'
    };
    modified++;
    return p;
  }

  const position = assignPosition(p);
  const jersey = assignJersey(position, p.countryCode);
  const role = POSITION_ROLES[position] || 'Jugador de Campo';
  const advantage = generateAdvantage(p, position);

  p.football = { team: p.countryName, position, jersey, role, advantage };
  modified++;
  return p;
});

fs.writeFileSync('./pokemon.json', JSON.stringify(updates, null, 2));
console.log(`✅ Modificados ${modified} Pokémon`);

// Print team summaries
const teams = {};
updates.forEach(p => {
  if (!p.football || p.football.jersey === 0) return;
  const t = p.football.team;
  if (!teams[t]) teams[t] = [];
  teams[t].push({ n: p.name, p: p.football.position, j: p.football.jersey, r: p.football.role });
});

Object.entries(teams).sort((a, b) => b[1].length - a[1].length).forEach(([team, players]) => {
  players.sort((a, b) => a.j - b.j);
  const posCount = {};
  players.forEach(x => { posCount[x.p] = (posCount[x.p] || 0) + 1; });
  const summary = Object.entries(posCount).sort((a,b) => b[1]-a[1]).map(([p,c]) => `${p}x${c}`).join(' ');
  console.log(`\n${team} (${players.length}): ${summary}`);
  players.forEach(x => console.log(`   #${String(x.j).padStart(2)} ${x.p.padEnd(3)} ${x.n.padEnd(16)} ${x.r}`));
});
