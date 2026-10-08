// FIRES SANT NARCÍS - Laia Miss Minutes v2.1 - Cervell Algorítmic Net
let capitols = [];
let visitats = JSON.parse(localStorage.getItem('fires_visitats') || '[]');
let laiaHistory = JSON.parse(localStorage.getItem('laia_history') || '[]');

function getHora() {
  const h = new Date().getHours();
  if (h < 12) return 'matí';
  if (h < 19) return 'tarda';
  return 'nit';
}

function getLaiaDialogue(context, data = null) {
  const hora = getHora();
  const count = visitats.length;

  // Si estem dins un capítol, usa la frase del JSON
  if (context === 'capitol' && data && data.laia) {
    return {
      emoji: data.laia.emoji || '🪰',
      text: data.laia.frase,
      tip: data.laia.tip || null
    };
  }

  const frases = {
    mapa_0: [
      `Bon ${hora}! Soc Laia! La teva Miss Minutes gironina! Comencem per les Mosques del 1285?`,
      `Eeei! Primer cop? Jo soc Laia, mosca oficial de Girona. Vine, t'ensenyo on vam matar 20.000 francesos 😏`,
      `Hola hola! Tens 0 segells. El primer és a Sant Narcís, a 2 min d'aquí!`
    ],
    mapa_1_2: [
      `Vas bé! ${count} segells! Et falten ${3 - count} per la ruta secreta...`,
      `Mmm ${count} segells... m'agrada! Si arribes a 3 et dic un lloc només de locals 😉`,
      `Bon ${hora}! Et queda poc per la sorpresa de nit...`
    ],
    mapa_3_plus: [
      `BOOM! ${count} segells! Ja tens la RUTA SECRETA desbloquejada! Mira la icona 🗝️!`,
      `Ets VIP! Ja ets firastaire de veritat! La ruta de nit és xurros + barraques + Lleona sense cua!`
    ],
    mapa_6: [
      `HAS ACABAT! 6 de 6! Ets LLEGENDA de Fires! Et faig diploma de mosca honorífica! 🪰🏆`,
      `No m'ho crec! Tot complet! Ara pots explicar tu les llegendes als guiris!`
    ]
  };

  let key = 'mapa_0';
  if (count === 0) key = 'mapa_0';
  else if (count >= 6) key = 'mapa_6';
  else if (count >= 3) key = 'mapa_3_plus';
  else key = 'mapa_1_2';

  const pool = frases[key];
  let frase;
  let intents = 0;
  do {
    frase = pool[Math.floor(Math.random() * pool.length)];
    intents++;
  } while (laiaHistory.includes(frase) && intents < 5 && pool.length > 1);

  laiaHistory.push(frase);
  if (laiaHistory.length > 10) laiaHistory.shift();
  localStorage.setItem('laia_history', JSON.stringify(laiaHistory));

  return { emoji: count >= 3? '🗝️' : '🪰', text: frase, tip: null };
}

async function init() {
  try {
    const r = await fetch('data/capitols.json');
    if (!r.ok) throw new Error('No trobo capitols.json');
    capitols = await r.json();
    renderMapa();
  } catch (e) {
    document.getElementById('app').innerHTML = `<b>Error carregant mapa:</b> ${e}<br>Revisa que data/capitols.json existeix`;
  }
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
    html += `
      <div class="card ${desbloq? '' : 'bloquejat'}" onclick="${desbloq? `obrirCapitol('${c.arxiu}')` : ''}">
        <div class="icon">${desbloq? c.icona : '🔒'}</div>
        <div><b>${desbloq? c.nom : 'Bloquejat'}</b><br><small>${desbloq? (c.descripcio||'') : (c.condicio_text||'')}</small></div>
      </div>`;
  });

  html += `</div><div id="laia-mapa"></div>`;
  app.innerHTML = html;

  const laia = getLaiaDialogue('mapa');
  document.getElementById('laia-mapa').innerHTML = `
    <div class="laia-bubble show">
      <img src="laia.png" class="laia-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='block'">
      <div class="laia-avatar" style="display:none">${laia.emoji}</div>
      <div class="laia-text"><b>Laia · ${getHora()}</b><p>${laia.text}</p></div>
    </div>`;
}

async function obrirCapitol(arxiu) {
  try {
    const r = await fetch(`data/${arxiu}`);
    const d = await r.json();

    if (d.tipus === 'capitol' &&!visitats.includes(d.id)) {
      visitats.push(d.id);
      localStorage.setItem('fires_visitats', JSON.stringify(visitats));
    }

    const laia = getLaiaDialogue('capitol', d);

    document.getElementById('app').innerHTML = `
      <button onclick="renderMapa()" class="back">← Tornar al mapa</button>
      <div class="fitxa">
        <div class="icona-gran">${d.icona}</div>
        <h2>${d.nom}</h2>
        <small>${d.ubicacio || ''}</small>
        ${d.imatge? `<img src="${d.imatge}" class="foto-capitol">` : ''}
        <p class="text-llarg">${d.text_llarg}</p>
        ${d.dada_curiosa? `<div class="curiosa">💡 ${d.dada_curiosa}</div>` : ''}
        <div class="segell">${d.segell || 'Segell!'}</div>
        <div style="margin-top:12px">
          <a href="https://maps.google.com/?q=${d.coords}" target="_blank" class="btn">📍 Anar-hi</a>
          <button onclick="speechSynthesis.speak(new SpeechSynthesisUtterance(window.currentText))" class="btn sec">🔊</button>
        </div>
      </div>
      <div id="laia-bubble" class="laia-bubble">
        <img src="laia.png" class="laia-img" onerror="this.style.display='none'">
        <div class="laia-text">
          <b>Laia</b><p>${laia.text}</p>
          ${laia.tip? `<span class="laia-tip">💡 ${laia.tip}</span>` : ''}
        </div>
      </div>
    `;
    window.currentText = d.audio_text || d.text_llarg;
    setTimeout(() => document.getElementById('laia-bubble')?.classList.add('show'), 200);

  } catch (e) {
    document.getElementById('app').innerHTML = `Error carregant ${arxiu}: ${e}<br><button onclick="renderMapa()" class="back">← Tornar</button>`;
  }
}

init();