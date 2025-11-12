document.addEventListener("DOMContentLoaded", () => {
  const tipoEscenario = document.getElementById("tipoEscenario");
  const startBtn = document.getElementById("startSim");
  const devicesContainer = document.getElementById("devicesContainer");
  const toastContainer = document.getElementById("toastContainer");

  startBtn.style.display = "none";

  // Variables globales
  let totalTomasDisponibles = 0;
  let tomasUsadas = 0;

  // Escenarios con sus dispositivos
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

  // ---- Cargar dispositivos desde JSON ----
  let deviceData = {};
  fetch("dispositivos.json")
    .then((res) => res.json())
    .then((data) => {
      deviceData = data;
    })
    .catch((err) => console.error("Error cargando dispositivos.json:", err));

  // ---- Renderizar dispositivos según escenario ----
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

  let currentActiveCheckbox = null;

  // ---- Modal genérico ----
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

  // ---- Mostrar toast ----
  function showDeviceToast(deviceLabel, checkbox) {
    toastContainer.innerHTML = "";

    const toast = document.createElement("div");
    toast.className = "toast-card";
    toast.style.position = "fixed";
    toast.style.left = "73%";
    toast.style.transform = "translate(-50%, -50%)";
    toast.style.zIndex = "1500";

    toast.innerHTML = `
      <h4>${deviceLabel}</h4>
      <div class="marca-block scrollable-block"></div>
      <div class="botonera-unificada" style="margin-top:10px; display:flex; justify-content:center; align-items:center; gap:10px;">
        <button class="prev-marca" style="display:none;width:40px;height:40px;border:none;border-radius:8px;background-color:#25386b;color:#fff;">
          <i class="fas fa-arrow-left"></i>
        </button>
        <button class="add-marca-btn"
            style="height:40px; padding:0 15px; border:none; border-radius:8px;
                   background:linear-gradient(90deg, #09cba3, #3d7bfd); color:white; font-weight:500;">
          + Agregar otra marca
        </button>
        <button class="next-marca" style="display:none;width:40px;height:40px;border:none;border-radius:8px;background-color:#25386b;color:#fff;">
          <i class="fas fa-arrow-right"></i>
        </button>
      </div>
      <div class="botonera-guardar" style="margin-top:10px; text-align:center;">
        <button class="guardar-btn"
            style="background:linear-gradient(90deg, #09cba3, #3d7bfd); color:white; border:none; border-radius:8px;
                   padding:8px 20px; cursor:pointer; font-weight:500;">Guardar</button>
      </div>
    `;

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

    guardarBtn.addEventListener("click", () => {
      let totalCantidad = 0;
      const marcasGuardadas = [];

      marcaContainer.querySelectorAll(".marca-section").forEach((section) => {
        const marca = section.querySelector(".marca-select")?.value || "";
        const consumo = parseFloat(section.querySelector(".consumo-input")?.value || "0");
        const cantidad = parseInt(section.querySelector(".cantidad-input")?.value || "0");

        if (marca && consumo > 0 && cantidad > 0) {
          marcasGuardadas.push({ marca, consumo, cantidad });
          totalCantidad += cantidad;
        }
      });

      // Verificar límite de tomas
      if (tomasUsadas + totalCantidad > totalTomasDisponibles) {
        showModal(
          `Se superó el límite de tomas disponibles (${totalTomasDisponibles}).`,
          "Límite de Tomas Alcanzado"
        );
        return;
      }

      tomasUsadas += totalCantidad;

      // ✅ Guardar en memoria global
      if (!window.dispositivosConfigurados) window.dispositivosConfigurados = [];
      const existente = window.dispositivosConfigurados.find(d => d.tipo === deviceLabel);
      if (existente) {
        existente.marcas = marcasGuardadas;
      } else {
        window.dispositivosConfigurados.push({
          tipo: deviceLabel,
          marcas: marcasGuardadas
        });
      }

      // Mostrar mensaje visual de éxito
      toast.innerHTML = `
    <div class="success-toast"
         style="background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb;
         padding: 15px 25px; border-radius: 12px; text-align: center; font-weight: 500;
         box-shadow: 0 2px 8px rgba(0,0,0,0.15); animation: fadeInOut 1.8s ease-in-out forwards;">
      ✅ ${deviceLabel} guardado correctamente
    </div>
  `;

      const style = document.createElement("style");
      style.textContent = `
    @keyframes fadeInOut {
      0% { opacity: 0; transform: scale(0.9); }
      10% { opacity: 1; transform: scale(1); }
      80% { opacity: 1; transform: scale(1); }
      100% { opacity: 0; transform: scale(0.9); }
    }
  `;
      document.head.appendChild(style);

      setTimeout(() => toast.remove(), 1800);
    });


    toastContainer.appendChild(toast);
    makeToastDraggable(toast);

    setTimeout(() => {
      document.addEventListener(
        "click",
        (ev) => {
          if (!toast.contains(ev.target) && ev.target !== checkbox) {
            toast.remove();
            if (checkbox) checkbox.checked = false;
          }
        },
        { once: true }
      );
    }, 100);

    currentActiveCheckbox = checkbox;
  }

  // ---- Hacer toast draggable ----
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

  // ---- Crear bloque de marcas ----
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
            `<option value="${m.marca}" data-consumo="${m.consumo}">${m.marca}</option>`
        )
        .join("")}
      </select>
      <label>Consumo (W):</label>
      <input type="number" class="consumo-input" placeholder="Ej. 100" />
      <label>Cantidad:</label>
      <input type="number" class="cantidad-input" placeholder="Ej. 2" min="1" value="1"/>
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

  // ---- Manejar cambios en checkboxes ----
  function handleDeviceChange(e) {
    const checkbox = e.target;
    const label = checkbox.closest(".setting-header").querySelector(".setting-label").textContent.trim();

    const anyActive = devicesContainer.querySelectorAll("input[type='checkbox']:checked").length > 0;
    startBtn.style.display = anyActive ? "inline-block" : "none";

    if (checkbox.checked) {
      showDeviceToast(label, checkbox);
    } else {
      toastContainer.innerHTML = "";
    }
  }

  // ---- Solicitar cantidad de tomas al seleccionar escenario ----
  function solicitarCantidadTomas(callback) {
    toastContainer.innerHTML = "";

    const modal = document.createElement("div");
    modal.className = "toast-card";
    modal.style.width = "300px";
    modal.style.textAlign = "center";

    modal.innerHTML = `
      <h4>Configurar escenario</h4>
      <p style="font-size:0.95em; color:#555; margin-bottom:10px;">
        Ingrese la cantidad de tomas disponibles:
      </p>
      <input type="number" id="inputTomas" min="1"
             placeholder="(Tomas individuales Funcionales)"
             style="width:80%; padding:6px 8px; border:1px solid #ccc; border-radius:8px; margin-bottom:12px;"/>
      <div style="display:flex; justify-content:center; gap:10px;">
        <button id="guardarTomasBtn"
            style="background:linear-gradient(90deg, #09cba3, #3d7bfd); color:#fff; border:none;
            border-radius:8px; padding:8px 16px; cursor:pointer; font-weight:500;">Guardar</button>
        <button id="cancelarTomasBtn"
            style="background-color:#ccc; color:#000; border:none; border-radius:8px;
            padding:8px 16px; cursor:pointer;">Cancelar</button>
      </div>
    `;

    toastContainer.appendChild(modal);
    makeToastDraggable(modal);

    const input = modal.querySelector("#inputTomas");
    const guardar = modal.querySelector("#guardarTomasBtn");
    const cancelar = modal.querySelector("#cancelarTomasBtn");

    guardar.addEventListener("click", () => {
      const cantidad = parseInt(input.value);
      if (!cantidad || cantidad <= 0) {
        input.style.border = "1px solid red";
        input.focus();
        return;
      }
      modal.remove();
      callback(cantidad);
    });

    cancelar.addEventListener("click", () => modal.remove());
  }

  // ---- Solicitar cantidad de UPS ----
  function solicitarUPS(callback) {
    const modal = document.createElement("div");
    modal.className = "toast-card";
    modal.style.width = "300px";
    modal.style.textAlign = "center";

    modal.innerHTML = `
      <h4>UPS del laboratorio</h4>
      <p style="font-size:0.95em; color:#555; margin-bottom:10px;">
        ¿Cuántos UPS hay en el laboratorio? (6 tomas cada uno)
      </p>
      <input type="number" id="inputUPS" min="0" placeholder="Ej: 2"
             style="width:80%; padding:6px 8px; border:1px solid #ccc; border-radius:8px; margin-bottom:12px;"/>
      <div style="display:flex; justify-content:center; gap:10px;">
        <button id="guardarUPSBtn"
            style="background:linear-gradient(90deg, #09cba3, #3d7bfd); color:#fff; border:none;
            border-radius:8px; padding:8px 16px; cursor:pointer; font-weight:500;">Guardar</button>
        <button id="cancelarUPSBtn"
            style="background-color:#ccc; color:#000; border:none; border-radius:8px;
            padding:8px 16px; cursor:pointer;">Cancelar</button>
      </div>
    `;

    toastContainer.appendChild(modal);
    makeToastDraggable(modal);

    const input = modal.querySelector("#inputUPS");
    const guardar = modal.querySelector("#guardarUPSBtn");
    const cancelar = modal.querySelector("#cancelarUPSBtn");

    guardar.addEventListener("click", () => {
      const cantidad = parseInt(input.value) || 0;
      modal.remove();
      callback(cantidad);
    });

    cancelar.addEventListener("click", () => modal.remove());
  }

  // ---- Al cambiar el escenario ----
  tipoEscenario.addEventListener("change", (e) => {
    const scenario = e.target.value;
    if (!scenario) return;

    tomasUsadas = 0;

    solicitarCantidadTomas((cantidadTomas) => {
      if (scenario === "lab") {
        solicitarUPS((cantidadUPS) => {
          totalTomasDisponibles = cantidadTomas + cantidadUPS * 6;
          console.log(`Tomas totales (incluyendo UPS): ${totalTomasDisponibles}`);
          renderDevices(scenario);
        });
      } else {
        totalTomasDisponibles = cantidadTomas;
        console.log(`Tomas disponibles: ${totalTomasDisponibles}`);
        renderDevices(scenario);
      }
    });
  });

  // ================================
  //  ENVÍO DIRECTO DE DATOS A SIMULACION
  // ================================

  document.getElementById("startSim").addEventListener("click", () => {
    // Crear objeto principal
    const datosSimulacion = {};

    // 1️⃣ Datos generales
    const escenario = document.getElementById("tipoEscenario")?.value || "";
    const horas = parseFloat(document.getElementById("horasSimulacion")?.value || "1");
    const valorKwh = parseFloat(document.getElementById("valorKwh")?.value || "0");

    datosSimulacion.escenario = escenario;
    datosSimulacion.horas = horas;
    datosSimulacion.kwhPrice = valorKwh;

    // 2️⃣ Datos de conectores y UPS (según escenario)
    const conectores = parseInt(document.getElementById("cantidadConectores")?.value || "0");
    if (conectores > 0) datosSimulacion.conectores = conectores;

    if (escenario === "lab") {
      const ups = parseInt(document.getElementById("cantidadUps")?.value || "0");
      if (ups > 0) datosSimulacion.ups = ups;
    }

    // 3️⃣ Dispositivos activos (solo los configurados y guardados)
    const dispositivosActivos = window.dispositivosConfigurados || [];
    if (dispositivosActivos.length === 0) {
      alert("⚠️ No hay dispositivos activos configurados.");
      return;
    }
    datosSimulacion.devices = dispositivosActivos;


    if (dispositivosActivos.length === 0) {
      alert("⚠️ No hay dispositivos activos configurados.");
      return;
    }

    datosSimulacion.devices = dispositivosActivos;

    // 4️⃣ Guardar en LocalStorage
    localStorage.setItem("simulator_payload", JSON.stringify(datosSimulacion));

    console.log("✅ Datos enviados a simulador:", datosSimulacion);

    // 5️⃣ Abrir simulación
    window.open("simulacion.html", "_blank");
  });

});
