import { drawRoute } from "./map.js";

const API = "https://restless-leaf-4a87.lobanov0710.workers.dev";

export function initCalculator() {

  const form = document.getElementById("calcForm");
  const result = document.getElementById("result");

  if (!form || !result) {
    console.error("❌ calcForm или result не найдены");
    return;
  }

  const fromInput = document.getElementById("from");
  const toInput = document.getElementById("to");
  const button = form.querySelector("button");

  let selectedTariff = "comfort";
  let isLoading = false;

  // ==========================
  // TARIF SWITCH
  // ==========================
  document.querySelectorAll(".tariff-card").forEach(card => {
    card.addEventListener("click", () => {

      document.querySelectorAll(".tariff-card")
        .forEach(c => c.classList.remove("active"));

      card.classList.add("active");

      selectedTariff = (card.dataset.tariff || "comfort").toLowerCase();

      console.log("🚕 Tariff:", selectedTariff);
    });
  });

  // ==========================
  // SUBMIT
  // ==========================
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (isLoading) return; // 🔥 FIX DOUBLE SUBMIT

    const from = (fromInput?.value || "").trim();
    const to = (toInput?.value || "").trim();

    if (!from || !to) {
      result.innerText = "Введите адреса";
      return;
    }

    isLoading = true;
    button.disabled = true;
    button.textContent = "⏳ считаем...";
    result.innerText = "⏳ расчёт...";

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {

      const tariff = ["comfort", "business", "minivan"].includes(selectedTariff)
        ? selectedTariff
        : "comfort";

      const payload = { from, to, tariff };

      console.log("📦 SEND:", payload);

      // ==========================
      // 1. CALCULATE
      // ==========================
      const res = await fetch(`${API}/calculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      const data = await res.json().catch(() => null);

      console.log("📥 CALC RESPONSE:", res.status, data);

      if (!res.ok) {
        result.innerText = data?.error || `Ошибка сервера (${res.status})`;
        return;
      }

      if (!data) {
        result.innerText = "Пустой ответ сервера";
        return;
      }

      const distance = Number(data.distance || 0);
      const duration = Number(data.duration || 0);
      const price = Number(data.price || 0);

      if (distance <= 0) {
        result.innerText = "Маршрут не найден";
        return;
      }

      const hours = Math.floor(duration / 60);
      const minutes = duration % 60;

      // ==========================
      // UI
      // ==========================
      result.innerHTML = `
        🚗 ${distance.toFixed(1)} км<br>
        ⏱ ${hours} ч ${minutes} мин<br>
        💰 <b>${price} ₽</b><br><br>
        <a href="#tgForm" class="btn">🚖 Забронировать поездку</a>
      `;

      result.classList.add("show");

      // ==========================
      // STATE (NO MANUAL ID)
      // ==========================
      const orderData = {
        from,
        to,
        price,
        distance,
        duration,
        tariff
      };

      window.appState = orderData;

      console.log("🧠 STATE:", window.appState);

      window.dispatchEvent(new CustomEvent("routeCalculated", {
        detail: orderData
      }));

      // ==========================
      // MAP SAFE DRAW
      // ==========================
      if (data.route) {
        try {
          drawRoute(data.route);
        } catch (e) {
          console.error("Map error:", e);
        }
      }

      // ==========================
      // 2. CREATE ORDER (CRM FIXED)
      // ==========================
      const orderRes = await fetch(`${API}/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData)
      });

      const order = await orderRes.json().catch(() => null);

      console.log("📦 ORDER CREATED:", order);

    } catch (e) {

      console.error("❌ CALC ERROR:", e);

      if (e.name === "AbortError") {
        result.innerText = "Сервер не отвечает (таймаут)";
      } else {
        result.innerText = "Ошибка сети";
      }

    } finally {
      clearTimeout(timeout);
      button.disabled = false;
      button.textContent = "Рассчитать";
      isLoading = false;
    }
  });
}