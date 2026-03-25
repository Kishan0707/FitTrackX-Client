import { useEffect, useState } from "react";
import React from "react";
import API from "../services/api";

const MonthlyComparision = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await API.get("/progress/monthly-comparison");
        setData(res.data.data);
      } catch (err) {
        console.error("Error fetching monthly comparison:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-300 rounded w-1/3"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-20 bg-gray-300 rounded"></div>
          <div className="h-20 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-2">📊</div>
        <p>No comparison data available</p>
      </div>
    );
  }

  const getChangeIndicator = (current, previous) => {
    if (previous === 0) return { symbol: "➡️", color: "text-gray-500" };
    const change = ((current - previous) / previous) * 100;
    if (change > 0) return { symbol: "📈", color: "text-green-500" };
    if (change < 0) return { symbol: "📉", color: "text-red-500" };
    return { symbol: "➡️", color: "text-gray-500" };
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Workouts */}
        <div className="bg-linear-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-blue-900">Workouts</h4>
            <span className="text-2xl">💪</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-sm text-blue-700">This Month:</span>
              <span className="font-bold text-blue-900">
                {data.currentMonth.workouts}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-blue-700">Last Month:</span>
              <span className="font-bold text-blue-900">
                {data.previousMonth.workouts}
              </span>
            </div>
            <div
              className={`flex items-center justify-center mt-2 ${getChangeIndicator(data.currentMonth.workouts, data.previousMonth.workouts).color}`}
            >
              <span className="text-lg mr-1">
                {
                  getChangeIndicator(
                    data.currentMonth.workouts,
                    data.previousMonth.workouts,
                  ).symbol
                }
              </span>
              <span className="text-sm font-medium">
                {data.previousMonth.workouts > 0
                  ? `${Math.abs(((data.currentMonth.workouts - data.previousMonth.workouts) / data.previousMonth.workouts) * 100).toFixed(1)}%`
                  : "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Calories */}
        <div className="bg-linear-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-red-900">Calories Burned</h4>
            <span className="text-2xl">🔥</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-sm text-red-700">This Month:</span>
              <span className="font-bold text-red-900">
                {data.currentMonth.caloriesBurned}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-red-700">Last Month:</span>
              <span className="font-bold text-red-900">
                {data.previousMonth.caloriesBurned}
              </span>
            </div>
            <div
              className={`flex items-center justify-center mt-2 ${getChangeIndicator(data.currentMonth.caloriesBurned, data.previousMonth.caloriesBurned).color}`}
            >
              <span className="text-lg mr-1">
                {
                  getChangeIndicator(
                    data.currentMonth.caloriesBurned,
                    data.previousMonth.caloriesBurned,
                  ).symbol
                }
              </span>
              <span className="text-sm font-medium">
                {data.previousMonth.caloriesBurned > 0
                  ? `${Math.abs(((data.currentMonth.caloriesBurned - data.previousMonth.caloriesBurned) / data.previousMonth.caloriesBurned) * 100).toFixed(1)}%`
                  : "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Protein */}
        <div className="bg-linear-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-green-900">Avg Protein</h4>
            <span className="text-2xl">🥩</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-sm text-green-700">This Month:</span>
              <span className="font-bold text-green-900">
                {data.currentMonth.avgProtein.toFixed(1)}g
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-green-700">Last Month:</span>
              <span className="font-bold text-green-900">
                {data.previousMonth.avgProtein.toFixed(1)}g
              </span>
            </div>
            <div
              className={`flex items-center justify-center mt-2 ${getChangeIndicator(data.currentMonth.avgProtein, data.previousMonth.avgProtein).color}`}
            >
              <span className="text-lg mr-1">
                {
                  getChangeIndicator(
                    data.currentMonth.avgProtein,
                    data.previousMonth.avgProtein,
                  ).symbol
                }
              </span>
              <span className="text-sm font-medium">
                {data.previousMonth.avgProtein > 0
                  ? `${Math.abs(((data.currentMonth.avgProtein - data.previousMonth.avgProtein) / data.previousMonth.avgProtein) * 100).toFixed(1)}%`
                  : "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyComparision;
