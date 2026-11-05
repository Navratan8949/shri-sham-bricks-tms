export const formatINR = (value) => {
  const n = Math.round(Number(value || 0));
  return `₹ ${n.toLocaleString("en-IN")}`;
};
export const localDateString = (date = new Date()) => {
  const d = new Date(date);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 10);
};
export const dateInput = () => localDateString();
