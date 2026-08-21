const API = "https://restless-leaf-4a87.lobanov0710.workers.dev";
const DRIVER_ID = "driver_" + Math.floor(Math.random() * 10000);

const box = document.getElementById("orders");

// ==========================
// LOAD ORDERS
// ==========================
async function load() {
    try {
        const res = await fetch(API + "/orders");
        const data = await res.json();

        if (!Array.isArray(data)) return;

        render(data);

    } catch (e) {
        console.error("LOAD ERROR:", e);
    }
}

// ==========================
// RENDER
// ==========================
function render(list) {

    box.innerHTML = "";

    const newOrders = list.filter(o => o.status === "new");

    if (newOrders.length === 0) {
        box.innerHTML = "<p>Нет новых заказов</p>";
        return;
    }

    newOrders.forEach(order => {

        const div = document.createElement("div");
        div.className = "order";

        div.innerHTML = `
            <b>🚗 ${order.from} → ${order.to}</b><br>
            💰 ${order.price} ₽<br>
            🚕 ${order.tariff || "comfort"}<br><br>

            <button onclick="takeOrder('${order.id}')">
                🚖 Взять заказ
            </button>
        `;

        box.appendChild(div);
    });
}

// ==========================
// TAKE ORDER
// ==========================
async function takeOrder(id) {

    try {
        const res = await fetch(API + "/order/take", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                orderId: id,
                driverId: DRIVER_ID
            })
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.error || "Ошибка");
        }

        load();

    } catch (e) {
        console.error("TAKE ERROR:", e);
    }
}

// ==========================
// AUTO REFRESH
// ==========================
setInterval(load, 3000);
load();