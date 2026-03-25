import { useEffect, useState } from "react";
import React from "react";
import { Pie, PieChart, Tooltip } from "recharts";
import API from "../services/api";

const MacroChart = () => {
  const [data, setData] = useState([]);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await API.get("/diet/macro-distribution");
        if (res.data.success && res.data.data) {
          const marco = res.data.data;
          setData([
            {
              name: "Protein",
              value: marco.protein.percentage,
            },
            {
              name: "Carbs",
              value: marco.carbs.percentage,
            },
            {
              name: "Fat",
              value: marco.fat.percentage,
            },
          ]);
        }
      } catch (err) {
        console.error("Failed to fetch macro data", err);
      }
    };

    fetchData();
  }, []);
  const COLORS = ["#22c55e", "#3b82f6", "#ef4444"];

  const dataWithColors = data.map((item, index) => ({
    ...item,
    fill: COLORS[index % COLORS.length],
  }));
  return (
    <div className="bg-slate-900 p-6 rounded-xl mt-6 w-full">
      <h2 className="text-xl font-bold mb-4">Macroeconomic Indicators</h2>
      <PieChart width={400} height={300}>
        <Pie
          data={dataWithColors}
          cx="50%"
          cy="50%"
          labelLine={true}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        />
        <Tooltip />
      </PieChart>
    </div>
  );
};

export default MacroChart;
