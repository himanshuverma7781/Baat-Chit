import { create } from "zustand";

export const useThemeStore = create((set) => ({
  theme: localStorage.getItem("Baat-Chit-theme") || "coffee",
  setTheme: (theme) => {
    localStorage.setItem("Baat-Chit-theme", theme);
    const htmlElement = document.querySelector('html');
    if (htmlElement) {
      htmlElement.setAttribute('data-theme', theme);
    }
    set({ theme });
  },
}));