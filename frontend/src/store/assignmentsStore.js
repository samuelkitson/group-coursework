import api from "@/services/apiMiddleware";

const initialState = {
  assignments: [],
  selectedAssignment: null,
};

const createAssignmentsStore = (set, get) => ({
  ...initialState,
  fetchAssignments: async (forceRefresh = false) => {
    // Don't refresh if the assignments are already loaded
    if (get().assignments.length > 0 && !forceRefresh) return;
    // Now try loading the assignments data
    try {
      const response = await api.get("/api/assignment/all");
      const assignments = response.data;
      assignments.sort((a, b) => a.name.localeCompare(b.name));
      set({ assignments });
    } catch (error) {
      console.error("Error fetching assignments:", error);
    }
  },
  setSelectedAssignment: (id) => set({ selectedAssignment: id }),
  getSelectedAssignment: () => {
    const { assignments, selectedAssignment } = get();
    const selected =
      assignments.find((assignment) => assignment._id === selectedAssignment) ||
      null;
    return selected;
  },
  updateSelectedAssignment: (updatedValues) => {
    // Used to locally reflect changes to the current assignment, without the
    // need to refresh from the API
    const { assignments, selectedAssignment } = get();
    if (!selectedAssignment) return;

    const index = assignments.findIndex((a) => a._id === selectedAssignment);
    if (index === -1) return;

    const updatedAssignments = [...assignments];
    updatedAssignments[index] = {
      ...updatedAssignments[index],
      ...updatedValues,
    };

    set({ assignments: updatedAssignments });
  },
  reset: () => set(initialState),
});

export default createAssignmentsStore;
