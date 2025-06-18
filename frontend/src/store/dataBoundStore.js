import { create } from "zustand";
import createAssignmentsStore from "./assignmentsStore";
import { createJSONStorage, persist } from "zustand/middleware";
import createTeamsStore from "./teamsStore";

const resetDataStores = (set) => ({
  resetAll: () => {
    createAssignmentsStore(set).reset();
    createTeamsStore(set).reset();
  },
});

export const useBoundStore = create(
  persist(
    (...a) => ({
      ...createAssignmentsStore(...a),
      ...createTeamsStore(...a),
      ...resetDataStores(...a),
    }),
    {
      name: "bound-store",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
