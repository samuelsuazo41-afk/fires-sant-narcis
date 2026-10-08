// APP.JS COMPLET - FIRES SANT NARCÍS - LAIA ALGORITMICA v2.0
let capitols = [];
let visitats = JSON.parse(localStorage.getItem('fires_visitats') || '[]');
let laiaHistory = JSON.parse(localStorage.getItem('laia_history') || '[]');

// --- CERVELL ALGORÍTMIC DE LAIA ---
function getHora() {
  const h = new Date().getHours();
  if (h < 12) return 'matí';
  if (h < 19) return 'tarda';
  return 'nit';
}

function getLaiaDialogue(context, data = null) {
  const hora = getHora();
  const count = visitats.length;
  
  const dialogues = {
    mapa_0: [
      `Bon ${hora}! Soc Laia! La teva Miss Minutes gironina! Comencem per les Mosques del 1285? Allí va començar tot!`,
      `Eeei! Primer cop? Jo soc Laia, mosca oficial de Girona. Vine, t'ensenyo on vam matar 20.000 francesos 😏`,
      `Hola hola! Tens 0 segells. Tranqui, jo t'ajudo. El primer és a Sant Narcís, a 2 min d'aquí!`
    ],
    mapa_1_2: [
      `Vas be! ${count} segells! Ja ets mig gironí! A per la ruta secreta? Et falten ${3-count}...`,
      `Mmm ${count} segells... m'agrada! Si arribes a 3 et dic un lloc on només anem els locals de nit 😉`,
      `Bon ${hora}! Et queda poc per la sorpresa...`
    ],
    mapa_3_plus: [
      `BOOM! ${count} segells! Ja tens la RUTA SECRETA desbloquejada! Mira el mapa, icona 🗝️! Aquesta només la sé jo!`,
      `Ets VIP! Ja ets firastaire de veritat! La ruta de nit és la millor, xurros + barraques + Lleona de nit!`,
      `Mare meva ${count}! Ja pots fer el tour de nit! 23h Barraques i digues que t'envia Laia!`
    ],
    mapa_6: [
      `HAS ACABAT! 6 de 6! Ets LLEGENDA de Fires! Et faré un diploma de mosca honorífica! 🪰🏆`,
      `No m'ho crec! Tot complet! Ara ja pots explicar tu les llegendes als guiris!`
    ]
  };

  let key = 'mapa_0';
  if (count === 0) key = 'mapa_0';
  else if (count >= 6) key = 'mapa_6';
  else if (count >= 3) key = 'mapa_3_plus';
  else key = 'mapa_1_2';

  if (context === 'capitol' && data) {
    return { emoji: data.laia?.emoji || '🪰', text: data.laia?.frase, tip: data.laia?.tip };
  }

  const pool = dialogues[key];
  // Algoritme anti-repetició
  let frase;
  let tries = 0;
  do {
    frase = pool[Math.floor(Math.random() * pool.length)];
    tries++;
  } while (laiaHistory.includes(frase) && tries < 5 && pool.length > 1);
  
  laiaHistory.push(frase);
  if (laiaHistory.length > 10) laiaHistory.shift();
  localStorage.setItem('laia_history', JSON.stringify(laiaHistory));

  return { emoji: count >=3 ? '🗝️' : '🪰', text: frase, tip: null };
}

// --- LOGICA MAPA ---
async function init() {
  try {
    const r = await fetch('data/capitols.json');
    capitols = await r.json();
  } catch (e) {
    document.getElementById('app').innerHTML = `Error capitols.json: ${e}`;
    return;
  }
  renderMapa();
}

function estaDesbloquejat(c) {
  if (c.desbloquejat) return true;
  if (c.tipus === 'llegenda' && visitats.includes(c.requereix)) return true;
  if (c.tipus === 'ruta_secreta' && visitats.length >= (c.requereix_comptador || 3)) return true;
  if (c.requereix && visitats.includes(c.requereix)) return true;
  return false;
}

