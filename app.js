/* ============================================================
   BLACK CUTS · micro app de reservas
   JavaScript puro, sin librerías. Todo se configura aquí arriba.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- 1. CONFIGURACIÓN (edita aquí) ---------- */
  // Número de WhatsApp de la barbería: 591 + número, sin "+" ni espacios.
  const WHATSAPP = '59170000000';

  const SERVICIOS = [
    { id: 'clasico', nombre: 'Corte clásico', min: 30, precio: 35, nota: 'Tijera y máquina' },
    { id: 'moderno', nombre: 'Corte moderno', min: 45, precio: 45, nota: 'Fade, degradado o diseño' },
    { id: 'combo', nombre: 'Corte + barba', min: 60, precio: 60, nota: 'Con toalla caliente' },
    { id: 'barba', nombre: 'Perfilado de barba', min: 30, precio: 25, nota: 'Navaja y aceite' },
    { id: 'ninos', nombre: 'Corte niños', min: 30, precio: 30, nota: 'Hasta 12 años' },
    { id: 'cejas', nombre: 'Cejas y diseño', min: 30, precio: 15, nota: 'Rayitas o limpieza' }
  ];

  const BARBEROS = ['Rafa', 'Leo', 'Nico'];

  // Horario por día de la semana (0 = domingo). null = cerrado.
  const HORARIO = { 0: null, 1: [9, 20], 2: [9, 20], 3: [9, 20], 4: [9, 20], 5: [9, 20], 6: [9, 18] };
  const BLOQUE = 30; // minutos de cada bloque de la agenda
  const DIAS_A_MOSTRAR = 7;

  /* ---------- 2. UTILIDADES ---------- */
  const $ = (s) => document.querySelector(s);
  const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const hhmm = (min) => `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')}`;
  const fromYmd = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const labelDia = (s) => { const d = fromYmd(s); return `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}`; };

  // Número "aleatorio" pero siempre igual para el mismo texto.
  // Sirve para simular que algunas horas ya están ocupadas.
  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  // Guardado en el navegador (si el navegador lo bloquea, la app sigue funcionando)
  const KEY = 'blackcuts_reservas';
  let memoria = [];
  function leerReservas() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return memoria; }
  }
  function guardarReservas(lista) {
    memoria = lista;
    try { localStorage.setItem(KEY, JSON.stringify(lista)); } catch (e) { /* sin almacenamiento */ }
  }

  /* ---------- 3. DÍAS Y AGENDA ---------- */
  function proximosDias() {
    const out = [];
    const d = new Date();
    while (out.length < DIAS_A_MOSTRAR) {
      out.push(ymd(d));
      d.setDate(d.getDate() + 1);
    }
    return out;
  }

  // Reservas de ejemplo para que la agenda no se vea vacía
  function reservasEjemplo(fecha) {
    const h = HORARIO[fromYmd(fecha).getDay()];
    if (!h) return [];
    const nombres = ['Jorge', 'Marcelo', 'Diego', 'Luis', 'Andrés', 'Pablo', 'Iván', 'Sergio', 'Fabio', 'Óscar'];
    const lista = [];
    BARBEROS.forEach((b) => {
      let t = h[0] * 60;
      while (t < h[1] * 60) {
        const r = hash(fecha + b + t);
        const s = SERVICIOS[(r >>> 5) % SERVICIOS.length];
        if (r % 10 < 3 && t + s.min <= h[1] * 60) {
          lista.push({ fecha, barbero: b, inicio: t, servicio: s.id, nombre: nombres[(r >>> 11) % nombres.length], ejemplo: true });
          t += Math.ceil(s.min / BLOQUE) * BLOQUE;
        } else {
          t += BLOQUE;
        }
      }
    });
    return lista;
  }

  function reservasDelDia(fecha) {
    const mias = leerReservas().filter((r) => r.fecha === fecha);
    return reservasEjemplo(fecha).concat(mias);
  }

  const servicio = (id) => SERVICIOS.find((s) => s.id === id);

  // ¿Está libre el barbero desde "inicio" durante "min" minutos?
  function barberoLibre(fecha, barbero, inicio, min, ocupadas) {
    const fin = inicio + min;
    return !ocupadas.some((r) => {
      if (r.barbero !== barbero) return false;
      const rFin = r.inicio + Math.ceil(servicio(r.servicio).min / BLOQUE) * BLOQUE;
      return inicio < rFin && r.inicio < fin;
    });
  }

  /* ---------- 4. ESTADO DE LA RESERVA ---------- */
  const estado = { servicio: null, barbero: 'Cualquiera', fecha: null, inicio: null, asignado: null };

  function chip(html, pressed, onClick, disabled) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.innerHTML = html;
    b.setAttribute('aria-pressed', pressed ? 'true' : 'false');
    if (disabled) b.disabled = true;
    b.addEventListener('click', onClick);
    return b;
  }

  function pintarServicios() {
    const box = $('#pick-service');
    box.innerHTML = '';
    SERVICIOS.forEach((s) => {
      box.appendChild(chip(`${s.nombre}<small>Bs ${s.precio} · ${s.min} min</small>`, estado.servicio === s.id, () => {
        estado.servicio = s.id; estado.inicio = null; render();
      }));
    });
  }

  function pintarBarberos() {
    const box = $('#pick-barber');
    box.innerHTML = '';
    ['Cualquiera'].concat(BARBEROS).forEach((b) => {
      const nota = b === 'Cualquiera' ? 'El primero libre' : 'Barbero';
      box.appendChild(chip(`${b}<small>${nota}</small>`, estado.barbero === b, () => {
        estado.barbero = b; estado.inicio = null; render();
      }));
    });
  }

  function pintarDias(boxSel, elegido, alElegir) {
    const box = $(boxSel);
    box.innerHTML = '';
    proximosDias().forEach((f, i) => {
      const d = fromYmd(f);
      const cerrado = !HORARIO[d.getDay()];
      const top = i === 0 ? 'Hoy' : DIAS[d.getDay()];
      box.appendChild(chip(`<small>${top}</small><strong>${d.getDate()}</strong><small>${cerrado ? 'Cerrado' : MESES[d.getMonth()]}</small>`,
        elegido === f, () => alElegir(f), cerrado));
    });
  }

  function pintarHoras() {
    const box = $('#pick-time');
    box.innerHTML = '';
    if (!estado.servicio || !estado.fecha) {
      box.innerHTML = '<p class="hint">Primero elige servicio y día.</p>';
      return;
    }
    const s = servicio(estado.servicio);
    const [abre, cierra] = HORARIO[fromYmd(estado.fecha).getDay()];
    const ocupadas = reservasDelDia(estado.fecha);
    const ahora = new Date();
    const esHoy = estado.fecha === ymd(ahora);
    const minAhora = ahora.getHours() * 60 + ahora.getMinutes();
    const candidatos = estado.barbero === 'Cualquiera' ? BARBEROS : [estado.barbero];
    let libres = 0;

    for (let t = abre * 60; t + s.min <= cierra * 60; t += BLOQUE) {
      const pasada = esHoy && t <= minAhora + 15;
      const quien = candidatos.find((b) => barberoLibre(estado.fecha, b, t, s.min, ocupadas));
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'slot';
      btn.textContent = hhmm(t);
      btn.setAttribute('aria-pressed', estado.inicio === t ? 'true' : 'false');
      if (pasada || !quien) {
        btn.disabled = true;
        btn.setAttribute('aria-label', `${hhmm(t)} ocupado`);
      } else {
        libres++;
        btn.addEventListener('click', () => { estado.inicio = t; estado.asignado = quien; render(); });
      }
      box.appendChild(btn);
    }
    if (!libres) {
      const p = document.createElement('p');
      p.className = 'hint';
      p.textContent = 'No quedan horas libres este día. Prueba otro día u otro barbero.';
      box.prepend(p);
    }
  }

  function pintarTicket() {
    const s = estado.servicio && servicio(estado.servicio);
    $('#t-service').textContent = s ? s.nombre : '—';
    $('#t-barber').textContent = estado.inicio !== null ? estado.asignado : estado.barbero;
    $('#t-day').textContent = estado.fecha ? labelDia(estado.fecha) : '—';
    $('#t-time').textContent = estado.inicio !== null ? hhmm(estado.inicio) : '—';
    $('#t-name').textContent = $('#client-name').value.trim() || '—';
    $('#t-total').textContent = `Bs ${s ? s.precio : 0}`;
  }

  function render() {
    pintarServicios();
    pintarBarberos();
    pintarDias('#pick-day', estado.fecha, (f) => { estado.fecha = f; estado.inicio = null; render(); });
    pintarHoras();
    pintarTicket();
  }

  /* ---------- 5. CONFIRMAR ---------- */
  function confirmar(e) {
    e.preventDefault();
    const nombre = $('#client-name').value.trim();
    const cel = $('#client-phone').value.replace(/\D/g, '');
    const err = $('#form-error');
    let msg = '';
    if (!estado.servicio) msg = 'Elige un servicio.';
    else if (!estado.fecha) msg = 'Elige el día.';
    else if (estado.inicio === null) msg = 'Elige una hora libre.';
    else if (nombre.length < 2) msg = 'Escribe tu nombre.';
    else if (!/^[67]\d{7}$/.test(cel)) msg = 'Escribe un celular de 8 dígitos que empiece con 6 o 7.';
    err.textContent = msg;
    if (msg) return;

    const s = servicio(estado.servicio);
    const numero = String(hash(estado.fecha + estado.inicio + nombre) % 9000 + 1000);
    const reserva = { fecha: estado.fecha, barbero: estado.asignado, inicio: estado.inicio, servicio: s.id, nombre, cel, numero };
    guardarReservas(leerReservas().concat(reserva));

    $('#t-no').textContent = `Turno N.º ${numero}`;
    $('#t-barber').textContent = estado.asignado;
    $('#t-name').textContent = nombre;
    $('#ticket').classList.add('is-booked');
    $('#t-foot').textContent = 'Listo. Envíanos el turno por WhatsApp para confirmarlo.';

    const texto = `Hola BLACK CUTS, reservé un turno:\n` +
      `• Turno N.º ${numero}\n• ${s.nombre} (Bs ${s.precio})\n• Barbero: ${estado.asignado}\n` +
      `• ${labelDia(estado.fecha)} a las ${hhmm(estado.inicio)}\n• A nombre de ${nombre}, cel. ${cel}`;
    $('#wa-confirm').href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`;
    $('#ticket-actions').hidden = false;
    $('#confirm-btn').disabled = true;

    agenda.fecha = estado.fecha;
    pintarAgenda();
    $('#ticket').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function nuevaReserva() {
    Object.assign(estado, { servicio: null, barbero: 'Cualquiera', fecha: null, inicio: null, asignado: null });
    $('#client-name').value = '';
    $('#client-phone').value = '';
    $('#form-error').textContent = '';
    $('#ticket').classList.remove('is-booked');
    $('#t-no').textContent = 'Turno N.º ----';
    $('#t-foot').textContent = 'Llega 5 minutos antes. Si no puedes venir, avísanos.';
    $('#ticket-actions').hidden = true;
    $('#confirm-btn').disabled = false;
    render();
    $('#reservar').scrollIntoView({ behavior: 'smooth' });
  }

  /* ---------- 6. AGENDA DEL BARBERO ---------- */
  const agenda = { fecha: null };

  function pintarAgenda() {
    pintarDias('#agenda-day', agenda.fecha, (f) => { agenda.fecha = f; pintarAgenda(); });
    const lista = reservasDelDia(agenda.fecha).sort((a, b) => a.inicio - b.inicio);
    const ingreso = lista.reduce((sum, r) => sum + servicio(r.servicio).precio, 0);

    const ahora = new Date();
    const minAhora = ahora.getHours() * 60 + ahora.getMinutes();
    const prox = agenda.fecha === ymd(ahora) ? lista.find((r) => r.inicio >= minAhora) : lista[0];

    $('#a-count').textContent = lista.length;
    $('#a-income').textContent = `Bs ${ingreso}`;
    $('#a-next').textContent = prox ? hhmm(prox.inicio) : '—';

    const cols = $('#agenda-cols');
    cols.innerHTML = '';
    BARBEROS.forEach((b) => {
      const suyas = lista.filter((r) => r.barbero === b);
      const col = document.createElement('div');
      col.className = 'col';
      const items = suyas.map((r) => {
        const s = servicio(r.servicio);
        return `<li class="${r.ejemplo ? '' : 'mine'}"><time>${hhmm(r.inicio)}</time><div>${r.nombre}<small>${s.nombre} · Bs ${s.precio}</small></div></li>`;
      }).join('');
      col.innerHTML = `<h3>${b}<span>${suyas.length} turnos</span></h3>` +
        (items ? `<ul>${items}</ul>` : '<span class="empty">Sin turnos este día.</span>');
      cols.appendChild(col);
    });
  }

  /* ---------- 7. PIZARRA Y "ABIERTO AHORA" ---------- */
  function pintarPizarra() {
    $('#board').innerHTML = SERVICIOS.map((s) =>
      `<li><span class="name">${s.nombre}<small>${s.nota} · ${s.min} min</small></span><span class="leader"></span><span class="price">Bs ${s.precio}</span></li>`
    ).join('');
  }

  function estadoAbierto() {
    const ahora = new Date();
    const h = HORARIO[ahora.getDay()];
    const min = ahora.getHours() * 60 + ahora.getMinutes();
    const el = $('#open-status');
    if (h && min >= h[0] * 60 && min < h[1] * 60) {
      el.className = 'status open';
      el.innerHTML = `<span class="dot"></span>Abierto ahora, hasta las ${h[1]}:00`;
    } else {
      // Buscar el próximo día que abre
      let d = new Date(ahora);
      let abreHoyMasTarde = h && min < h[0] * 60;
      if (!abreHoyMasTarde) {
        do { d.setDate(d.getDate() + 1); } while (!HORARIO[d.getDay()]);
      }
      const cuando = abreHoyMasTarde ? 'hoy' : (ymd(d) === ymd(new Date(ahora.getTime() + 864e5)) ? 'mañana' : DIAS[d.getDay()].toLowerCase());
      el.className = 'status closed';
      el.innerHTML = `<span class="dot"></span>Cerrado. Abrimos ${cuando} a las ${HORARIO[d.getDay()][0]}:00`;
    }
    // Resaltar el día de hoy en la tabla de horario
    const filas = document.querySelectorAll('#hours-table tr');
    const idx = ahora.getDay() === 0 ? 2 : ahora.getDay() === 6 ? 1 : 0;
    if (filas[idx]) filas[idx].classList.add('today');
  }

  /* ---------- 8. ARRANQUE ---------- */
  function primerDiaAbierto() {
    return proximosDias().find((f) => HORARIO[fromYmd(f).getDay()]);
  }

  $('#booking-form').addEventListener('submit', confirmar);
  $('#client-name').addEventListener('input', pintarTicket);
  $('#new-booking').addEventListener('click', nuevaReserva);

  agenda.fecha = primerDiaAbierto();
  pintarPizarra();
  estadoAbierto();
  render();
  pintarAgenda();
})();
