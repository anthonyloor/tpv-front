export function formatDate(dateString) {
  if (!dateString) return "";
  const dateObj = new Date(dateString);
  if (isNaN(dateObj)) return dateString;
  const dd = String(dateObj.getDate()).padStart(2, "0");
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const yyyy = dateObj.getFullYear();
  const hh = String(dateObj.getHours()).padStart(2, "0");
  const min = String(dateObj.getMinutes()).padStart(2, "0");
  return `${dd}-${mm}-${yyyy} ${hh}:${min}`;
}

export function formatFullDateTime(dateStr) {
  if (!dateStr) return "";
  const cleanStr =
    typeof dateStr === "string" && dateStr.includes(" ")
      ? dateStr.replace(" ", "T")
      : dateStr;
  const d = new Date(cleanStr);
  if (isNaN(d)) return dateStr;
  const weekday = d.toLocaleDateString("es-ES", { weekday: "long" });
  const day = d.toLocaleDateString("es-ES", { day: "2-digit" });
  const month = d.toLocaleDateString("es-ES", { month: "long" });
  const year = d.toLocaleDateString("es-ES", { year: "numeric" });
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  return `${capitalizedWeekday} ${day} de ${month} de ${year} ${hh}:${mm}:${ss}`;
}

export function formatFullDateTimeNoSeconds(dateStr) {
  if (!dateStr) return "";
  const cleanStr =
    typeof dateStr === "string" && dateStr.includes(" ")
      ? dateStr.replace(" ", "T")
      : dateStr;
  const d = new Date(cleanStr);
  if (isNaN(d)) return dateStr;
  const weekday = d.toLocaleDateString("es-ES", { weekday: "long" });
  const day = d.toLocaleDateString("es-ES", { day: "2-digit" });
  const month = d.toLocaleDateString("es-ES", { month: "long" });
  const year = d.toLocaleDateString("es-ES", { year: "numeric" });
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  return `${capitalizedWeekday} ${day} de ${month} de ${year} ${hh}:${mm}`;
}

export function formatLongDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const weekday = d.toLocaleDateString("es-ES", { weekday: "long" });
  const day = d.toLocaleDateString("es-ES", { day: "2-digit" });
  const month = d.toLocaleDateString("es-ES", { month: "long" });
  const year = d.toLocaleDateString("es-ES", { year: "numeric" });
  const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  return `${capitalizedWeekday} ${day} de ${month} de ${year}`;
}

export function formatShortDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}
