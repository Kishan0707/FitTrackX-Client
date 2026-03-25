import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const WeightChart = ({
  data,
  title = "Chart",
  xDataKey = "createdAt",
  yDataKey = "weight",
  color = "#ef4444",
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-slate-900 rounded-xl p-6">
        <div className="flex items-center justify-center h-64 rounded-lg">
          <div className="text-center">
            <div className="text-4xl mb-2">📈</div>
            <p className="text-slate-400">No data available yet</p>
            <p className="text-sm text-slate-500">
              Start tracking to see your progress!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <ResponsiveContainer width="100%" height={300} className="text-white">
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <XAxis
            dataKey={xDataKey}
            tickFormatter={(value) =>
              new Date(value).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
            }
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#cbd5e1" }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#cbd5e1" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1e293b",
              border: "none",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              color: "#f1f5f9",
            }}
            labelFormatter={(value) =>
              new Date(value).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            }
            // eslint-disable-next-line no-unused-vars
            formatter={(value, name) => [
              `${value}${yDataKey === "weight" ? " kg" : yDataKey === "calories" ? " cal" : "g"}`,
              title,
            ]}
          />
          <Line
            type="monotone"
            dataKey={yDataKey}
            stroke={color}
            strokeWidth={3}
            dot={{ fill: color, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: color, strokeWidth: 2, fill: "#1e293b" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WeightChart;
