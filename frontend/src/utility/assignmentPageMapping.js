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
    statesVisible: ["live", "closed"]
  },
  { label: "Meetings",
    icon: PersonVideo3,
    link: "/assignment/meetings",
    rolesVisible: ["student"],
    statesVisible: ["live", "closed"]
  },
  { label: "Check-In",
    icon: CardChecklist,
    link: "/assignment/check-in",
    rolesVisible: ["student"],
    statesVisible: ["live"]
  },
];

export function getAllowedPages(assignmentState, userRole) {
  return pageMap.filter(p =>
    p.rolesVisible.includes(userRole) &&
    p.statesVisible.includes(assignmentState)
  );
};

export function isPageAllowed(path, assignmentState, userRole) {
  const page = pageMap.find(p => p.link === path);
  if (page) {
    if (page.rolesVisible.includes(userRole) && page.statesVisible.includes(assignmentState)) {
      return true;
    }
  }
  return false;
};
