const STORAGE_KEY = "sso_inspecciones";

const loginSection = document.getElementById("loginSection");
const appSection = document.getElementById("appSection");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const logoutBtn = document.getElementById("logoutBtn");
const inspectionForm = document.getElementById("inspectionForm");
const tbody = document.querySelector("#inspectionTable tbody");
const downloadExcelBtn = document.getElementById("downloadExcelBtn");
const downloadPdfBtn = document.getElementById("downloadPdfBtn");
const sucursalPdfSelect = document.getElementById("sucursalPdfSelect");

let conformidadChart;
let equiposChart;

function loadRecords() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function isJpg(file) {
  return !file || file.type === "image/jpeg";
}

function fileToDataUrl(file) {
  return new Promise((resolve) => {
    if (!file) return resolve("");
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

function updateSucursalSelect(records) {
  const sucursales = [...new Set(records.map((r) => r.instalaciones).filter(Boolean))].sort();
  sucursalPdfSelect.innerHTML = "";
  const base = document.createElement("option");
  base.value = "";
  base.textContent = "Seleccione sucursal";
  sucursalPdfSelect.appendChild(base);

  sucursales.forEach((sucursal) => {
    const opt = document.createElement("option");
    opt.value = sucursal;
    opt.textContent = sucursal;
    sucursalPdfSelect.appendChild(opt);
  });
}

function renderTable() {
  const records = loadRecords();
  tbody.innerHTML = "";

  records.forEach((r) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.estado}</td>
      <td>${r.prioridad}</td>
      <td>${r.fechaInspeccion}</td>
      <td>${r.descripcion}</td>
      <td>${r.responsable}</td>
      <td>${r.evidencia ? `<img class="thumb" src="${r.evidencia}" alt="Evidencia"/>` : "-"}</td>
      <td>${r.accionCorrectiva}</td>
      <td>${r.fechaLimite}</td>
      <td>${r.resultado ? `<img class="thumb" src="${r.resultado}" alt="Resultado"/>` : "-"}</td>
      <td>${r.empresa}</td>
      <td>${r.instalaciones}</td>
      <td>${r.area}</td>
      <td>${r.controlOperacional}</td>
      <td>${r.origen}</td>
      <td>${r.clasificacionRiesgo}</td>
      <td>${r.conformidad}</td>
    `;
    tbody.appendChild(tr);
  });

  updateSucursalSelect(records);
  renderCharts(records);
}

function renderCharts(records) {
  const sucursales = [...new Set(records.map((r) => r.instalaciones).filter(Boolean))];
  const labels = [...sucursales, "TOTAL EMPRESA"];

  const conformidades = [];
  const noConformidades = [];
  const extintores = [];
  const botiquines = [];

  labels.forEach((label) => {
    const pool = label === "TOTAL EMPRESA" ? records : records.filter((r) => r.instalaciones === label);
    conformidades.push(pool.filter((r) => r.conformidad === "Conformidad").length);
    noConformidades.push(pool.filter((r) => r.conformidad === "No conformidad").length);
    extintores.push(pool.filter((r) => r.controlOperacional === "Extintores").length);
    botiquines.push(pool.filter((r) => r.controlOperacional === "Botiquines").length);
  });

  if (conformidadChart) conformidadChart.destroy();
  if (equiposChart) equiposChart.destroy();

  conformidadChart = new Chart(document.getElementById("conformidadChart"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "Conformidades", data: conformidades, backgroundColor: "#16a34a" },
        { label: "No conformidades", data: noConformidades, backgroundColor: "#dc2626" }
      ]
    },
    options: { responsive: true, plugins: { title: { display: true, text: "Conformidades por sucursal y total" } } }
  });

  equiposChart = new Chart(document.getElementById("equiposChart"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "Extintores", data: extintores, backgroundColor: "#f59e0b" },
        { label: "Botiquines", data: botiquines, backgroundColor: "#0284c7" }
      ]
    },
    options: { responsive: true, plugins: { title: { display: true, text: "Extintores y Botiquines por sucursal y total" } } }
  });
}

function recordsToRows(records) {
  return records.map((r) => ({
    ESTADO: r.estado,
    Prioridad: r.prioridad,
    "Fecha de la inspección": r.fechaInspeccion,
    Descripción: r.descripcion,
    Responsable: r.responsable,
    Evidencia: r.evidencia ? "Imagen adjunta" : "",
    "Acción Correctiva": r.accionCorrectiva,
    "Fecha límite": r.fechaLimite,
    Resultado: r.resultado ? "Imagen adjunta" : "",
    Empresa: r.empresa,
    Instalaciones: r.instalaciones,
    "Área/Departamento": r.area,
    "Controles Operacionales": r.controlOperacional,
    "Origen del Hallazgo": r.origen,
    "Clasificación del riesgo": r.clasificacionRiesgo,
    "Conformidad/No conformidad": r.conformidad
  }));
}

function exportExcel() {
  const rows = recordsToRows(loadRecords());
  const ws = XLSX.utils.json_to_sheet(rows, {
    header: [
      "ESTADO", "Prioridad", "Fecha de la inspección", "Descripción", "Responsable", "Evidencia",
      "Acción Correctiva", "Fecha límite", "Resultado", "Empresa", "Instalaciones", "Área/Departamento",
      "Controles Operacionales", "Origen del Hallazgo", "Clasificación del riesgo", "Conformidad/No conformidad"
    ]
  });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Inspecciones SSO");
  XLSX.writeFile(wb, "inspecciones_sso.xlsx");
}

function exportPdfBySucursal() {
  const sucursal = sucursalPdfSelect.value;
  if (!sucursal) {
    alert("Seleccione una sucursal para exportar PDF.");
    return;
  }

  const records = loadRecords().filter((r) => r.instalaciones === sucursal);
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "landscape" });

  doc.setFontSize(14);
  doc.text(`Reporte SSO - ${sucursal}`, 14, 14);

  const body = records.map((r) => [
    r.estado,
    r.prioridad,
    r.fechaInspeccion,
    r.descripcion,
    r.responsable,
    r.accionCorrectiva,
    r.fechaLimite,
    r.empresa,
    r.area,
    r.controlOperacional,
    r.origen,
    r.clasificacionRiesgo,
    r.conformidad
  ]);

  doc.autoTable({
    startY: 20,
    head: [[
      "ESTADO", "Prioridad", "Fecha inspección", "Descripción", "Responsable", "Acción Correctiva",
      "Fecha límite", "Empresa", "Área", "Control Operacional", "Origen", "Clasificación", "Conformidad"
    ]],
    body,
    styles: { fontSize: 7 }
  });

  doc.save(`reporte_sso_${sucursal.replace(/\s+/g, "_")}.pdf`);
}

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const user = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value;

  if (user === "admin" && pass === "admin123") {
    loginSection.classList.add("hidden");
    appSection.classList.remove("hidden");
    loginError.textContent = "";
    renderTable();
    return;
  }

  loginError.textContent = "Credenciales inválidas.";
});

logoutBtn.addEventListener("click", () => {
  appSection.classList.add("hidden");
  loginSection.classList.remove("hidden");
  loginForm.reset();
});

inspectionForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const evidenciaFile = document.getElementById("evidencia").files[0];
  const resultadoFile = document.getElementById("resultado").files[0];

  if (!isJpg(evidenciaFile) || !isJpg(resultadoFile)) {
    alert("Solo se permiten imágenes JPG en Evidencia y Resultado.");
    return;
  }

  const nuevo = {
    estado: document.getElementById("estado").value,
    prioridad: document.getElementById("prioridad").value,
    fechaInspeccion: document.getElementById("fechaInspeccion").value,
    descripcion: document.getElementById("descripcion").value,
    responsable: document.getElementById("responsable").value,
    evidencia: await fileToDataUrl(evidenciaFile),
    accionCorrectiva: document.getElementById("accionCorrectiva").value,
    fechaLimite: document.getElementById("fechaLimite").value,
    resultado: await fileToDataUrl(resultadoFile),
    empresa: document.getElementById("empresa").value,
    instalaciones: document.getElementById("instalaciones").value,
    area: document.getElementById("area").value,
    controlOperacional: document.getElementById("controlOperacional").value,
    origen: document.getElementById("origen").value,
    clasificacionRiesgo: document.getElementById("clasificacionRiesgo").value,
    conformidad: document.getElementById("conformidad").value
  };

  const records = loadRecords();
  records.push(nuevo);
  saveRecords(records);
  inspectionForm.reset();
  renderTable();
});

downloadExcelBtn.addEventListener("click", exportExcel);
downloadPdfBtn.addEventListener("click", exportPdfBySucursal);
