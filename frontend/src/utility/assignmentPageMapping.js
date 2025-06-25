import {
  Map,
  People,
  Shuffle,
  PersonVideo3,
  CardChecklist,
  Tools,
  PersonCheck,
  Eyeglasses,
} from "react-bootstrap-icons";

/**
 * rolesVisible: roles for which the page appears in the menu.
 * rolesHidden: roles for which the page can only be navigated to directly.
 * needsTeam: selectedTeam must be set to navigate to this page.
 */
export const pageMap = [
  { label: "Overview",
    icon: Map,
    link: "/assignment/overview",
    rolesVisible: ["student", "supervisor", "lecturer"],
    statesVisible: ["pre-allocation", "allocation-questions", "allocation", "live", "closed"]
  },
  { label: "Configure",
    icon: Tools,
    link: "/assignment/configure",
    rolesVisible: ["lecturer"],
    statesVisible: ["pre-allocation", "allocation-questions", "allocation", "live", "closed"]
  },
  { label: "Supervisors",
    icon: Eyeglasses,
    link: "/assignment/supervisors",
    rolesVisible: ["lecturer"],
    statesVisible: ["pre-allocation", "allocation-questions", "allocation", "live", "closed"]
  },
  { label: "Students",
    icon: PersonCheck,
    link: "/assignment/students",
    rolesVisible: ["lecturer"],
    statesVisible: ["pre-allocation", "allocation-questions", "allocation", "live", "closed"]
  },
  { label: "Allocation",
    icon: Shuffle,
    link: "/assignment/questionnaire",
    rolesVisible: ["student"],
    statesVisible: ["allocation-questions"]
  },
  { label: "Allocation",
    icon: Shuffle,
    link: "/assignment/allocate",
    rolesVisible: ["lecturer"],
    statesVisible: ["allocation"]
  },
  { label: "Teams",
    icon: People,
    link: "/assignment/teams",
    rolesVisible: ["supervisor", "lecturer"],
    statesVisible: ["live", "closed"]
  },
  { label: "My Team",
    icon: People,
    link: "/assignment/team",
    rolesVisible: ["student"],
    statesVisible: ["live", "closed"],
    needsTeam: true,
  },
  { label: "Meetings",
    icon: PersonVideo3,
    link: "/assignment/meetings",
    rolesVisible: ["student"],
    rolesHidden: ["supervisor", "lecturer"],
    statesVisible: ["live", "closed"],
    needsTeam: true,
  },
  { label: "Check-In",
    icon: CardChecklist,
    link: "/assignment/check-in",
    rolesVisible: ["student"],
    statesVisible: ["live"],
    needsTeam: true,
  },
];

/**
 * Returns a list of the pages that the user is allowed to view.
 * @param {string} assignmentState the current state of the selected assignment.
 * @param {string} userRole the user's role on the selected assignment.
 * @param {boolean} includeHidden if true, include pages that shouldn't be shown in the menu.
 * @returns list of page objects.
 */
export function getAllowedPages(assignmentState, userRole, includeHidden=false) {
  if (includeHidden) {
    return pageMap.filter(p =>
      (p.rolesVisible.includes(userRole) || p?.rolesHidden?.includes(userRole)) &&
      p.statesVisible.includes(assignmentState)
    );
  } else {
    return pageMap.filter(p =>
      (p.rolesVisible.includes(userRole)) &&
      p.statesVisible.includes(assignmentState)
    );
  }
};

/**
 * Checks whether the user should be allowed to view the given page.
 * @param {string} path the path to the page.
 * @param {string} assignmentState the state of the selected assignment.
 * @param {string} userRole the user's role on the selected assignment.
 * @param {boolean} includeHidden if true, allow navigation to pages that aren't shown in the menu.
 * @param {boolean} teamSet if true, a team is currently selected.
 * @returns 
 */
export function isPageAllowed(path, assignmentState, userRole, includeHidden=true, teamSet=false) {
  const page = pageMap.find(p => p.link === path);
  if (page) {
    if (page?.needsTeam && !teamSet) return false;
    if (!page.statesVisible.includes(assignmentState)) return false;
    if (page.rolesVisible.includes(userRole)) return true;
    if (includeHidden && page.rolesHidden.includes(userRole)) return true;
  }
  return false;
};
