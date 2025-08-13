import api from "@/services/apiMiddleware";

const defaultMaxAge = 60 * 60 * 1000; // 1 hour

const initialState = {
  assignments: [],
  selectedAssignment: null,
  hasFetchedAssignments: false,
  fetchPromiseAssignments: null,
  lastFetchedAssignments: null,
};

const createAssignmentsStore = (set, get) => ({
  ...initialState,

  /**
   * Queries the API to update the list of assignments that this user can
   * access.
   * 
   * @param {boolean} forceRefresh if true, fetch even if not expired.
   * @param {integer} maxAge don't refresh if the last fetch was less than this number of milliseconds ago.
   * @returns Promise 
   */
  fetchAssignments: async (forceRefresh=false, maxAge=defaultMaxAge) => {
    const state = get();
    const now = Date.now();
    // If expiration time is set, check if the cached data is still fresh.
    if (!forceRefresh && state.hasFetchedAssignments && state.lastFetchedAssignments && now - state.lastFetchedAssignments < maxAge) {
      return state.assignments;
    }
    // Avoid duplicate in-flight requests.
    if (state.fetchPromiseAssignments) {
      return state.fetchPromiseAssignments;
    }
    // Uses promises to prevent race conditions.
    const promise = (async () => {
      try {
        const response = await api.get("/api/assignment/all");
        const assignments = response.data;
        assignments.sort((a, b) => a.name.localeCompare(b.name));
        set({
          assignments,
          hasFetchedAssignments: true,
          fetchPromiseAssignments: null,
          lastFetchedAssignments: Date.now(),
        });
        return assignments;
      } catch (error) {
        console.error("Error refreshing assignments store:", error);
        set({ fetchPromiseAssignments: null });
        throw error;
      }
    })();
    set({ fetchPromiseAssignments: promise });
    return promise;
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
