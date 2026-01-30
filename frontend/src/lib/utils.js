/*export function capitialize(str) {
  if (typeof str !== "string") return ""; // Return empty string if input isn't a string
  return str.charAt(0).toUpperCase() + str.slice(1);
}*/

export const capitialize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

