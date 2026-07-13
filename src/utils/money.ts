export function formatMoney(value = 0, currency = "BDT") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "BDT",
    maximumFractionDigits: currency === "BDT" ? 0 : 2,
  }).format(Number(value) || 0);
}
