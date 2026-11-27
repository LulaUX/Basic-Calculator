"use strict";

const POWER_WP = 12000000;
const BASE_CENTS = 840000000;
const COST_FIELDS = ["modules", "inverters", "structure", "civil", "other"];
// Keeps the sum of five amounts within JavaScript's exact integer range.
const MAX_CENTS = Math.floor(Number.MAX_SAFE_INTEGER / COST_FIELDS.length);
const euroFormat = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
const rateFormat = new Intl.NumberFormat("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 6 });

function parseAmount(raw) {
  const value = raw.trim();
  if (value === "") return { state: "empty" };
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(value)) {
    return { state: "invalid", message: "Ingresen un importe no negativo con hasta dos decimales, sin separadores de miles." };
  }
  const [whole, fraction = ""] = value.replace(",", ".").split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents) || cents > MAX_CENTS) {
    return { state: "invalid", message: "El importe supera el límite de cálculo exacto. Ingresen un importe menor." };
  }
  return { state: "valid", cents };
}

function perWp(cents) {
  return cents / 100 / POWER_WP;
}

function compareAmounts(offerCents, referenceCents) {
  const difference = offerCents - referenceCents;
  if (difference === 0) return "Igual · diferencia: 0,00 €/Wp.";
  const rate = Math.abs(perWp(difference));
  // Avoid describing a nonzero difference as zero after display rounding.
  const display = rate < 0.0000005 ? "menos de 0,000001" : rateFormat.format(rate);
  return `${difference > 0 ? "Por encima" : "Por debajo"} · diferencia: ${display} €/Wp.`;
}

function summarizeCosts(values) {
  const invalid = values.some(value => value.state === "invalid");
  const valid = values.filter(value => value.state === "valid");
  return {
    invalid,
    count: valid.length,
    complete: !invalid && valid.length === COST_FIELDS.length,
    cents: valid.reduce((sum, value) => sum + value.cents, 0)
  };
}

const COST_LABELS = ["Módulos", "Inversores", "Estructura", "Obra civil", "Otros"];

function buildCommitteeSummary(rawValues) {
  const values = COST_FIELDS.map(id => parseAmount(rawValues[id] || ""));
  const costs = summarizeCosts(values);
  const offer = parseAmount(rawValues.offer || "");
  const amount = value => value.state === "valid"
    ? euroFormat.format(value.cents / 100)
    : value.state === "invalid" ? "pendiente (importe inválido)" : "pendiente";
  const rate = cents => `${rateFormat.format(perWp(cents))} €/Wp`;
  const lines = [
    "Resumen para el comité · importes sin IVA",
    "Potencia: 12 MWp (12.000.000 Wp).",
    `Presupuesto base: ${euroFormat.format(BASE_CENTS / 100)} · ${rate(BASE_CENTS)}.`,
    ...values.map((value, index) => `${COST_LABELS[index]}: ${amount(value)}.`),
    costs.invalid || costs.count === 0
      ? "Coste total: pendiente."
      : `${costs.complete ? "Coste total" : `Suma parcial (${costs.count}/5 partidas; total pendiente)`}: ${euroFormat.format(costs.cents / 100)} · ${rate(costs.cents)}.`,
    `Precio de oferta: ${amount(offer)}${offer.state === "valid" ? ` · ${rate(offer.cents)}` : ""}.`,
    `Oferta frente al coste total: ${offer.state === "valid" && costs.complete ? compareAmounts(offer.cents, costs.cents) : "pendiente."}`,
    `Oferta frente al presupuesto base: ${offer.state === "valid" ? compareAmounts(offer.cents, BASE_CENTS) : "pendiente."}`
  ];
  return lines.join("\n");
}

function renderRateChart(doc, costs, offer) {
  const entries = [
    { id: "cost", cents: costs.complete ? costs.cents : null },
    { id: "offer", cents: offer.state === "valid" ? offer.cents : null },
    { id: "base", cents: BASE_CENTS }
  ];
  const rates = entries.map(entry => entry.cents === null ? null : perWp(entry.cents));
  const maximum = Math.max(...rates.filter(rate => rate !== null));
  entries.forEach((entry, index) => {
    const rate = rates[index];
    doc.getElementById(`chart-${entry.id}`).dataset.state = rate === null ? "pending" : "valid";
    doc.getElementById(`chart-${entry.id}-value`).textContent = rate === null ? "pendiente" : `${rateFormat.format(rate)} €/Wp`;
    doc.getElementById(`chart-${entry.id}-bar`).style.height = `${rate === null ? 0 : rate / maximum * 100}%`;
  });
  doc.getElementById("chart-scale").textContent = `Escala: 0 a ${rateFormat.format(maximum)} €/Wp.`;
}

