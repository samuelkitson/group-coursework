import api from "@/services/apiMiddleware";

const initialState = {
  teams: [],
  selectedTeam: null,
};

const createTeamsStore = (set, get) => ({
  ...initialState,
  fetchTeams: async (forceRefresh = false) => {
    // Don't refresh if the teams are already loaded
    if (get().teams.length > 0 && !forceRefresh) return;
    // Now try loading the teams data
    try {
      const response = await api.get("/api/team/mine", { genericErrorToasts: false });
      const teams = response.data.teams;
      set({ teams });
    } catch (error) {
      console.error("Error fetching teams:", error);
    }
  },
  setSelectedTeam: (teamObj) => {
    const { teams } = get();
    // Only update if the team doesn't already exist in the list
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
    const selected =
      teams.find((team) => team._id === selectedTeam) ||
      null;
    return selected;
  },
  updateSelectedTeam: (updatedValues) => {
    // Used to locally reflect changes to the current team, without the
    // need to refresh from the API
    const { teams, selectedTeam } = get();
    if (!selectedTeam) return;

    const index = teams.findIndex((a) => a._id === selectedTeam);
    if (index === -1) return;

    const updatedTeams = [...teams];
    updatedTeams[index] = {
      ...updatedTeams[index],
      ...updatedValues,
    };

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
