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

// Custom Legend payload for top and bottom labels
const customLegendPayload = [
  { value: "Weak", type: "square", color: "#e36161" },
  { value: "Medium", type: "square", color: "#e3d661" },
  { value: "Strong", type: "square", color: "#61e381" },
];

const ClassSkillsChart = ({ data }) => {
  return (
    <Card className="p-3 shadow h-100">
      <h5 className="text-center mb-3">Skills overview</h5>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data?.skills} layout="vertical">
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

ClassSkillsChart.loadData = async () => {
  const assignment = useBoundStore.getState().getSelectedAssignment();
  if (!assignment || assignment.role !== "lecturer") return null;
  try {
    const res = await api.get(`/api/stats/skills?assignment=${assignment._id}`, {
      genericErrorToasts: false,
    })
    const data = res.data;
    if (!data?.skills || data.skills.length === 0) return null;
    const normalisedSkillsData = Object.keys(data.skills).map((skillName) => {
      const skillRatings = data.skills[skillName];
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
    return {
      skills: normalisedSkillsData,
    };
  } catch (e) {
    return null;
  }
};

export default ClassSkillsChart;
