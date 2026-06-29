/* ==========================================================================
   Truck & Bus Radial Tire Telemetry Simulator
   Version 2
   Keep simulation behavior intact, but with a cleaner modular structure.
   ========================================================================== */

/* -----------------------------
   Core configuration
-------------------------------- */
const OPTIMAL_TEMP = 75;
const WHEEL_IDS = ["FL", "FR", "RL", "RR"];
const UPDATE_INTERVAL_MS = 1500;
const WERELIFE_THRESHOLD_MINUTES = 25;

/* -----------------------------
   Application state
-------------------------------- */
const state = {
  selectedWheel: "FL",
  ticks: 0,
  startTime: Date.now(),
  wheels: {},
  chartHistory: [],
  lastPacketTime: Date.now()
};

/* -----------------------------
   DOM cache
-------------------------------- */
const el = {
  liveClock: document.getElementById("liveClock"),
  fleetClock: document.getElementById("fleetClock"),
  systemUptime: document.getElementById("systemUptime"),
  packetRate: document.getElementById("packetRate"),
  selectedWheelName: document.getElementById("selectedWheelName"),
  selectedWheelStatus: document.getElementById("selectedWheelStatus"),
  temperatureValue: document.getElementById("temperatureValue"),
  pressureValue: document.getElementById("pressureValue"),
  efficiencyValue: document.getElementById("efficiencyValue"),
  wearValue: document.getElementById("wearValue"),
  riskValue: document.getElementById("riskValue"),
  fleetHealthValue: document.getElementById("fleetHealthValue"),
  fleetHealthText: document.getElementById("fleetHealthText"),
  liveMessage: document.getElementById("liveMessage"),
  systemStatusText: document.getElementById("systemStatusText"),
  systemStatusDetail: document.getElementById("systemStatusDetail"),
  connectionStatus: document.getElementById("connectionStatus"),
  heatSlider: document.getElementById("heatSlider"),
  heatBtn: document.getElementById("heatBtn"),
  coolBtn: document.getElementById("coolBtn"),
  resetBtn: document.getElementById("resetBtn"),
  temperatureBar: document.getElementById("temperatureBar"),
  pressureBar: document.getElementById("pressureBar"),
  efficiencyBar: document.getElementById("efficiencyBar"),
  wearBar: document.getElementById("wearBar"),
  riskBar: document.getElementById("riskBar"),
  fleetHealthBar: document.getElementById("fleetHealthBar"),
  chart: document.getElementById("tempChart")
};

const ctx = el.chart.getContext("2d");

