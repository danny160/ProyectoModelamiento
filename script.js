// script.js — versión ajustada: el modal solo muestra los dispositivos activos, pero mantiene el flujo anterior
document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("configModal");
  const openBtn = document.getElementById("openConfig");

  // Valores por defecto (realistas)
  const defaultValues = {
    kwhPrice: 500,
    consumoProyectores: 300,
    consumoTelevisores: 120,
    consumoPortatiles: 60,
    consumoComputadores: 200,
    consumoPantallas: 150,
    consumoRouter: 15,
    consumoLuces: 15
  };

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

  function getSavedConfig() {
    try {
      const raw = localStorage.getItem("config_consumo");
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.warn("config_consumo parse error:", e);
      return null;
    }
  }

  function buildModalContent() {
    const saved = getSavedConfig() || defaultValues;

    modalContent.innerHTML = `
      <h2 id="modalTitle" class="modal-header">Configuración de Consumo</h2>
      <div class="modal-columns-container"></div>
      <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:12px;">
        <button type="button" class="save-btn" id="saveConfig">Guardar</button>
        <button type="button" class="close-btn" id="closeConfig">Cerrar</button>
      </div>
    `;

    const container = modalContent.querySelector(".modal-columns-container");
    const col1 = document.createElement("div");
    col1.classList.add("modal-column");
    const col2 = document.createElement("div");
    col2.classList.add("modal-column");

    // Campo KWH (siempre visible)
    const kwhField = document.createElement("div");
    kwhField.innerHTML = `
      <label for="kwhInput">Valor KWH (COP)</label>
      <input type="number" id="kwhInput" min="0" step="0.01"
        placeholder="Valor monetario de KWH"
        value="${saved.kwhPrice ?? defaultValues.kwhPrice}" />
    `;
    col1.appendChild(kwhField);

    // Mostrar inputs SOLO para dispositivos activos
    const activeDevices = devices.filter(dev => {
      const chk = document.getElementById(dev.id);
      return chk && chk.checked;
    });

    if (activeDevices.length === 0) {
      const msg = document.createElement("p");
      msg.textContent = "No hay dispositivos activos.";
      container.appendChild(msg);
    } else {
      activeDevices.forEach((dev, i) => {
        const val = saved[dev.inputId] ?? defaultValues[dev.inputId];
        const field = document.createElement("div");
        field.innerHTML = `
          <label for="${dev.inputId}">Consumo ${dev.label} (Watts):</label>
          <input type="number" id="${dev.inputId}" min="0"
            value="${val}" placeholder="Consumo ${dev.label}" />
        `;
        if (i % 2 === 0) col1.appendChild(field);
        else col2.appendChild(field);
      });
    }

    container.appendChild(col1);
    container.appendChild(col2);

    // Cerrar modal
    modalContent.querySelector("#closeConfig").addEventListener("click", () => {
      modal.style.display = "none";
    });

    // Guardar configuración (solo los visibles + precio KWH)
    modalContent.querySelector("#saveConfig").addEventListener("click", () => {
      const currentConfig = getSavedConfig() || { ...defaultValues };
      const newConfig = { ...currentConfig };

      const kwhInput = document.getElementById("kwhInput");
      if (kwhInput) newConfig.kwhPrice = Number(kwhInput.value) || defaultValues.kwhPrice;

      activeDevices.forEach(dev => {
        const input = document.getElementById(dev.inputId);
        if (input) newConfig[dev.inputId] = Number(input.value) || defaultValues[dev.inputId];
      });

      localStorage.setItem("config_consumo", JSON.stringify(newConfig));
      // Crear y mostrar mensaje flotante
      const notif = document.createElement("div");
      notif.className = "save-notification";
      notif.textContent = "Configuración guardada correctamente ✅";
      document.body.appendChild(notif);

      // Animar entrada y salida
      setTimeout(() => {
        notif.classList.add("show");
      }, 10);

      setTimeout(() => {
        notif.classList.remove("show");
        setTimeout(() => notif.remove(), 500);
      }, 3000);

      modal.style.display = "none";
    });
  }

  // Abrir modal
  openBtn.addEventListener("click", () => {
    buildModalContent();
    modal.style.display = "block";
  });

  // Cerrar por click fuera
  window.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });

  // Mostrar/ocultar contadores según switches
  function toggleCounter(switchId, counterId) {
    const sw = document.getElementById(switchId);
    const box = document.getElementById(counterId);
    if (sw && box) box.style.display = sw.checked ? "flex" : "none";
  }

  ["chkProyectores", "chkTelevisores", "chkPortatiles", "chkComputadores", "chkPantallas", "chkRouter", "chkLuces"].forEach((id) => {
    const counterId = "ctr" + id.replace("chk", "");
    const checkbox = document.getElementById(id);
    toggleCounter(id, counterId);
    if (checkbox) checkbox.addEventListener("change", () => toggleCounter(id, counterId));
  });

  // Contador simple
  window.updateCount = function (id, delta) {
    const span = document.getElementById(id);
    let value = parseInt(span.textContent);
    if (isNaN(value)) value = 0;
    span.textContent = Math.max(0, value + delta);
  };
});

// ---------- Enviar datos y abrir simulación ----------
document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("startSim");

  const devicesList = [
    { chkId: "chkProyectores", countId: "proyectores", label: "Proyectores", modalInputId: "consumoProyectores" },
    { chkId: "chkTelevisores", countId: "televisores", label: "Televisores", modalInputId: "consumoTelevisores" },
    { chkId: "chkPortatiles", countId: "portatiles", label: "Portátiles", modalInputId: "consumoPortatiles" },
    { chkId: "chkComputadores", countId: "computadores", label: "Computadores de mesa", modalInputId: "consumoComputadores" },
    { chkId: "chkPantallas", countId: "pantallas", label: "Pantallas OneScreen", modalInputId: "consumoPantallas" },
    { chkId: "chkRouter", countId: "router", label: "Router", modalInputId: "consumoRouter" },
    { chkId: "chkLuces", countId: "luces", label: "Luces", modalInputId: "consumoLuces" },
  ];

  function getEffectiveConfig() {
    const raw = localStorage.getItem("config_consumo");
    if (!raw) return { ...defaultValues };
    try {
      return JSON.parse(raw);
    } catch {
      return { ...defaultValues };
    }
  }

  startBtn.addEventListener("click", () => {
    const horasInput = document.querySelector(".input-box");
    const horas = horasInput ? Number(horasInput.value) || 8 : 8;

    const cfg = getEffectiveConfig();
    const kwhPrice = cfg.kwhPrice || 0;

    const devices = devicesList.map(dev => {
      const chk = document.getElementById(dev.chkId);
      const countSpan = document.getElementById(dev.countId);
      const cnt = countSpan ? parseInt(countSpan.textContent) || 0 : 0;
      const watts = cfg[dev.modalInputId] ?? 0;
      return { id: dev.chkId, label: dev.label, active: !!(chk && chk.checked), count: cnt, watts };
    });

    const payload = {
      horas,
      kwhPrice,
      devices,
      generatedAt: new Date().toISOString()
    };

    localStorage.setItem("simulator_payload", JSON.stringify(payload));
    window.open("simulacion.html", "_blank");
  });
});
