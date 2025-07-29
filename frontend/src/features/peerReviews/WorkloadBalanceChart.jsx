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
  ReferenceArea,
} from "recharts";
import { Card } from "react-bootstrap";

const WorkloadBalanceChart = ({normScores, currentStudent, thresholds}) => {
  if (!normScores || !currentStudent) {
    return <></>;
  }

  const studentShortName = (currentStudent ?? " ").split(" ")[0];

  const barColours = Object.keys(normScores).map(name => {
    if (name !== currentStudent) return "#ccc";
    if (normScores[name] > 0) return "#38965a";
    if (normScores[name] < 0) return "#963838";
    return "#ccc";
  });

  const chartData = Object.keys(normScores).map(name => ({
    "Student": name,
    "Net score": normScores[name],
  }));

  const helperText = () => {
    const score = normScores[currentStudent];
    if (score <= thresholds.VERY_LOW) {
      return `${studentShortName}'s effort was very low`;
    } else if (score <= thresholds.LOW) {
      return `${studentShortName}'s effort was too low`;
    } else if (score >= thresholds.VERY_HIGH) {
      return `${studentShortName}'s effort was far too high`;
    } else if (score >= thresholds.HIGH) {
      return `${studentShortName}'s effort was too high`;
    } else {
      return `${studentShortName}'s effort was average`;
    }
  };

  return (
    <div>
      <p className="text-muted text-center mb-0 px-3">{helperText()}</p>
      <ResponsiveContainer width="100%" height={150}>
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="Student" tick={false} axisLine={{ strokeWidth: 0 }} />
          <YAxis domain={[-3, 3]} tickCount={3} />
          <Tooltip cursor={false} />  
          <Bar dataKey="Net score">
            { chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={barColours[index]} />
            )) }
          </Bar>
          <ReferenceLine y={0} stroke="#666" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WorkloadBalanceChart;
