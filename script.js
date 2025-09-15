
const ITEMS = [
  { id:'arroz', nombre:'Arroz (250 g)', precio:1.2, kcal:900, prote:18, fv:0, perecedero:false, categoria:'cereales' },
  { id:'frijol', nombre:'Fríjol (200 g)', precio:1.4, kcal:620, prote:42, fv:0, perecedero:false, categoria:'legumbres' },
  { id:'huevos', nombre:'Huevos (6 und)', precio:2.4, kcal:420, prote:36, fv:0, perecedero:true, categoria:'proteína' },
  { id:'leche', nombre:'Leche (1 L)', precio:1.1, kcal:640, prote:32, fv:0, perecedero:true, categoria:'lácteos' },
  { id:'pollo', nombre:'Pollo (300 g)', precio:3.2, kcal:480, prote:66, fv:0, perecedero:true, categoria:'proteína' },
  { id:'manzana', nombre:'Manzana (4 und)', precio:1.8, kcal:380, prote:2, fv:4, perecedero:true, categoria:'fruta' },
  { id:'banano', nombre:'Banano (6 und)', precio:1.5, kcal:540, prote:6, fv:6, perecedero:true, categoria:'fruta' },
  { id:'zanahoria', nombre:'Zanahoria (600 g)', precio:1.2, kcal:240, prote:4, fv:6, perecedero:true, categoria:'verdura' },
  { id:'tomate', nombre:'Tomate (600 g)', precio:1.4, kcal:120, prote:6, fv:6, perecedero:true, categoria:'verdura' },
  { id:'aceite', nombre:'Aceite (250 ml)', precio:1.6, kcal:2000, prote:0, fv:0, perecedero:false, categoria:'grasa' },
  { id:'avena', nombre:'Avena (300 g)', precio:1.3, kcal:1140, prote:39, fv:0, perecedero:false, categoria:'cereales' },
  { id:'lenteja', nombre:'Lenteja (250 g)', precio:1.2, kcal:840, prote:57, fv:0, perecedero:false, categoria:'legumbres' }
];

// Metas diarias por persona
const GOALS = { kcalDia: 2000, proteDia: 50, fvDia: 5 };

// Estado
const state = {
  presupuesto: 60, // semanal, hogar
  personas: 1,
  carrito: new Map() // id -> cantidad (enteros)
};

// Utilidades
const fmtDin = n => '$' + n.toFixed(2);
const clamp = (n,a,b)=> Math.max(a, Math.min(b, n));

// Referencias DOM
const $cat = document.getElementById('catalogo');
const $drop = document.getElementById('drop');
const $pres = document.getElementById('presupuesto');
const $presOut = document.getElementById('presupuestoOut');
const $personas = document.getElementById('personas');
const $kCosto = document.getElementById('kCosto');
const $kCal = document.getElementById('kCal');
const $kProt = document.getElementById('kProt');
const $kFV = document.getElementById('kFV');
const $bar = document.getElementById('gastoBar');
const $toast = document.getElementById('toast');

function toast(msg){ $toast.textContent = msg; $toast.classList.add('show'); setTimeout(()=> $toast.classList.remove('show'), 1800); }

// Render catálogo
$cat.innerHTML = ITEMS.map(it=>`
  <article class="card" draggable="true" data-id="${it.id}" aria-grabbed="false" aria-label="${it.nombre}">
    <h3>${it.nombre}</h3>
    <div class="meta">${it.categoria} • <span class="precio">${fmtDin(it.precio)}</span></div>
    <div class="chips">
      <span class="chip">${it.kcal} kcal</span>
      <span class="chip">${it.prote} g proteína</span>
      <span class="chip">${it.fv} porciones F/V</span>
      ${it.perecedero ? '<span class="chip">perecedero</span>' : '<span class="chip">no perecedero</span>'}
    </div>
    <button class="add" data-id="${it.id}">Añadir</button>
  </article>
`).join('');

// Drag & Drop eventos
$cat.querySelectorAll('[draggable]')
  .forEach(el=>{
    el.addEventListener('dragstart', e=>{
      e.dataTransfer.setData('text/plain', el.dataset.id);
      el.style.opacity=.6; el.setAttribute('aria-grabbed','true');
    });
    el.addEventListener('dragend', ()=>{ el.style.opacity=1; el.setAttribute('aria-grabbed','false');});
  });

