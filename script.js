document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("configModal");
  const openBtn = document.getElementById("openConfig");

  const devices = [
  { id: "chkProyectores", label: "Proyectores", inputId: "consumoProyectores" },
  { id: "chkTelevisores", label: "Televisores", inputId: "consumoTelevisores" },
  { id: "chkPortatiles", label: "Portátiles", inputId: "consumoPortatiles" },
  { id: "chkComputadores", label: "Computadores de mesa", inputId: "consumoComputadores" },
  { id: "chkPantallas", label: "Pantallas OneScreen", inputId: "consumoPantallas" },
  { id: "chkRouter", label: "Router", inputId: "consumoRouter" },
  { id: "chkLuces", label: "Luces", inputId: "consumoLuces" },
];


  const modalContent = modal.querySelector(".modal-content");

  function buildModalContent() {
    modalContent.innerHTML = `
      <h2 id="modalTitle" class="modal-header">Configuración de Consumo</h2>
      <div class="modal-columns-container"></div>
      <button type="button" class="close-btn" id="closeConfig">Cerrar</button>
    `;

    const container = modalContent.querySelector(".modal-columns-container");

    // Crear las dos columnas
    const col1 = document.createElement("div");
    col1.classList.add("modal-column");

    const col2 = document.createElement("div");
    col2.classList.add("modal-column");

    // Campo KWH siempre visible
    const kwhField = document.createElement("div");
    kwhField.innerHTML = `
      <label for="kwhInput">Valor KWH</label>
      <input type="number" id="kwhInput" min="0" step="0.01" placeholder="Valor monetario de KWH" />
    `;
    col1.appendChild(kwhField);

    // Filtrar los dispositivos activos
    const activos = devices.filter(({ id }) => {
      const cb = document.getElementById(id);
      return cb && cb.checked;
    });

    // Repartir los campos: 3 en la primera columna, el resto en la segunda
    activos.forEach((dev, i) => {
      const field = document.createElement("div");
      field.innerHTML = `
        <label for="${dev.inputId}">Consumo ${dev.label} (Watts):</label>
        <input type="number" id="${dev.inputId}" min="0" placeholder="Consumo ${dev.label}" />
      `;
      if (i < 3) {
        col1.appendChild(field);
      } else {
        col2.appendChild(field);
      }
    });

    container.appendChild(col1);
    container.appendChild(col2);

    // Reasignar el evento de cerrar
    modalContent.querySelector("#closeConfig").addEventListener("click", () => {
      modal.style.display = "none";
    });
  }

  // Abrir modal y construir contenido
  openBtn.addEventListener("click", () => {
    buildModalContent();
    modal.style.display = "block";
  });

  // Cerrar al hacer clic fuera
  window.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });

  // --- Lógica existente de contadores ---
  function toggleCounter(switchId, counterId) {
    const sw = document.getElementById(switchId);
    const box = document.getElementById(counterId);
    if (sw && box) box.style.display = sw.checked ? "flex" : "none";
  }

  ["chkProyectores","chkTelevisores","chkPortatiles","chkComputadores","chkPantallas","chkRouter","chkLuces"].forEach((id) => {
  const counterId = "ctr" + id.replace("chk", "");
  const checkbox = document.getElementById(id);
  toggleCounter(id, counterId);
  if (checkbox) checkbox.addEventListener("change", () => toggleCounter(id, counterId));
});


  window.updateCount = function(id, delta) {
    const span = document.getElementById(id);
    let value = parseInt(span.textContent);
    span.textContent = Math.max(0, value + delta);
  };
});


// ---------- Enviar datos y abrir la página de simulación ----------
document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("startSim");

  // Lista de dispositivos (asegúrate de que coincida con tu devices)
  const devicesList = [
    { chkId: "chkProyectores", countId: "proyectores", label: "Proyectores", modalInputId: "consumoProyectores" },
    { chkId: "chkTelevisores", countId: "televisores", label: "Televisores", modalInputId: "consumoTelevisores" },
    { chkId: "chkPortatiles", countId: "portatiles", label: "Portátiles", modalInputId: "consumoPortatiles" },
    { chkId: "chkComputadores", countId: "computadores", label: "Computadores de mesa", modalInputId: "consumoComputadores" },
    { chkId: "chkPantallas", countId: "pantallas", label: "Pantallas OneScreen", modalInputId: "consumoPantallas" },
    { chkId: "chkRouter", countId: "router", label: "Router", modalInputId: "consumoRouter" },
    { chkId: "chkLuces", countId: "luces", label: "Luces", modalInputId: "consumoLuces" },
  ];

  startBtn.addEventListener("click", () => {
    // Obtener horas desde tu input principal (si no existe, 8 por defecto)
    const horasInput = document.querySelector(".input-box");
    const horas = horasInput ? Number(horasInput.value) || 8 : 8;

    // Obtener KWH y consumos desde los inputs del modal (si no están creados, usar 0)
    const kwhInput = document.getElementById("kwhInput");
    const kwhPrice = kwhInput ? Number(kwhInput.value) || 0 : 0;

    // Recopilar estado de dispositivos
    const devices = devicesList.map(dev => {
      const chk = document.getElementById(dev.chkId);
      const countSpan = document.getElementById(dev.countId);
      const cnt = countSpan ? parseInt(countSpan.textContent) || 0 : 0;
      const wattInput = document.getElementById(dev.modalInputId);
      const watts = wattInput ? Number(wattInput.value) || 0 : 0;
      return {
        id: dev.chkId,
        label: dev.label,
        active: !!(chk && chk.checked),
        count: cnt,
        watts: watts
      };
    });

    // Guardar todo en localStorage para que la nueva página lo lea
    const payload = {
      horas,
      kwhPrice,
      devices,
      generatedAt: new Date().toISOString()
    };
    localStorage.setItem("simulator_payload", JSON.stringify(payload));

    // Abrir la nueva página
    window.open("simulacion.html", "_blank");
  });
});
