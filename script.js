// ============================================================
//  MÓDULO 0 — INICIALIZACIÓN DEL DOM Y VARIABLES GLOBALES
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  const tipoEscenario = document.getElementById("tipoEscenario");
  const startBtn = document.getElementById("startSim");
  const devicesContainer = document.getElementById("devicesContainer");
  const toastContainer = document.getElementById("toastContainer");

  startBtn.style.display = "none";

  // Variables globales relacionadas con tomas eléctricas
  let totalTomasDisponibles = 0;
  let tomasUsadas = 0;

  // Panel lateral numérico para mostrar disponibilidad de tomas
  function actualizarPanelTomas() {
    const disponibles = document.getElementById("tomasDisponibles");
    const usadas = document.getElementById("tomasUsadas");
    const restantes = document.getElementById("tomasRestantes");

    disponibles.textContent = totalTomasDisponibles;
    usadas.textContent = tomasUsadas;
    restantes.textContent = Math.max(totalTomasDisponibles - tomasUsadas, 0);
  }

  // ============================================================
  //  MÓDULO 1 — PANEL LATERAL DE INFORMACIÓN (Tomas)
  // ============================================================
  const infoPanel = document.createElement("div");
  infoPanel.id = "infoPanel";
  infoPanel.style.position = "fixed";
  infoPanel.style.left = "15px";
  infoPanel.style.top = "300px";
  infoPanel.style.background = "white";
  infoPanel.style.borderRadius = "12px";
  infoPanel.style.boxShadow = "0 4px 15px rgba(0,0,0,0.2)";
  infoPanel.style.padding = "15px 20px";
  infoPanel.style.fontSize = "15px";
  infoPanel.style.fontFamily = "Arial, sans-serif";
  infoPanel.style.zIndex = "1000";
  infoPanel.style.width = "180px";
  infoPanel.style.color = "#25386b";
  infoPanel.style.display = "none";
  infoPanel.style.lineHeight = "1";

  infoPanel.innerHTML = `
    <h4 style="margin-top:0; text-align:center; justify-content: center;">🔋 Tomas</h4>
    <p><strong>Disponibles:</strong> <span id="tomasDisponibles">0</span></p>
    <p><strong>Usadas:</strong> <span id="tomasUsadas">0</span></p>
    <p><strong>Restantes:</strong> <span id="tomasRestantes">0</span></p>
  `;

  document.body.appendChild(infoPanel);


  // ============================================================
  //  MÓDULO 2 — CATÁLOGO DE DISPOSITIVOS POR ESCENARIO
  // ============================================================
  const devicesByScenario = {
    salon: [
      { id: "chkTelevisores", label: "Televisores", icon: "fa-tv" },
      { id: "chkProyectores", label: "Proyectores", icon: "fa-video" },
      { id: "chkPortatiles", label: "Portátiles", icon: "fa-laptop" },
      { id: "chkTelefonos", label: "Teléfonos", icon: "fa-mobile-alt" },
      { id: "chkLuces", label: "Luces", icon: "fa-lightbulb" },
    ],
    lab: [
      { id: "chkTelevisores", label: "Televisores", icon: "fa-tv" },
      { id: "chkPantallas", label: "Pantallas OneScreen", icon: "fa-tv" },
      { id: "chkPortatiles", label: "Portátiles", icon: "fa-laptop" },
      { id: "chkComputadores", label: "Computadores de mesa", icon: "fa-desktop" },
      { id: "chkRouter", label: "Router", icon: "fa-wifi" },
      { id: "chkTelefonos", label: "Teléfonos", icon: "fa-mobile-alt" },
      { id: "chkLuces", label: "Luces", icon: "fa-lightbulb" },
    ],
  };


  // ============================================================
  //  MÓDULO 3 — CARGA DE DATOS JSON (Marcas y consumos)
  // ============================================================
  let deviceData = {};
  fetch("dispositivos.json")
    .then((res) => res.json())
    .then((data) => {
      deviceData = data;
    })
    .catch((err) => console.error("Error cargando dispositivos.json:", err));


  // ============================================================
  //  MÓDULO 4 — RENDERIZAR DISPOSITIVOS DEL ESCENARIO
  // ============================================================
  function renderDevices(scenario) {
    devicesContainer.innerHTML = "";
    startBtn.style.display = "none";

    if (!scenario || !devicesByScenario[scenario]) return;
    const devices = devicesByScenario[scenario];

    const mid = Math.ceil(devices.length / 2);
    const col1 = document.createElement("div");
    col1.className = "form-column";
    const col2 = document.createElement("div");
    col2.className = "form-column";

    devices.slice(0, mid).forEach((d) => col1.appendChild(createDeviceElement(d)));
    devices.slice(mid).forEach((d) => col2.appendChild(createDeviceElement(d)));

    devicesContainer.appendChild(col1);
    devicesContainer.appendChild(col2);

    const checkboxes = devicesContainer.querySelectorAll("input[type='checkbox']");
    checkboxes.forEach((chk) => chk.addEventListener("change", handleDeviceChange));
  }

  // Crear el componente visual del interruptor/dispositivo
  function createDeviceElement(device) {
    const div = document.createElement("div");
    div.className = "setting-row";
    div.innerHTML = `
      <div class="setting-header">
        <div class="setting-label">
          <i class="fas ${device.icon}"></i> ${device.label}
        </div>
        <div class="switch-box">
          <label class="switch">
            <input type="checkbox" id="${device.id}" />
            <span class="slider"></span>
          </label>
        </div>
      </div>
    `;
    return div;
  }


  // ============================================================
  //  MÓDULO 5 — MODAL GENÉRICO (Alertas bonitas)
  // ============================================================
  function showModal(message, title = "Advertencia") {
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.backgroundColor = "rgba(0,0,0,0.6)";
    overlay.style.display = "flex";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.zIndex = 2000;

    const modal = document.createElement("div");
    modal.style.background = "white";
    modal.style.borderRadius = "12px";
    modal.style.padding = "20px";
    modal.style.textAlign = "center";
    modal.style.maxWidth = "320px";
    modal.style.boxShadow = "0 4px 15px rgba(0,0,0,0.25)";

    modal.innerHTML = `
      <h3 style="color:#25386b; margin-bottom:10px;">${title}</h3>
      <p style="font-size:15px; color:#444; margin-bottom:20px;">${message}</p>
      <button id="closeModal" style="
          background:linear-gradient(90deg, #09cba3, #3d7bfd);
          color:white; border:none; border-radius:8px;
          padding:8px 18px; cursor:pointer; font-weight:500;">Aceptar</button>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    modal.querySelector("#closeModal").addEventListener("click", () => {
      overlay.remove();
    });
  }


  // ============================================================
  //  MÓDULO 6 — TOAST DE CONFIGURACIÓN DE DISPOSITIVOS
  // ============================================================
  function showDeviceToast(deviceLabel, checkbox) {
    // Limpia toasts previos
    toastContainer.innerHTML = "";

    // Crear tarjeta toast flotante
    const toast = document.createElement("div");
    toast.className = "toast-card";
    toast.style.position = "fixed";
    toast.style.left = "73%";
    toast.style.transform = "translate(-50%, -50%)";
    toast.style.zIndex = "1500";
    toast.style.paddingTop = "25px";

    // Contenido del toast
    toast.innerHTML = `
      <button class="cerrar-toast"
        style="position:absolute; top:0; right:0; 
        background:none; border:none; font-size:22px; 
        color:#e63946; font-weight:bold; cursor:pointer; padding:6px 10px;
        line-height:1; border-top-right-radius:10px;
        transition: transform 0.2s ease, color 0.2s ease;">✖</button>

      <h4 style="margin-top:0;">${deviceLabel}</h4>
      <div class="marca-block scrollable-block"></div>

      <div class="botonera-unificada" style="margin-top:10px; display:flex; justify-content:center; align-items:center; gap:10px;">
        <button class="prev-marca" style="display:none;width:40px;height:40px;border:none;border-radius:8px;background-color:#25386b;color:#fff;">
          <i class="fas fa-arrow-left"></i>
        </button>

        <button class="add-marca-btn"
          style="height:40px; padding:0 15px; border:none; border-radius:8px;
                background:linear-gradient(90deg, #09cba3, #3d7bfd); 
                color:white; font-weight:500;">
          + Agregar otra marca
        </button>

        <button class="next-marca" style="display:none;width:40px;height:40px;border:none;border-radius:8px;background-color:#25386b;color:#fff;">
          <i class="fas fa-arrow-right"></i>
        </button>
      </div>

      <div class="botonera-guardar" style="margin-top:10px; text-align:center;">
        <button class="guardar-btn"
          style="background:linear-gradient(90deg, #09cba3, #3d7bfd); 
          color:white; border:none; border-radius:8px;
          padding:8px 20px; cursor:pointer; font-weight:500;">
          Guardar
        </button>
      </div>
    `;

    // =============================
    // Manejo de navegación de marcas
    // =============================
    const cerrarBtn = toast.querySelector(".cerrar-toast");
    cerrarBtn.addEventListener("mouseenter", () => {
      cerrarBtn.style.color = "#ff0000";
      cerrarBtn.style.transform = "scale(1.15)";
    });
    cerrarBtn.addEventListener("mouseleave", () => {
      cerrarBtn.style.color = "#e63946";
      cerrarBtn.style.transform = "scale(1)";
    });
    cerrarBtn.addEventListener("click", () => {
      toast.remove();
      if (checkbox) checkbox.checked = false;
    });

    const marcaContainer = toast.querySelector(".marca-block");
    const addBtn = toast.querySelector(".add-marca-btn");
    const nextBtn = toast.querySelector(".next-marca");
    const prevBtn = toast.querySelector(".prev-marca");
    const guardarBtn = toast.querySelector(".guardar-btn");

    const marcasDisponibles = (deviceData[deviceLabel] || []).length;

    let currentIndex = 1;
    marcaContainer.appendChild(createMarcaBlock(deviceLabel, 1));
    updateNavButtons();

    function updateNavButtons() {
      const createdCount = marcaContainer.children.length;
      prevBtn.style.display = currentIndex > 1 ? "inline-block" : "none";
      nextBtn.style.display = createdCount > currentIndex ? "inline-block" : "none";

      if (createdCount >= marcasDisponibles) {
        addBtn.disabled = true;
        addBtn.textContent = "Máximo alcanzado";
      } else {
        addBtn.disabled = false;
        addBtn.textContent = "+ Agregar otra marca";
      }
    }

    function showMarca(index) {
      Array.from(marcaContainer.children).forEach((ch, idx) => {
        ch.style.display = idx + 1 === index ? "block" : "none";
      });
      currentIndex = index;
      updateNavButtons();
    }

    addBtn.addEventListener("click", () => {
      const currentCount = marcaContainer.children.length;
      if (currentCount < marcasDisponibles) {
        const nextNumber = currentCount + 1;
        marcaContainer.children[currentIndex - 1].style.display = "none";
        const newBlock = createMarcaBlock(deviceLabel, nextNumber);
        marcaContainer.appendChild(newBlock);
        currentIndex = nextNumber;
        showMarca(currentIndex);
      }
    });

    nextBtn.addEventListener("click", () => {
      const createdCount = marcaContainer.children.length;
      if (currentIndex < createdCount) showMarca(currentIndex + 1);
    });

    prevBtn.addEventListener("click", () => {
      if (currentIndex > 1) showMarca(currentIndex - 1);
    });

    // ========================================================
    // Gestión del botón GUARDAR dentro del toast
    // ========================================================
    guardarBtn.addEventListener("click", () => {
      let totalCantidad = 0;
      const marcasGuardadas = [];

      marcaContainer.querySelectorAll(".marca-section").forEach((section) => {
        const marcaSelect = section.querySelector(".marca-select");
        const consumoInput = section.querySelector(".consumo-input");
        const cantidadInput = section.querySelector(".cantidad-input");

        const marca = marcaSelect?.value || "";
        const consumo =
          parseFloat(consumoInput?.value || marcaSelect?.selectedOptions[0]?.dataset.consumo || "0");
        const cantidad = parseInt(cantidadInput?.value || "1");

        if (marca && consumo > 0) {
          marcasGuardadas.push({ marca, consumo, cantidad });
          totalCantidad += cantidad;
        }
      });

      // Luces no consumen tomas
      if (deviceLabel !== "Luces") {
        if (tomasUsadas + totalCantidad > totalTomasDisponibles) {
          showModal(
            `Se superó el límite de tomas disponibles (${totalTomasDisponibles}).`,
            "Límite de Tomas Alcanzado"
          );
          return;
        }

        tomasUsadas += totalCantidad;
        actualizarPanelTomas();
      }

      // Guarda configuración en memoria global
      if (!window.dispositivosConfigurados) window.dispositivosConfigurados = [];

      const existente = window.dispositivosConfigurados.find((d) => d.tipo === deviceLabel);
      if (existente) {
        existente.marcas = marcasGuardadas;
      } else {
        window.dispositivosConfigurados.push({
          tipo: deviceLabel,
          marcas: marcasGuardadas,
        });
      }

      if (checkbox) checkbox.checked = true;

      // Reemplazar contenido del toast por mensaje de éxito
      toast.innerHTML = `
        <div class="success-toast"
          style="background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb;
          padding: 15px 25px; border-radius: 12px; text-align: center; font-weight: 500;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          animation: fadeInOut 1.8s ease-in-out forwards;">
          ✅ ${deviceLabel} guardado correctamente
        </div>
      `;

      const style = document.createElement("style");
      style.textContent = `
        @keyframes fadeInOut {
          0%   { opacity: 0; transform: scale(0.9); }
          10%  { opacity: 1; transform: scale(1); }
          80%  { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.9); }
        }
      `;
      document.head.appendChild(style);

      setTimeout(() => {
        toast.remove();
      }, 1800);
    });

    toastContainer.appendChild(toast);
    makeToastDraggable(toast);
  }


  // ============================================================
  //  MÓDULO 7 — PERMITIR ARRASTRAR (DRAGGABLE) CUALQUIER TOAST
  // ============================================================
  function makeToastDraggable(toast) {
    let offsetX = 0,
      offsetY = 0,
      isDragging = false;
    toast.style.cursor = "grab";

    toast.addEventListener("mousedown", (e) => {
      isDragging = true;
      toast.style.cursor = "grabbing";
      offsetX = e.clientX - toast.getBoundingClientRect().left;
      offsetY = e.clientY - toast.getBoundingClientRect().top;
      toast.style.transition = "none";
    });

    document.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      const newLeft = e.clientX - offsetX;
      const newTop = e.clientY - offsetY;
      toast.style.left = `${newLeft}px`;
      toast.style.top = `${newTop}px`;
      toast.style.transform = "none";
    });

    document.addEventListener("mouseup", () => {
      if (!isDragging) return;
      isDragging = false;
      toast.style.cursor = "grab";
      toast.style.transition = "top 0.2s, left 0.2s";
    });
  }


  // ============================================================
  //  MÓDULO 8 — CREAR BLOQUES DE MARCAS/CONSUMOS
  // ============================================================
  function createMarcaBlock(deviceLabel, number = 1) {
    const block = document.createElement("div");
    block.className = "marca-section";
    const marcas = deviceData[deviceLabel] || [];

    block.innerHTML = `
      <label>Marca ${number}:</label>
      <select class="marca-select">
        ${marcas
        .map(
          (m) =>
            `<option value="${m.marca}" data-consumo="${m.consumo}">
                 ${m.marca}
               </option>`
        )
        .join("")}
      </select>

      <label>Consumo (W):</label>
      <input type="number" class="consumo-input" placeholder="Ej. 100" />

      <label>Cantidad:</label>
      <input type="number" class="cantidad-input" placeholder="Ej. 2" min="1" value="1" />
    `;

    const select = block.querySelector(".marca-select");
    const consumo = block.querySelector(".consumo-input");

    if (marcas.length > 0)
      consumo.value = marcas[number - 1]?.consumo || marcas[0].consumo;

    select.addEventListener("change", (e) => {
      consumo.value = e.target.selectedOptions[0].dataset.consumo;
    });

    return block;
  }


  // ============================================================
  //  MÓDULO 9 — MANEJO DE INTERRUPTORES/DEVICES (Activar/Desactivar)
  // ============================================================
  function handleDeviceChange(e) {
    const checkbox = e.target;
    const label = checkbox.closest(".setting-header").querySelector(".setting-label").textContent.trim();

    const anyActive = devicesContainer.querySelectorAll("input[type='checkbox']:checked").length > 0;
    startBtn.style.display = anyActive ? "inline-block" : "none";

    // ACTIVAR dispositivo → abrir toast
    if (checkbox.checked) {
      showDeviceToast(label, checkbox);
      return;
    }

    // DESACTIVAR dispositivo → quitar config, liberar tomas
    toastContainer.innerHTML = "";

    if (!window.dispositivosConfigurados) window.dispositivosConfigurados = [];

    const index = window.dispositivosConfigurados.findIndex(d => d.tipo === label);

    if (index !== -1) {
      const deviceConfig = window.dispositivosConfigurados[index];
      let tomasLiberadas = 0;

      if (label !== "Luces") {
        deviceConfig.marcas.forEach(m => {
          tomasLiberadas += m.cantidad;
        });

        tomasUsadas = Math.max(tomasUsadas - tomasLiberadas, 0);
        actualizarPanelTomas();
      }

      window.dispositivosConfigurados.splice(index, 1);
    }

    updateSimButtonVisibility();
  }


  // ============================================================
  //  MÓDULO 10 — CONFIGURACIÓN DEL ESCENARIO (Modal Tomas + UPS)
  // ============================================================
  function solicitarConfiguracionEscenario(scenario, callback) {
    toastContainer.innerHTML = "";

    const modal = document.createElement("div");
    modal.className = "toast-card";
    modal.style.width = "320px";
    modal.style.textAlign = "center";

    let contenido = `
      <h4>Configurar ${scenario === "lab" ? "Laboratorio de Informática" : "Escenario"}</h4>

      <p style="font-size:0.95em; color:#555; margin-bottom:10px;">
        Ingrese la cantidad de tomas eléctricas disponibles${scenario === "lab" ? " y cantidad de UPS:" : ":"}
      </p>

      <input type="number" id="inputTomas" min="1"
            placeholder="Tomas individuales funcionales"
            style="width:80%; padding:6px 8px; border:1px solid #ccc; border-radius:8px; margin-bottom:12px;"/>
    `;

    if (scenario === "lab") {
      contenido += `
        <input type="number" id="inputUPS" min="0"
              placeholder="Cantidad de UPS (6 tomas cada uno)"
              style="width:80%; padding:6px 8px; border:1px solid #ccc; border-radius:8px; margin-bottom:12px;"/>
      `;
    }

    contenido += `
      <div style="display:flex; justify-content:center; gap:10px;">
        <button id="guardarConfigBtn"
            style="background:linear-gradient(90deg, #09cba3, #3d7bfd); 
            color:#fff; border:none; border-radius:8px;
            padding:8px 16px; cursor:pointer; font-weight:500;">Guardar</button>

        <button id="cancelarConfigBtn"
            style="background-color:#ccc; color:#000; border:none; border-radius:8px;
            padding:8px 16px; cursor:pointer;">Cancelar</button>
      </div>
    `;

    modal.innerHTML = contenido;
    toastContainer.appendChild(modal);
    makeToastDraggable(modal);

    const inputTomas = modal.querySelector("#inputTomas");
    const inputUPS = modal.querySelector("#inputUPS");
    const guardar = modal.querySelector("#guardarConfigBtn");
    const cancelar = modal.querySelector("#cancelarConfigBtn");

    guardar.addEventListener("click", () => {
      const cantidadTomas = parseInt(inputTomas.value);
      const cantidadUPS = parseInt(inputUPS?.value || "0");

      if (!cantidadTomas || cantidadTomas <= 0) {
        inputTomas.style.border = "1px solid red";
        inputTomas.focus();
        return;
      }

      modal.remove();

      infoPanel.style.display = "block";
      actualizarPanelTomas();

      callback(cantidadTomas, cantidadUPS);
    });

    cancelar.addEventListener("click", () => modal.remove());
  }


  // ============================================================
  //  MÓDULO 11 — ESCUCHAR CAMBIO DE ESCENARIO
  // ============================================================
  tipoEscenario.addEventListener("change", (e) => {
    const scenario = e.target.value;
    if (!scenario) return;

    tomasUsadas = 0;
    actualizarPanelTomas();

    solicitarConfiguracionEscenario(scenario, (cantidadTomas, cantidadUPS) => {
      if (scenario === "lab") {
        totalTomasDisponibles = cantidadTomas + cantidadUPS * 6;
      } else {
        totalTomasDisponibles = cantidadTomas;
      }

      renderDevices(scenario);
      actualizarPanelTomas();
    });
  });


  // ============================================================
  //  MÓDULO 12 — BOTÓN "SIMULAR" (Visibilidad dinámica)
  // ============================================================
  function updateSimButtonVisibility() {
    const activeSwitches = document.querySelectorAll('.switch input:checked');
    const simBtn = document.querySelector('.btn-simular');

    if (!simBtn) return;

    if (activeSwitches.length > 0) {
      simBtn.style.display = 'block';
      simBtn.style.opacity = '1';
    } else {
      simBtn.style.opacity = '0';
      setTimeout(() => {
        simBtn.style.display = 'none';
      }, 200);
    }
  }

  document.addEventListener('change', (e) => {
    if (e.target.matches('.switch input')) {
      updateSimButtonVisibility();
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    updateSimButtonVisibility();
  });


  // ============================================================
  //  MÓDULO 13 — ENVÍO FINAL DE DATOS A SIMULACION.HTML
  // ============================================================
  document.getElementById("startSim").addEventListener("click", () => {

    if (!window.dispositivosConfigurados || window.dispositivosConfigurados.length === 0) {
      alert("⚠️ No hay dispositivos activos configurados.");
      return;
    }

    const datosSimulacion = {
      escenario: document.getElementById("tipoEscenario")?.value || "",
      horas: parseFloat(document.getElementById("horasSimulacion")?.value || "1"),
      kwhPrice: parseFloat(document.getElementById("valorKwh")?.value || "0"),
      conectores: parseInt(document.getElementById("cantidadConectores")?.value || "0"),
      ups: parseInt(document.getElementById("cantidadUps")?.value || "0"),
      devices: window.dispositivosConfigurados
    };

    // 🔎 LOGS DE DEPURACIÓN
    console.log("===== DATOS A ENVIAR A LA SIMULACIÓN =====");
    console.log("Objeto original:", datosSimulacion);

    const jsonString = JSON.stringify(datosSimulacion, null, 2);
    console.log("JSON stringify:", jsonString);

    const base64 = btoa(jsonString);

    console.log("URL final:", "simulacion.html?data=" + base64);
    console.log("==========================================");

    // 👉 Enviar a simulación
    window.open("simulacion.html?data=" + base64, "_blank");
  });



}); // CIERRE DEL DOMContentLoaded COMPLETO
