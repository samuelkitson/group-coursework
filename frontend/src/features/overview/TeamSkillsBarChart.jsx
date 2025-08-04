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
} from "recharts";
import { Card, Spinner } from "react-bootstrap";
import api from "@/services/apiMiddleware";
import { useBoundStore } from "@/store/dataBoundStore";
import { EMOJI_RATINGS } from "@/utility/helpers";

const TeamSkillsBarChart = ({ data }) => {
  return (
    <Card className="p-3 shadow h-100">
      <h5 className="text-center mb-1">Team skills overview</h5>
      <p className="text-center text-muted mb-2">Shows where your team's strongest skills are</p>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart width="100%" height="100%" data={data?.skills}>
          <CartesianGrid vertical={false} strokeDasharray="1 3" ticks={[1,2,3,4,5,6,7]} />
          <XAxis dataKey="skill" tick={{ fontSize: 10 }} />
          <YAxis domain={[0, 7]} tickCount={8}
            tickFormatter={(value) => {
              if (value === 0) {
                return EMOJI_RATINGS[0].emoji;
              } else if (value === 7) {
                return EMOJI_RATINGS[6].emoji;
              } else {
                return '';
              }
            }}
          />
          <Tooltip />
          <Legend />
          <Bar dataKey="team" name="Team's best rating" fill="#6fb3b3" activeBar={<Rectangle stroke="#317878" />} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

TeamSkillsBarChart.loadData = async () => {
  const selectedTeam = useBoundStore.getState().getSelectedTeam();
  if (!selectedTeam) return null;
  try {
    const res = await api.get(`/api/stats/team-skills?team=${selectedTeam._id}`, {
      genericErrorToasts: false,
    })
    const data = res.data;
    const skills = data?.skills ?? [];
    if (skills.length === 0) return null;
    return {
      skills: data?.skills,
    };
  } catch (e) {
    return null;
  }
};

export default TeamSkillsBarChart;
