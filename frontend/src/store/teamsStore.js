import api from "@/services/apiMiddleware";

const defaultMaxAge = 60 * 60 * 1000; // 1 hour

const initialState = {
  teams: [],
  selectedTeam: null,
  hasFetched: false,
  fetchPromise: null,
  lastFetched: null,
};

const createTeamsStore = (set, get) => ({
  ...initialState,

  /**
   * Queries the API to update the list of teams that this user is a member or
   * supervisor of.
   * 
   * @param {boolean} forceRefresh if true, fetch even if not expired.
   * @param {integer} maxAge don't refresh if the last fetch was less than this number of milliseconds ago.
   * @returns Promise 
   */
  fetchTeams: async (forceRefresh=false, maxAge=defaultMaxAge) => {
    const state = get();
    const now = Date.now();
    // If expiration time is set, check if the cached data is still fresh.
    if (!forceRefresh && state.hasFetched && state.lastFetched && now - state.lastFetched < maxAge) {
      return state.teams;
    }
    // Avoid duplicate in-flight requests.
    if (state.fetchPromise) {
      return state.fetchPromise;
    }
    // Uses promises to prevent race conditions.
    const promise = (async () => {
      try {
        const response = await api.get("/api/team/mine", {
          genericErrorToasts: false,
        });
        const teams = response.data.teams || [];
        set({
          teams,
          hasFetched: true,
          fetchPromise: null,
          lastFetched: Date.now(),
        });
        return teams;
      } catch (error) {
        console.error("Error refreshing teams store:", error);
        set({ fetchPromise: null });
        throw error;
      }
    })();

    set({ fetchPromise: promise });
    return promise;
  },

  setSelectedTeam: (teamObj) => {
    const { teams } = get();
    const exists = teams.some((team) => team._id === teamObj._id);
    const updatedTeams = exists ? teams : [...teams, teamObj];
    set({
      teams: updatedTeams,
      selectedTeam: teamObj._id,
    });
  },

  setTeamById: (id) => set({ selectedTeam: id }),

  getSelectedTeam: () => {
    const { teams, selectedTeam } = get();
    return teams.find((team) => team._id === selectedTeam) || null;
  },

  updateSelectedTeam: (updatedValues) => {
    const { teams, selectedTeam } = get();
    if (!selectedTeam) return;
    const index = teams.findIndex((a) => a._id === selectedTeam);
    if (index === -1) return;
    const updatedTeams = [...teams];
    updatedTeams[index] = { ...updatedTeams[index], ...updatedValues };
    set({ teams: updatedTeams });
  },

  setTeamByAssignment: (assignment) => {
    const { teams } = get();
    const foundTeam = teams.find((team) => team.assignment === assignment);
    set({ selectedTeam: foundTeam ? foundTeam._id : null });
  },

  reset: () => set(initialState),
});

export default createTeamsStore;

