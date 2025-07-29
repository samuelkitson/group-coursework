import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
  Rectangle,
  Cell,
  ReferenceLine,
} from "recharts";
import { Card } from "react-bootstrap";
import { calculateAverage } from "@/utility/helpers";

const SkillRatingsChart = ({skillRatings, currentStudent}) => {

  if (!skillRatings || !currentStudent) return <></>;

  const studentRatings = skillRatings[currentStudent];
  if (!studentRatings) return <></>;

  const chartData = Object.keys(studentRatings).map(skill => ({
    "Skill": skill,
    "Peer rating": calculateAverage(studentRatings[skill]),
  }));

  const barColours = chartData.map(skill => {
    const score = skill["Peer rating"];
    if (score <= 2) return "#dc3545";
    if (score <= 3.5) return "#ffc107";
    if (score <= 5) return "#198754";
    return "#ccc";
  });

  const skillsCount = Object.keys(studentRatings).length;

  return (
    <ResponsiveContainer width="100%" height={skillsCount*50 + 50}>
      <BarChart
        layout="vertical" 
        data={chartData}
        margin={{
          top: 15,
          right: 15,
          left: 100,
          bottom: 15,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" dataKey="Peer rating" domain={[0, 5]}/> 
        <YAxis type="category" dataKey="Skill" axisLine={{ strokeWidth: 0 }} /> 
        <Tooltip cursor={false} />
        <Bar dataKey="Peer rating">
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={barColours[index]} />
          ))}
        </Bar>
        <ReferenceLine x={0} stroke="#666" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default SkillRatingsChart;
