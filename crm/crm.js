const API = "https://restless-leaf-4a87.lobanov0710.workers.dev";

const container = document.getElementById("orders");

let statusFilter = "all";
let tariffFilter = "all";

// =========================
// FILTER UI
// =========================
document.getElementById("statusFilter")?.addEventListener("change", (e) => {
  statusFilter = e.target.value;
  loadOrders();
});

document.getElementById("tariffFilter")?.addEventListener("change", (e) => {
  tariffFilter = e.target.value;
  loadOrders();
});

// =========================
// NORMALIZE STATUS
// =========================
function normalizeStatus(s) {
  if (!s) return "new";
  s = String(s).toLowerCase();

  if (s === "новый") return "new";
  if (s === "взят") return "taken";
  if (s === "завершено") return "done";

  return s;
}

// =========================
// LOAD ORDERS
// =========================
async function loadOrders() {
  try {
    const res = await fetch(API + "/orders?t=" + Date.now());
    const data = await res.json();

    if (!Array.isArray(data)) return;

    render(data);

  } catch (e) {
    console.error("LOAD ERROR", e);
  }
}

// =========================
// RENDER (FIXED STABLE VERSION)
// =========================
function render(list) {

  if (!container) return;

  const filtered = list
    .filter(o => {

      if (!o?.id) return false;

      const status = normalizeStatus(o.status);
      const tariff = (o.tariff || "comfort").toLowerCase();

      const statusOk =
        statusFilter === "all" || status === statusFilter;

      const tariffOk =
        tariffFilter === "all" || tariff === tariffFilter;

      return statusOk && tariffOk;
    })
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  // 🔥 ВАЖНО: полная перерисовка (СТАБИЛЬНО)
  container.innerHTML = "";

  filtered.forEach(order => {

    if (!order?.id) return;

    const status = normalizeStatus(order.status);
    const tariff = (order.tariff || "comfort").toLowerCase();

    const el = document.createElement("div");
    el.className = `order status-${status}`;

    el.innerHTML = `
      <b>#${order.id}</b> (${status})<br>
      🚗 ${order.from || "-"} → ${order.to || "-"}<br>
      🚕 тариф: <b>${tariff}</b><br>
      💰 ${order.price || 0} ₽ |
      📏 ${order.distance || 0} км |
      ⏱ ${order.duration || 0} мин<br><br>

      <button onclick="updateStatus('${order.id}', 'взят')">Взять</button>
      <button onclick="updateStatus('${order.id}', 'завершено')">Завершить</button>
    `;

    container.appendChild(el);
  });
}

// =========================
// UPDATE STATUS
// =========================
async function updateStatus(id, status) {
  try {
    await fetch(API + "/orders", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status })
    });

    loadOrders();

  } catch (e) {
    console.error("UPDATE ERROR", e);
  }
}

// =========================
// LOOP
// =========================
setInterval(loadOrders, 3000);
loadOrders();

// global
window.updateStatus = updateStatus;