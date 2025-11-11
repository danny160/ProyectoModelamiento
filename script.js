document.addEventListener("DOMContentLoaded", () => {
  const tipoEscenario = document.getElementById("tipoEscenario");
  const startBtn = document.getElementById("startSim");
  const devicesContainer = document.getElementById("devicesContainer");
  const toastContainer = document.getElementById("toastContainer");

  startBtn.style.display = "none";

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

  const deviceData = {
    Televisores: [
      { marca: "Samsung", consumo: 100 },
      { marca: "LG", consumo: 120 },
      { marca: "Sony", consumo: 110 },
    ],
    Proyectores: [
      { marca: "Epson", consumo: 200 },
      { marca: "BenQ", consumo: 180 },
    ],
    Portátiles: [
      { marca: "HP", consumo: 60 },
      { marca: "Lenovo", consumo: 70 },
      { marca: "Dell", consumo: 65 },
    ],
    Luces: [
      { marca: "Philips", consumo: 15 },
      { marca: "Osram", consumo: 18 },
    ],
    "Computadores de mesa": [
      { marca: "HP", consumo: 200 },
      { marca: "Dell", consumo: 210 },
      { marca: "Lenovo", consumo: 190 },
    ],
    Router: [
      { marca: "TP-Link", consumo: 12 },
      { marca: "Asus", consumo: 15 },
    ],
  };

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

  function showDeviceToast(deviceLabel, checkbox) {
    toastContainer.innerHTML = "";
    toastContainer.style.position = "fixed";
    toastContainer.style.top = "200px";
    toastContainer.style.right = "20px";
    toastContainer.style.left = "auto";

    const toast = document.createElement("div");
    toast.className = "toast-card";
    toast.dataset.device = deviceLabel;
    toast.style.position = "fixed";
    toast.style.top = "200px";
    toast.style.right = "20px";
    toast.style.left = "auto";
    toast.style.zIndex = "9999";

    toast.innerHTML = `
      <h4>${deviceLabel}</h4>
      <div class="marca-block scrollable-block"></div>
      <button class="add-marca-btn">+ Agregar otra marca</button>
      <button class="guardar-btn">Guardar</button>
    `;

    const marcaContainer = toast.querySelector(".marca-block");
    const addBtn = toast.querySelector(".add-marca-btn");
    const marcasDisponibles = (deviceData[deviceLabel] || []).length;

    marcaContainer.appendChild(createMarcaBlock(deviceLabel, 1));

    addBtn.addEventListener("click", () => {
      const currentCount = marcaContainer.children.length;
      if (currentCount < marcasDisponibles) {
        const nextNumber = currentCount + 1;
        marcaContainer.appendChild(createMarcaBlock(deviceLabel, nextNumber));
        if (nextNumber >= marcasDisponibles) {
          addBtn.disabled = true;
          addBtn.textContent = "Máximo alcanzado";
        }
      }
    });

    toast.querySelector(".guardar-btn").addEventListener("click", () => {
      toast.innerHTML = `<div class="success-toast">✅ ${deviceLabel} guardado correctamente.</div>`;
      setTimeout(() => toast.remove(), 1500);
    });

    toastContainer.appendChild(toast);
    makeToastDraggable(toast);

    // Cierre por clic fuera
    setTimeout(() => {
      document.addEventListener("click", (ev) => {
        if (toast && !toast.contains(ev.target) && ev.target !== checkbox) {
          toast.remove();
          if (checkbox) checkbox.checked = false;
        }
      }, { once: true });
    }, 100);

    currentActiveCheckbox = checkbox;
  }

  function makeToastDraggable(toast) {
    let offsetX = 0, offsetY = 0, isDragging = false;
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
      toast.style.right = "auto";
    });

    document.addEventListener("mouseup", () => {
      if (!isDragging) return;
      isDragging = false;
      toast.style.cursor = "grab";
      toast.style.transition = "top 0.2s, left 0.2s";
    });
  }

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
    if (marcas.length > 0) consumo.value = marcas[0].consumo;

    select.addEventListener("change", (e) => {
      consumo.value = e.target.selectedOptions[0].dataset.consumo;
    });

    return block;
  }

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

  tipoEscenario.addEventListener("change", (e) => renderDevices(e.target.value));
});