/* -----------------------------
   Utility helpers
-------------------------------- */
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function formatTime(ms) {
  const total = Math.floor(ms / 1000);
  const hh = String(Math.floor(total / 3600)).padStart(2, "0");
  const mm = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function getClockString(date = new Date()) {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function statusFromTemp(temp) {
  if (temp <= 75) return { label: "Optimal", color: "green" };
  if (temp <= 90) return { label: "Elevated", color: "yellow" };
  return { label: "Overheating", color: "red" };
}

function progressClassForValue(value) {
  if (value > 66) return "green";
  if (value > 33) return "yellow";
  return "red";
}

/* -----------------------------
   Wheel initialization
-------------------------------- */
function createWheel(id, baseTemp) {
  state.wheels[id] = {
    temp: baseTemp,
    pressure: rand(96, 102),
    heatMinutes: 0,
    history: Array(120).fill(baseTemp)
  };
}

createWheel("FL", 68);
createWheel("FR", 70);
createWheel("RL", 73);
createWheel("RR", 69);

/* -----------------------------
   Simulation model
   Preserves original behavior:
   - each wheel simulates continuously
   - selected wheel receives additional heating from slider
   - pressure drifts with temperature
   - scores update from temperature exposure
-------------------------------- */
function updatePhysics() {
  state.ticks += 1;

  WHEEL_IDS.forEach((id, index) => {
    const wheel = state.wheels[id];
    const phase = index;
    const ambient = 64 + Math.sin(state.ticks / 18 + phase) * 1.2;

    const drift = (wheel.temp - ambient) * -0.035;
    const randomWalk = rand(-0.22, 0.35);
    const selectedBoost =
      id === state.selectedWheel
        ? (parseInt(el.heatSlider.value, 10) / 100) * 2.8
        : 0;

    wheel.temp = clamp(wheel.temp + drift + randomWalk + selectedBoost, 55, 110);
    wheel.pressure = clamp(
      wheel.pressure + rand(-0.08, 0.08) - Math.max(0, wheel.temp - 85) * 0.003,
      88,
      110
    );

    if (wheel.temp > OPTIMAL_TEMP) {
      wheel.heatMinutes += 1.5;
    } else {
      wheel.heatMinutes = Math.max(0, wheel.heatMinutes - 0.4);
    }

    wheel.history.push(wheel.temp);
    if (wheel.history.length > 120) wheel.history.shift();
  });

  state.lastPacketTime = Date.now();
}

/* -----------------------------
   Score calculations
   Commented for easy recalibration
-------------------------------- */
function computeScores(wheel) {
  const aboveMinutes = wheel.heatMinutes / 60;
  const heatExcess = Math.max(0, wheel.heatMinutes - WERELIFE_THRESHOLD_MINUTES);

  // Efficiency Score: linear drop with time spent above optimal band
  const efficiency = clamp(100 - aboveMinutes * 3.2, 0, 100);

  // Wear-Life Score: slower decay using cumulative minutes above threshold
  const wearLife = clamp(100 - aboveMinutes * 2.0, 0, 100);

  // Retread Risk Score: rises once cumulative heat exposure crosses threshold
  const retreadRisk = clamp(heatExcess * 4.5, 0, 100);

  return {
    efficiency,
    wearLife,
    retreadRisk
  };
}

function computeFleetHealth() {
  const total = WHEEL_IDS.reduce((sum, id) => sum + computeScores(state.wheels[id]).efficiency, 0);
  return clamp(total / WHEEL_IDS.length, 0, 100);
}

/* -----------------------------
   UI updates
-------------------------------- */
function updateWheelSVG() {
  document.querySelectorAll(".wheel-group").forEach(group => {
    const id = group.dataset.wheel;
    const wheel = state.wheels[id];
    const status = statusFromTemp(wheel.temp);

    group.classList.toggle("selected", id === state.selectedWheel);

    const body = group.querySelector(".wheel-body");
    const glow = group.querySelector(".wheel-glow");

    if (body) {
      if (status.color === "green") body.setAttribute("stroke", "#34C759");
      else if (status.color === "yellow") body.setAttribute("stroke", "#F6C343");
      else body.setAttribute("stroke", "#FF5A5F");
    }

    if (glow) {
      if (status.color === "green") glow.setAttribute("fill", "rgba(52,199,89,.12)");
      else if (status.color === "yellow") glow.setAttribute("fill", "rgba(246,195,67,.12)");
      else glow.setAttribute("fill", "rgba(255,90,95,.12)");
    }
  });
}

function updateDashboard() {
  const wheel = state.wheels[state.selectedWheel];
  const scores = computeScores(wheel);
  const status = statusFromTemp(wheel.temp);
  const fleetHealth = computeFleetHealth();

  el.selectedWheelName.textContent = state.selectedWheel;
  el.selectedWheelStatus.textContent = status.label;

  el.temperatureValue.textContent = wheel.temp.toFixed(1);
  el.pressureValue.textContent = wheel.pressure.toFixed(1);
  el.efficiencyValue.textContent = Math.round(scores.efficiency);
  el.wearValue.textContent = Math.round(scores.wearLife);
  el.riskValue.textContent = Math.round(scores.retreadRisk);
  el.fleetHealthValue.textContent = Math.round(fleetHealth);
  el.fleetHealthText.textContent = `${Math.round(fleetHealth)}%`;

  const tempBarWidth = clamp((wheel.temp / 110) * 100, 0, 100);
  const pressureBarWidth = clamp(((wheel.pressure - 88) / (110 - 88)) * 100, 0, 100);

  el.temperatureBar.style.width = `${tempBarWidth}%`;
  el.pressureBar.style.width = `${pressureBarWidth}%`;
  el.efficiencyBar.style.width = `${scores.efficiency}%`;
  el.wearBar.style.width = `${scores.wearLife}%`;
  el.riskBar.style.width = `${scores.retreadRisk}%`;
  el.fleetHealthBar.style.width = `${fleetHealth}%`;

  setProgressStyle(el.temperatureBar, status.color);
  setProgressStyle(el.pressureBar, "blue");
  setProgressStyle(el.efficiencyBar, progressClassForValue(scores.efficiency));
  setProgressStyle(el.wearBar, progressClassForValue(scores.wearLife));
  setProgressStyle(el.riskBar, progressClassForValue(100 - scores.retreadRisk));
  setProgressStyle(el.fleetHealthBar, progressClassForValue(fleetHealth));

  el.liveMessage.textContent = generateLiveMessage(state.selectedWheel, wheel, scores, status);
  el.systemStatusText.textContent = "System Online";
  el.systemStatusDetail.textContent = "Simulated telemetry active";
  el.connectionStatus.textContent = "Connected";
}

function setProgressStyle(element, mode) {
  element.classList.remove("progress-line__fill--green", "progress-line__fill--yellow", "progress-line__fill--blue");

  if (mode === "blue") {
    element.classList.add("progress-line__fill--blue");
  } else if (mode === "green") {
    element.classList.add("progress-line__fill--green");
  } else if (mode === "yellow") {
    element.classList.add("progress-line__fill--yellow");
  } else if (mode === "red") {
    element.style.background = "linear-gradient(90deg, #FF5A5F, #ff8689)";
  } else if (mode === "greenish") {
    element.style.background = "linear-gradient(90deg, #34C759, #96f3ae)";
  } else if (mode === "yellowish") {
    element.style.background = "linear-gradient(90deg, #F6C343, #ffe08b)";
  }
}

function generateLiveMessage(id, wheel, scores, status) {
  const minutes = Math.round(wheel.heatMinutes / 60);
  if (minutes > 3) {
    return `${id} has been above optimal temperature for ${minutes} minutes — efficiency score falling, retread risk rising.`;
  }
  return `${id} is being monitored live; when temperature stays above 75°C, efficiency and wear-life scores decline.`;
}

/* -----------------------------
   Clock and uptime
-------------------------------- */
function updateClocks() {
  const now = new Date();
  const clock = getClockString(now);
  const uptime = formatTime(Date.now() - state.startTime);

  el.liveClock.textContent = clock;
  el.fleetClock.textContent = clock;
  el.systemUptime.textContent = uptime;

  const packetRate = 1000 / UPDATE_INTERVAL_MS;
  el.packetRate.textContent = `${packetRate.toFixed(2)} Hz`;
}

/* -----------------------------
   Chart rendering
   Smooth curves, grid, threshold band, 75°C reference
-------------------------------- */
function drawChart() {
  const wheel = state.wheels[state.selectedWheel];
  const history = wheel.history;

  const width = el.chart.width;
  const height = el.chart.height;
  const pad = { left: 72, right: 30, top: 28, bottom: 58 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  ctx.clearRect(0, 0, width, height);

  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, "#0f1721");
  bg.addColorStop(1, "#081018");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  const safeBand = ctx.createLinearGradient(0, pad.top, 0, pad.top + plotH);
  safeBand.addColorStop(0, "rgba(52,199,89,.12)");
  safeBand.addColorStop(1, "rgba(52,199,89,.04)");

  const elevatedBand = ctx.createLinearGradient(0, pad.top, 0, pad.top + plotH);
  elevatedBand.addColorStop(0, "rgba(246,195,67,.10)");
  elevatedBand.addColorStop(1, "rgba(246,195,67,.03)");

  ctx.fillStyle = safeBand;
  ctx.fillRect(pad.left, pad.top, plotW, plotH * 0.42);

  ctx.fillStyle = elevatedBand;
  ctx.fillRect(pad.left, pad.top + plotH * 0.42, plotW, plotH * 0.24);

  ctx.fillStyle = "rgba(255,90,95,.06)";
  ctx.fillRect(pad.left, pad.top + plotH * 0.66, plotW, plotH * 0.34);

  ctx.strokeStyle = "rgba(255,255,255,.06)";
  ctx.lineWidth = 1;

  for (let i = 0; i <= 6; i++) {
    const y = pad.top + (plotH / 6) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(width - pad.right, y);
    ctx.stroke();
  }

  for (let i = 0; i <= 10; i++) {
    const x = pad.left + (plotW / 10) * i;
    ctx.beginPath();
    ctx.moveTo(x, pad.top);
    ctx.lineTo(x, pad.top + plotH);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(255,255,255,.14)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pad.left, pad.top + plotH);
  ctx.lineTo(width - pad.right, pad.top + plotH);
  ctx.stroke();

  const min = 50;
  const max = 110;
  const y75 = pad.top + plotH * (1 - (75 - min) / (max - min));

  ctx.save();
  ctx.setLineDash([10, 8]);
  ctx.strokeStyle = "#F6C343";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pad.left, y75);
  ctx.lineTo(width - pad.right, y75);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = "#F6C343";
  ctx.font = "bold 14px Segoe UI, Arial";
  ctx.fillText("75°C reference", pad.left + 8, y75 - 8);

  const points = history.map((v, index) => {
    const x = pad.left + (plotW / (history.length - 1)) * index;
    const y = pad.top + plotH * (1 - (v - min) / (max - min));
    return { x, y, v };
  });

  const lineColor = tempColorForValue(wheel.temp);
  drawSmoothLine(points, lineColor);

  ctx.fillStyle = "#A9BAC8";
  ctx.font = "12px Segoe UI, Arial";
  ctx.fillText("Temperature (°C)", pad.left, 18);
  ctx.fillText("Time →", width - 66, height - 18);

  ctx.fillStyle = "#A9BAC8";
  ctx.font = "12px Segoe UI, Arial";
  for (let i = 0; i <= 6; i++) {
    const value = max - ((max - min) / 6) * i;
    const y = pad.top + (plotH / 6) * i;
    ctx.fillText(value.toFixed(0), 14, y + 4);
  }
}

function tempColorForValue(value) {
  if (value <= 75) return "#34C759";
  if (value <= 90) return "#F6C343";
  return "#FF5A5F";
}

function drawSmoothLine(points, stroke) {
  if (!points.length) return;

  const grad = ctx.createLinearGradient(0, 0, el.chart.width, 0);
  grad.addColorStop(0, stroke);
  grad.addColorStop(1, "#4FC3F7");

  ctx.save();
  ctx.lineWidth = 4;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = grad;
  ctx.shadowColor = stroke;
  ctx.shadowBlur = 10;

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length - 2; i++) {
    const c = (points[i].x + points[i + 1].x) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, c, (points[i].y + points[i + 1].y) / 2);
  }

  const penultimate = points[points.length - 2];
  const last = points[points.length - 1];
  ctx.quadraticCurveTo(penultimate.x, penultimate.y, last.x, last.y);
  ctx.stroke();
  ctx.restore();
}