// Añadir botón
$cat.addEventListener('click', e=>{
  const btn = e.target.closest('.add');
  if(!btn) return;
  agregar(btn.dataset.id, 1);
});

// Zona de compra
$drop.addEventListener('dragover', e=>{ e.preventDefault(); $drop.classList.remove('empty');});
$drop.addEventListener('drop', e=>{
  e.preventDefault();
  const id = e.dataTransfer.getData('text/plain');
  if(id) agregar(id,1);
});
$drop.addEventListener('keydown', e=>{ if(e.key==='Enter'){ agregar(ITEMS[0].id,1); } });

// Presupuesto y personas
$pres.addEventListener('input', ()=>{ state.presupuesto = Number($pres.value); $presOut.textContent = fmtDin(state.presupuesto); actualizar(); });
$presOut.textContent = fmtDin(state.presupuesto);
$personas.addEventListener('change', ()=>{ state.personas = Number($personas.value); actualizar(); });

function agregar(id, qty){
  const it = ITEMS.find(x=>x.id===id);
  if(!it) return;
  const cur = state.carrito.get(id) || 0;
  state.carrito.set(id, clamp(cur + qty, 0, 999));
  if(state.carrito.get(id)===0) state.carrito.delete(id);
  actualizar();
  toast(`${it.nombre} x${state.carrito.get(id)||0}`);
}

function lineaHTML(id, qty){
  const it = ITEMS.find(x=>x.id===id);
  const total = it.precio * qty;
  return `
    <div class="linea" role="listitem">
      <div>
        <div style="font-weight:600">${it.nombre}</div>
        <div class="meta">${it.categoria} • ${fmtDin(it.precio)} c/u</div>
      </div>
      <div class="qty">
        <button aria-label="Quitar uno" data-act="-" data-id="${id}">−</button>
        <input aria-label="Cantidad" inputmode="numeric" pattern="[0-9]*" value="${qty}" data-id="${id}" />
        <button aria-label="Agregar uno" data-act="+" data-id="${id}">+</button>
      </div>
      <div style="text-align:right; font-weight:700">${fmtDin(total)}</div>
      <button aria-label="Eliminar" data-act="x" data-id="${id}">✕</button>
    </div>`;
}

function calcular(){
  // Totales semanales del HOGAR
  let costo=0, kcal=0, prote=0, fv=0, perecederos=0;
  state.carrito.forEach((qty,id)=>{
    const it = ITEMS.find(x=>x.id===id);
    costo += it.precio*qty;
    kcal += it.kcal*qty;
    prote += it.prote*qty;
    fv += it.fv*qty;
    if(it.perecedero) perecederos += qty;
  });

  // Promedios diarios POR PERSONA
  const personas = Math.max(1, state.personas);
  const kcalDiaPP = (kcal / 7) / personas;
  const proteDiaPP = (prote / 7) / personas;
  const fvDiaPP = (fv / 7) / personas;

  // Desperdicio estimado (escala con personas):
  // Umbral simple: 3 porciones perecederas por persona por día → 21 por persona por semana
  const umbralPerecederos = 21 * personas;
  const desperdicio = Math.max(0, perecederos - umbralPerecederos);

  return { costo, kcalDiaPP, proteDiaPP, fvDiaPP, desperdicio };
}

