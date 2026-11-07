export const formatINR = (value) => {
  const num = Number(value);
  const n = isNaN(num) ? 0 : Math.round(num);
  return `₹ ${n.toLocaleString("en-IN")}`;
};
export const localDateString = (date = new Date()) => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 10);
};
export const dateInput = (d) => localDateString(d || new Date());
