import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import api from "@/services/apiMiddleware";

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (userData) => set({ user: userData, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
      checkHeartbeat: async () => {
        const response = await api.get("/api/heartbeat");
        if (response.status === 200) {
          if (response.data.loggedIn) return true;
        }
        // Heartbeat check failed, so clear session and logout
        console.warn("Heartbeat check failed - logging out");
        set({ user: null, isAuthenticated: false });
        return false;
      },
    }),
    {
      name: "groups-auth-data",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