function initCalculator(doc) {
  const form = doc.getElementById("offer-form");
  const put = (id, text) => { doc.getElementById(id).textContent = text; };
  function read(id) {
    const field = doc.getElementById(id);
    const parsed = parseAmount(field.value);
    field.setAttribute("aria-invalid", String(parsed.state === "invalid"));
    put(`${id}-error`, parsed.message || "");
    return parsed;
  }
  const copyButton = doc.getElementById("copy-summary");
  const copyStatus = doc.getElementById("copy-status");
  const manualCopy = doc.getElementById("manual-copy");
  const summaryText = doc.getElementById("summary-text");
  let revision = 0;
  function update() {
    revision += 1;
    copyStatus.textContent = "";
    manualCopy.hidden = true;
    summaryText.value = "";
    const costs = summarizeCosts(COST_FIELDS.map(read));
    const offer = read("offer");
    put("cost-label", costs.complete ? "Coste total" : "Suma parcial");
    put("cost-rate-label", costs.complete ? "Coste por Wp" : "Coste parcial por Wp");
    const showCosts = !costs.invalid && costs.count > 0;
    put("cost-total", showCosts ? euroFormat.format(costs.cents / 100) : "—");
    put("cost-rate", showCosts ? `${rateFormat.format(perWp(costs.cents))} €/Wp` : "—");
    put("cost-status", costs.invalid ? "Corrijan los importes inválidos para calcular los costes." : costs.complete ? "Cinco partidas completas · sin IVA." : `${costs.count} de 5 partidas completas. Los campos vacíos siguen pendientes.`);
    put("offer-rate", offer.state === "valid" ? `${rateFormat.format(perWp(offer.cents))} €/Wp` : "—");
    put("cost-comparison", offer.state === "valid" && costs.complete ? compareAmounts(offer.cents, costs.cents) : "Pendiente: ingresen una oferta válida y completen las cinco partidas.");
    put("base-comparison", offer.state === "valid" ? compareAmounts(offer.cents, BASE_CENTS) : "Pendiente: ingresen un precio de oferta válido.");
    renderRateChart(doc, costs, offer);
  }
  copyButton.addEventListener("click", async () => {
    const rawValues = Object.fromEntries([...COST_FIELDS, "offer"].map(id => [id, doc.getElementById(id).value]));
    const text = buildCommitteeSummary(rawValues);
    const copiedRevision = revision;
    copyButton.disabled = true;
    try {
      const clipboard = doc.defaultView.navigator.clipboard;
      if (!clipboard || typeof clipboard.writeText !== "function") throw new Error("Clipboard unavailable");
      await clipboard.writeText(text);
      copyStatus.textContent = revision === copiedRevision
        ? "Resumen copiado al portapapeles."
        : "Se copió el resumen anterior. Los datos cambiaron; vuelvan a copiar.";
    } catch {
      if (revision === copiedRevision) {
        summaryText.value = text;
        manualCopy.hidden = false;
        summaryText.focus();
        summaryText.select();
        copyStatus.textContent = "No se pudo copiar automáticamente. Copien el texto seleccionado con Ctrl+C o con la opción Copiar de su dispositivo.";
      } else {
        copyStatus.textContent = "Los datos cambiaron; vuelvan a copiar el resumen actualizado.";
      }
    } finally {
      copyButton.disabled = false;
    }
  });
  form.addEventListener("input", update);
  form.addEventListener("submit", event => event.preventDefault());
  form.addEventListener("reset", event => {
    event.preventDefault();
    [...COST_FIELDS, "offer"].forEach(id => { doc.getElementById(id).value = ""; });
    update();
  });
  update();
}

if (typeof document !== "undefined") initCalculator(document);
if (typeof module !== "undefined") {
  module.exports = { parseAmount, perWp, compareAmounts, summarizeCosts, initCalculator, buildCommitteeSummary };
}
