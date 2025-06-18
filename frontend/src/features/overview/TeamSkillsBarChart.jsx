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

const TeamSkillsBarChart = () => {
  const selectedTeam = useBoundStore((state) =>
    state.getSelectedTeam(),
  );
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [skillsData, setSkillsData] = useState([]);

  const refreshData = () => {
    setSkillsData([]);
    if (selectedTeam == null) {
      return setUnavailable(true);
    }
    setLoading(true);
    api
      .get(`/api/stats/team-skills?team=${selectedTeam._id}`, {
        genericErrorToasts: false,
      })
      .then((resp) => {
        return resp.data;
      })
      .then((data) => {
        setSkillsData(data?.skills);
        setLoading(false);
        setUnavailable(false);
      })
      .catch(() => {
        setUnavailable(true);
      });
  };

  // Refresh data on page load
  useEffect(refreshData, [selectedTeam]);

  if (unavailable)
    return (
      <Card className="p-3 shadow-sm">
        <Card.Body>
          <p className="text-muted mb-0">
            Once you've joined a team, you'll be able to see your skills
            overview here.
          </p>
        </Card.Body>
      </Card>
    );

  if (loading)
    return (
      <Card className="p-3 shadow-sm">
        <Card.Body>
          <div className="d-flex align-items-center text-muted">
            <Spinner className="me-3" />
            Loading skills chart...
          </div>
        </Card.Body>
      </Card>
    );

  return (
    <Card className="p-3 shadow-sm">
      <h5 className="text-center mb-1">Team skills overview</h5>
      <p className="text-center text-muted mb-2">Shows where your team's strongest skills are</p>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart width="100%" height="100%" data={skillsData}>
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

export default TeamSkillsBarChart;
