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

const WorkloadBalanceChart = ({netScores, currentStudent}) => {

  if (!netScores || !currentStudent) {
    return <></>;
  }

  const barColours = Object.keys(netScores).map(name => {
    if (name !== currentStudent) return "#ccc";
    if (netScores[name] > 0) return "#38965a";
    if (netScores[name] < 0) return "#963838";
    return "#ccc";
  });

  const chartData = Object.keys(netScores).map(name => ({
    "Student": name,
    "Net score": netScores[name],
  }));

  const helperText = () => {
    const score = netScores[currentStudent];
    if (score < -3) {
      return `${currentStudent}'s effort was too low`;
    } else if (score > 3) {
      return `${currentStudent}'s effort was too high`;
    } else {
      return `${currentStudent}'s effort was average`;
    }
  };

  return (
    <Card className="pt-3 shadow-sm">
      <h5 className="text-center mb-1">Workload balance</h5>
      <p className="text-muted text-center mb-0 px-3">{helperText()}</p>
      <ResponsiveContainer width="100%" height={200}>
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
          <YAxis />
          <Tooltip cursor={false} />  
          <Bar dataKey="Net score">
            { chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={barColours[index]} />
            )) }
          </Bar>
          <ReferenceLine y={0} stroke="#666" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default WorkloadBalanceChart;
