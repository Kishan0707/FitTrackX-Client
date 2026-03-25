import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import API from "../services/api";
const ChartCard = ({ data }) => {
  // eslint-disable-next-line no-unused-vars
  const [progress, setProgress] = useState({});
  useEffect(() => {
    const fetchProgress = async () => {
      const res = await API.get("/progress");
      setProgress(res.data.data);
    };

    fetchProgress();
  }, []);
  return (
    <div className="bg-slate-900 p-6 rounded-xl mt-6">
      <h2 className="mb-4">Weight Progress</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="weight" stroke="#ef4444" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ChartCard;
