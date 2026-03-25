import { useEffect, useState } from "react";
import React from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import API from "../../services/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const AdminWorkouts = () => {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  useEffect(() => {
    fetchWorkouts();
    fetchAnalysis();
  }, []);

  const fetchWorkouts = async () => {
    try {
      const res = await API.get("/admin/workouts");
      if (res.data.success) {
        setWorkouts(res.data.data || []);
        setError("");
      }
    } catch (err) {
      console.error("Error fetching workouts:", err);
      setError(err.response?.data?.message || "Failed to fetch workouts");
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalysis = async () => {
    try {
      const res = await API.get("/admin/workout-distribution");
      if (res.data.success) {
        setAnalysis(res.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching analysis:", err);
    }
  };

  const handleDelete = async (workoutId) => {
    if (!window.confirm("Are you sure you want to delete this workout?")) {
      return;
    }

    try {
      await API.delete(`/admin/workouts/${workoutId}`);
      setWorkouts(workouts.filter((w) => w._id !== workoutId));
      setSuccess("Workout deleted successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error deleting workout:", err);
      setError("Failed to delete workout");
    }
  };

  const COLORS = ["#22c55e", "#3b82f6", "#ef4444", "#f59e0b", "#8b5cf6"];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Workout Management
            </h1>
            <p className="text-slate-400">Manage all workouts from users</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-slate-800 rounded-xl shadow-md p-6 border border-slate-700">
              <div className="flex items-center">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <span className="text-2xl">💪</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-400">
                    Total Workouts
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {workouts.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-xl shadow-md p-6 border border-slate-700">
              <div className="flex items-center">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <span className="text-2xl">🔥</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-400">
                    Total Calories
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {workouts.reduce(
                      (sum, w) => sum + (w.caloriesBurned || 0),
                      0,
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-xl shadow-md p-6 border border-slate-700">
              <div className="flex items-center">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <span className="text-2xl">📊</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-400">
                    Avg Calories
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {workouts.length > 0
                      ? Math.round(
                          workouts.reduce(
                            (sum, w) => sum + (w.caloriesBurned || 0),
                            0,
                          ) / workouts.length,
                        )
                      : 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Analysis Toggle Button */}
          <div className="mb-8">
            <button
              onClick={() => setShowAnalysis(!showAnalysis)}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              {showAnalysis ? "Hide Analysis" : "Show Analysis"}
            </button>
          </div>

          {/* Analysis Charts */}
          {showAnalysis && analysis && analysis.length > 0 && (
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 mb-8">
              <h3 className="text-xl font-semibold mb-4 text-white">
                📊 Workout Analysis
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <div className="bg-slate-800 p-4 rounded-lg">
                  <h4 className="text-white mb-4 font-semibold">
                    Workout Distribution
                  </h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analysis}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {analysis.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1e293b",
                          border: "1px solid #475569",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Bar Chart */}
                <div className="bg-slate-800 p-4 rounded-lg">
                  <h4 className="text-white mb-4 font-semibold">
                    Workout Count by Type
                  </h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analysis}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                      <XAxis dataKey="name" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1e293b",
                          border: "1px solid #475569",
                        }}
                      />
                      <Bar dataKey="value" fill="#22c55e" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg">
              {success}
            </div>
          )}

          {/* Workouts Table */}
          <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
            <div className="block md:hidden space-y-4">
              {workouts.map((workout) => (
                <div
                  key={workout._id}
                  className="bg-slate-800 p-4 rounded-lg border border-slate-700"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-white">
                        {workout.userId?.name || "Unknown User"}
                      </h4>
                      <p className="text-slate-400 text-sm">{workout.type}</p>
                    </div>
                    <button
                      onClick={() => handleDelete(workout._id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-slate-300">
                      Calories: {workout.caloriesBurned} kcal
                    </p>
                    <p className="text-slate-300">
                      Exercises: {workout.exercises?.length || 0}
                    </p>
                    <p className="text-slate-400">
                      {new Date(workout.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full hidden md:table">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-800">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">
                      Username
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">
                      Calories
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">
                      Exercises
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">
                      Date
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-slate-300">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {workouts.length > 0 ? (
                    workouts.map((workout) => (
                      <tr
                        key={workout._id}
                        className="border-b border-slate-700 hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="px-6 py-3 text-white font-medium">
                          {workout.userId?.name || "Unknown User"}
                        </td>
                        <td className="px-6 py-3 text-white font-medium">
                          {workout.type}
                        </td>
                        <td className="px-6 py-3 text-slate-300">
                          {workout.caloriesBurned} kcal
                        </td>
                        <td className="px-6 py-3 text-slate-300">
                          {workout.exercises?.length || 0} exercises
                        </td>
                        <td className="px-6 py-3 text-slate-400 text-sm">
                          {new Date(workout.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-3 text-center">
                          <button
                            onClick={() => handleDelete(workout._id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-6 py-8 text-center text-slate-400"
                      >
                        No workouts found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminWorkouts;
