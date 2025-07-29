import api from "@/services/apiMiddleware";
import { useBoundStore } from "@/store/dataBoundStore";
import { useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip as ChartTooltip, Label, ReferenceArea } from "recharts";
import { chartColours } from "@/utility/helpers";

const AllTimeWorkloadChart = ({showModal, onHide}) => {
  const selectedTeam = useBoundStore((state) => state.getSelectedTeam());
  const [checkinHistory, setCheckinHistory] = useState([]);
  const [checkinStudents, setCheckinStudents] = useState([]);

  const loadData = (groupid) => {
    api
      .get(`/api/checkin/history?team=${selectedTeam._id}`)
      .then((resp) => {
        return resp.data;
      })
      .then((data) => {
        let someData = false;
        const students = new Set();
        const checkinData = data.checkins.map(c => {
          const endDate = new Date(c.periodEnd);
          const niceEndDate = endDate.toLocaleDateString("en-GB", { month: "short", day: "numeric" });
          if (Object.keys(c?.totalScores ?? {}).length > 0) someData = true;
          Object.keys(c?.netScores ?? {}).forEach(student => students.add(student));
          return {periodEnd: niceEndDate, ...c.netScores,}
        });
        if (!someData) return setCheckinHistory(null);
        setCheckinHistory(checkinData);
        setCheckinStudents(Array.from(students));
      });
  };

  useEffect(() => {
    if (showModal) loadData();
  }, [showModal]);
  
  return (
    <Modal show={showModal} size="xl" onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Workload balance</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        { checkinHistory?.length > 0 ?
          <>
          <p className="text-muted">
            This chart shows how students in Team {selectedTeam?.teamNumber}{" "}
            perceive the workload balance across the duration of the assignment.
            A score of 0 is ideal and means that student is seen to be doing
            their fair share. A high score means they're doing more, and a low
            score may indicate free-riding.
          </p>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={checkinHistory}
              margin={{
                left: 50,
                bottom: 50,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="periodEnd">
                <Label offset={20} position="bottom" value="Weeks (last day)" />
              </XAxis>
              <YAxis>
                <Label position="left" angle={-90} value="Relative workload" />
              </YAxis>
              <ReferenceArea y1={-4} y2={4} fill="#71d97f" opacity={0.3} ifOverflow="extendDomain" />
              <Legend align="right" verticalAlign="middle" layout="vertical" wrapperStyle={{ paddingLeft: "20px" }} />
              <ChartTooltip />
              {checkinStudents.map((student, index) => (
                <Line key={index} type="monotone" dataKey={student} stroke={chartColours[index % chartColours.length]} strokeWidth={2} connectNulls />
              ))}
            </LineChart>
          </ResponsiveContainer>
          </>
          :
          <p className="text-muted">
            This team doesn't have any check-in data to show yet. Either no peer
            reviews have happened yet, or none of the students in Team {selectedTeam?.teamNumber}{" "}
            have completed them.
          </p>
        }
      </Modal.Body>
    </Modal>
  )
};

export default AllTimeWorkloadChart;
