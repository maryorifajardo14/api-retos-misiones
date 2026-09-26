const API_BASE = '/api';

const listaMisionesEl = document.getElementById('lista-misiones');
const tableroEl = document.getElementById('tablero');
const formEl = document.getElementById('form-registro');
const mensajeEl = document.getElementById('mensaje-form');

let catalogoMisiones = [];

async function cargarCatalogo() {
  const res = await fetch(`${API_BASE}/misiones`);
  catalogoMisiones = await res.json();

  listaMisionesEl.innerHTML = catalogoMisiones
    .map(
      (m) => `
      <label class="mision-item">
        <input type="checkbox" name="mision" value="${m.MisionID}" />
        <span>
          <span class="titulo">${m.Nombre}</span><br/>
          <span class="descripcion">${m.Descripcion || ''}</span>
        </span>
      </label>
    `
    )
    .join('');
}

async function cargarEstudiantes() {
  tableroEl.textContent = 'Cargando estudiantes...';
  const res = await fetch(`${API_BASE}/estudiantes`);
  const estudiantes = await res.json();

  if (!Array.isArray(estudiantes) || estudiantes.length === 0) {
    tableroEl.textContent = 'Aún no hay estudiantes registrados.';
    return;
  }

  tableroEl.innerHTML = estudiantes
    .map((e) => {
      const total = e.totalMisiones || 0;
      const completadas = e.completadas || 0;
      const porcentaje = total ? Math.round((completadas / total) * 100) : 0;

      const chips = e.misiones
        .map(
          (m) => `<span class="chip ${m.estado ? 'completa' : 'pendiente'}">${m.nombre}: ${m.estado ? 'Completa' : 'Pendiente'}</span>`
        )
        .join('');

      return `
        <article class="estudiante">
          <div class="estudiante-header">
            <div class="info">
              <strong>${e.nombre}</strong>
              <span>${e.carnet} · ${e.correo}</span>
            </div>
            <div class="progreso">${completadas}/${total} misiones</div>
          </div>
          <div class="barra"><div class="barra-fill" style="width:${porcentaje}%"></div></div>
          <div class="misiones-lista">${chips || '<span class="descripcion">Sin misiones registradas</span>'}</div>
        </article>
      `;
    })
    .join('');
}

formEl.addEventListener('submit', async (evt) => {
  evt.preventDefault();
  mensajeEl.textContent = '';
  mensajeEl.className = 'mensaje';

  const carnet = document.getElementById('carnet').value.trim();
  const nombre = document.getElementById('nombre').value.trim();
  const correo = document.getElementById('correo').value.trim();

  const detalle = [...listaMisionesEl.querySelectorAll('input[name="mision"]')].map((chk) => ({
    misionId: Number(chk.value),
    estado: chk.checked
  }));

  const payload = { maestro: { carnet, nombre, correo }, detalle };

  try {
    const res = await fetch(`${API_BASE}/registro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'No se pudo procesar el registro.');
    }

    mensajeEl.textContent = 'Registro guardado correctamente.';
    mensajeEl.classList.add('ok');
    await cargarEstudiantes();
  } catch (err) {
    mensajeEl.textContent = err.message;
    mensajeEl.classList.add('error');
  }
});

document.getElementById('btn-refrescar').addEventListener('click', cargarEstudiantes);

cargarCatalogo();
cargarEstudiantes();