/* -----------------------------
   Selection and controls
-------------------------------- */
function setSelectedWheel(id) {
  state.selectedWheel = id;
  updateWheelSVG();
  updateDashboard();
  drawChart();
}

function resetSelectedWheel() {
  const wheel = state.wheels[state.selectedWheel];
  wheel.temp = rand(66, 71);
  wheel.pressure = rand(96, 102);
  wheel.heatMinutes = 0;
  wheel.history = Array(120).fill(wheel.temp);
  updateDashboard();
  drawChart();
}

/* -----------------------------
   Event bindings
-------------------------------- */
function bindUI() {
  document.querySelectorAll(".wheel-group").forEach(group => {
    group.addEventListener("click", () => setSelectedWheel(group.dataset.wheel));
    group.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setSelectedWheel(group.dataset.wheel);
      }
    });
  });

  el.heatBtn.addEventListener("click", () => {
    el.heatSlider.value = clamp(+el.heatSlider.value + 10, 0, 100);
    updateDashboard();
    drawChart();
  });

  el.coolBtn.addEventListener("click", () => {
    el.heatSlider.value = clamp(+el.heatSlider.value - 10, 0, 100);
    updateDashboard();
    drawChart();
  });

  el.resetBtn.addEventListener("click", resetSelectedWheel);

  el.heatSlider.addEventListener("input", () => {
    updateDashboard();
    drawChart();
  });

  window.addEventListener("resize", () => {
    drawChart();
  });
}

/* -----------------------------
   Main loop
-------------------------------- */
function tick() {
  updatePhysics();
  updateClocks();
  updateWheelSVG();
  updateDashboard();
  drawChart();
}

function init() {
  bindUI();
  updateClocks();
  updateWheelSVG();
  updateDashboard();
  drawChart();
  tick();
  setInterval(tick, UPDATE_INTERVAL_MS);
  setInterval(updateClocks, 1000);
}

init();