function renderMapa() {
  const app = document.getElementById('app');
  let html = `<div class="contador">🗝️ Segells: ${visitats.length} / 6 | ${getHora().toUpperCase()}</div><div class="grid">`;
  
  capitols.forEach(c => {
    const desbloq = estaDesbloquejat(c);
    const icon = desbloq ? c.icona : '🔒';
    html += `
      <div class="card ${desbloq ? '' : 'bloquejat'}" onclick="${desbloq ? `obrirCapitol('${c.arxiu}')` : ''}">
        <div class="icon">${icon}</div>
        <div><b>${desbloq ? c.nom : '??? Bloquejat'}</b><br><small>${desbloq ? (c.descripcio||'') : (c.condicio_text||'')}</small></div>
      </div>`;
  });
  html += `</div><div id="laia-mapa"></div>`;
  app.innerHTML = html;

  const laia = getLaiaDialogue('mapa');
  document.getElementById('laia-mapa').innerHTML = `
    <div class="laia-bubble show">
      <img src="laia.png" onerror="this.style.display='none'; this.nextElementSibling.style.display='block'" class="laia-img">
      <div class="laia-avatar" style="display:none">${laia.emoji}</div>
      <div class="laia-text"><b>Laia · ${getHora()}</b><p>${laia.text}</p></div>
    </div>`;
}

async function obrirCapitol(arxiu) {
  try {
    const r = await fetch(`data/${arxiu}`);
    const d = await r.json();
    
    // Guardar segell
    if (d.tipus === 'capitol' && !visitats.includes(d.id)) {
      visitats.push(d.id);
      localStorage.setItem('fires_visitats', JSON.stringify(visitats));
    }

    const laia = getLaiaDialogue('capitol', d);

    document.getElementById('app').innerHTML = `
      <button onclick="renderMapa()" class="back">← Tornar al mapa</button>
      <div class="fitxa">
        <div class="header-fitxa">
          <div class="icona-gran">${d.icona}</div>
          <h2>${d.nom}</h2>
          <small>${d.ubicacio||''} · ${d.coords||''}</small>
        </div>
        ${d.imatge ? `<img src="${d.imatge}" class="foto-capitol" loading="lazy">` : ''}
        <p class="text-llarg">${d.text_llarg}</p>
        ${d.dada_curiosa ? `<div class="curiosa">💡 ${d.dada_curiosa}</div>` : ''}
        <div class="segell">${d.segell || 'Segell aconseguit!'}</div>
        <div style="margin-top:12px">
          <a href="https://maps.google.com/?q=${d.coords}" target="_blank" class="btn">📍 Anar-hi</a>
          <button onclick="parlar()" class="btn sec">🔊 Escoltar</button>
        </div>
      </div>
      <div id="laia-bubble" class="laia-bubble">
        <img src="laia.png" onerror="this.style.display='none'; this.nextElementSibling.style.display='block'" class="laia-img" style="width:48px;height:48px;border-radius:50%;object-fit:cover">
        <div class="laia-avatar" style="display:none;font-size:38px">${laia.emoji}</div>
        <div class="laia-text">
          <b>Laia</b>
          <p id="laia-frase">${laia.text}</p>
          ${laia.tip ? `<span class="laia-tip">💡 ${laia.tip}</span>` : ''}
          <small style="opacity:.5;display:block;margin-top:6px">Segells: ${visitats.length}/6 · ${getHora()}</small>
        </div>
      </div>
    `;
    setTimeout(() => document.getElementById('laia-bubble')?.classList.add('show'), 300);
    window.currentText = d.audio_text || d.text_llarg;

  } catch (e) {
    document.getElementById('app').innerHTML = `Error ${arxiu}: ${e} <br><button onclick="renderMapa()" class="back">← Tornar</button>`;
  }
}

function parlar() {
  if (!window.currentText) return;
  const u = new SpeechSynthesisUtterance(window.currentText);
  u.lang = 'ca-ES';
  u.rate = 1.1;
  speechSynthesis.speak(u);
}

init(); 
