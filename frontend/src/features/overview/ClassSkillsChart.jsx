import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, Nav } from "react-bootstrap";
import api from "@/services/apiMiddleware";
import { useBoundStore } from "@/store/dataBoundStore";
import { Link } from "react-router-dom";

// Custom Legend payload for top and bottom labels
const customLegendPayload = [
  { value: "Weak", type: "square", color: "#e36161" },
  { value: "Medium", type: "square", color: "#e3d661" },
  { value: "Strong", type: "square", color: "#61e381" },
];

const ClassSkillsChart = () => {
  const selectedAssignment = useBoundStore((state) =>
    state.getSelectedAssignment(),
  );
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [skillsData, setSkillsData] = useState({});

  // Normalise Likert data to percentages
  const normaliseData = Object.keys(skillsData).map((skillName) => {
    const skillRatings = skillsData[skillName];
    const total = skillRatings.reduce(
      (runningTotal, current) => runningTotal + current,
      0,
    );
    const dataPoint = { name: skillName };
    for (let i = 1; i <= 7; i++) {
      dataPoint[i.toString()] = skillRatings[i - 1];
    }
    return dataPoint;
  });

  const refreshData = () => {
    setSkillsData([]);
    setLoading(true);
    // Get the current required skills
    api
      .get(`/api/stats/skills?assignment=${selectedAssignment._id}`, {
        genericErrorToasts: false,
      })
      .then((resp) => {
        return resp.data;
      })
      .then((data) => {
        setSkillsData(data?.skills ?? []);
        setLoading(false);
        setUnavailable(false);
      })
      .catch((error) => {
        setUnavailable(true);
      });
  };

  // Refresh data on page load
  useEffect(refreshData, [selectedAssignment]);

  if (unavailable)
    return (
      <Card className="p-3">
        <Card.Body>
          <p className="text-muted">Skills overview currently unavailable.</p>
          <p className="text-muted">
            Set up the required skills for {selectedAssignment.name} in the{" "}
            <Link to="/assignment/configure" className="text-muted">
              assignment configuration
            </Link>{" "}
            tab to unlock this insight.
          </p>
        </Card.Body>
      </Card>
    );

  return (
    <Card className="p-3">
      <h5 className="text-center mb-3">Skills overview</h5>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={normaliseData} layout="vertical">
          <YAxis dataKey="name" type="category" textAnchor="end" width={100} />
          <XAxis type="number" />
          <Legend payload={customLegendPayload} />
          <Bar dataKey="1" stackId="a" fill="#e36161" />
          <Bar dataKey="2" stackId="a" fill="#e38861" />
          <Bar dataKey="3" stackId="a" fill="#e3ab61" />
          <Bar dataKey="4" stackId="a" fill="#e3d661" />
          <Bar dataKey="5" stackId="a" fill="#cde361" />
          <Bar dataKey="6" stackId="a" fill="#95e361" />
          <Bar dataKey="7" stackId="a" fill="#61e381" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default ClassSkillsChart;
