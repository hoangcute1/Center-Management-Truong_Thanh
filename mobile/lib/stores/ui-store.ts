import { Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type ThemeOption = "light" | "dark" | "system";

interface UiState {
  theme: ThemeOption;
  setTheme: (theme: ThemeOption) => void;
  isDark: boolean;
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      theme: "system",
      setTheme: (theme) => set({ theme }),
      get isDark() {
        const currentTheme = get().theme;
        const scheme =
          currentTheme === "system" ? Appearance.getColorScheme() : currentTheme;
        return scheme === "dark";
      },
    }),
    {
      name: "ui-store",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