function actualizar(){
  // Render líneas del carrito
  if(state.carrito.size===0){
    $drop.classList.add('empty');
    $drop.innerHTML = 'Suelta aquí tus alimentos';
  } else {
    $drop.classList.remove('empty');
    $drop.innerHTML = Array.from(state.carrito, ([id,qty])=> lineaHTML(id,qty)).join('');
  }


  // Listeners de línea
  $drop.querySelectorAll('button').forEach(b=>{
    b.addEventListener('click', ()=>{
      const id = b.dataset.id; const act = b.dataset.act;
      if(act==='+') agregar(id,1);
      else if(act==='-') agregar(id,-1);
      else if(act==='x'){ state.carrito.delete(id); actualizar(); }
    });
  });
  $drop.querySelectorAll('input').forEach(inp=>{
    inp.addEventListener('input', ()=>{
      const v = parseInt(inp.value.replace(/\D/g,''))||0;
      state.carrito.set(inp.dataset.id, clamp(v,0,999));
      if(v===0) state.carrito.delete(inp.dataset.id);
      actualizar();
    });
  });

  const {costo,kcalDiaPP,proteDiaPP,fvDiaPP,desperdicio} = calcular();
  $kCosto.textContent = fmtDin(costo);
  $kCal.innerHTML = `${Math.round(kcalDiaPP)} kcal <span id="calStat"></span>`;
  $kProt.innerHTML = `${Math.round(proteDiaPP)} g <span id="protStat"></span>`;
  $kFV.innerHTML = `${Math.round(fvDiaPP)} porciones <span id="fvStat"></span>`;

  // Presupuesto bar (no se escala: es del hogar)
  const pct = clamp((costo/state.presupuesto)*100,0,100);
  $bar.style.width = pct + '%';
  if(costo <= state.presupuesto*0.9) $bar.style.background = 'linear-gradient(90deg, #6ee7b7, #93c5fd)';
  else if (costo <= state.presupuesto) $bar.style.background = 'linear-gradient(90deg, #fbbf24, #93c5fd)';
  else $bar.style.background = 'linear-gradient(90deg, #ef4444, #f87171)';

  // Badges de estado vs metas (por persona)
  function badge(elemId, ok){ const el = document.getElementById(elemId); el.className = ok? 'ok' : 'bad'; el.textContent = ok ? '✔' : '✖'; }
  badge('calStat', kcalDiaPP >= GOALS.kcalDia);
  badge('protStat', proteDiaPP >= GOALS.proteDia);
  badge('fvStat', fvDiaPP >= GOALS.fvDia);

  // Persistencia simple
  try{
    localStorage.setItem('canasta', JSON.stringify(Array.from(state.carrito.entries())));
    localStorage.setItem('personas', String(state.personas));
    localStorage.setItem('presupuesto', String(state.presupuesto));
  }catch(e){}
}

// Evaluación
const $evaluar = document.getElementById('evaluar');
$evaluar.addEventListener('click', ()=>{
  const {costo,kcalDiaPP,proteDiaPP,fvDiaPP,desperdicio} = calcular();
  const bajoPresupuesto = costo <= state.presupuesto;
  const metas = [
    {ok:kcalDiaPP>=GOALS.kcalDia, txt:`Calorías por persona: ${Math.round(kcalDiaPP)} / ${GOALS.kcalDia} kcal`},
    {ok:proteDiaPP>=GOALS.proteDia, txt:`Proteína por persona: ${Math.round(proteDiaPP)} g / ${GOALS.proteDia} g`},
    {ok:fvDiaPP>=GOALS.fvDia, txt:`Fruta/Verdura por persona: ${Math.round(fvDiaPP)} / ${GOALS.fvDia} porciones`},
    {ok:bajoPresupuesto, txt:`Presupuesto del hogar: ${fmtDin(costo)} / ${fmtDin(state.presupuesto)}`},
    {ok:desperdicio===0, txt:`Desperdicio estimado (semanal, hogar): ${desperdicio} porciones perecederas`}
  ];
  const okCount = metas.filter(m=>m.ok).length;
  let mensaje = '';
  if(okCount===metas.length){ mensaje = '¡Excelente! La canasta del hogar es suficiente, equilibrada y sin desperdicio.'; }
  else if(okCount>=3){ mensaje = 'Vas bien. Ajusta pequeñas cosas (más F/V o proteína, o reduce perecederos).'; }
  else if(okCount>=2){ mensaje = 'Aún no es suficiente. Revisa presupuesto y metas nutricionales por persona.'; }
  else { mensaje = 'Necesita cambios importantes para garantizar suficiencia por persona.'; }
  alert(mensaje + '\n\n' + metas.map(m=> (m.ok?'✔ ':'✖ ') + m.txt).join('\n'));
});

document.getElementById('reset').addEventListener('click', ()=>{ state.carrito.clear(); actualizar(); });

// Cargar estado previo
try{
  const saved = JSON.parse(localStorage.getItem('canasta')||'null');
  if(saved && Array.isArray(saved)) saved.forEach(([id,qty])=> state.carrito.set(id,qty));
  const p = parseInt(localStorage.getItem('personas')||'1');
  if(p && p>0){ state.personas = p; document.getElementById('personas').value = String(p); }
  const pres = parseFloat(localStorage.getItem('presupuesto')||'60');
  if(pres){ state.presupuesto = pres; document.getElementById('presupuesto').value = String(pres); document.getElementById('presupuestoOut').textContent = fmtDin(pres); }
}catch(e){}

