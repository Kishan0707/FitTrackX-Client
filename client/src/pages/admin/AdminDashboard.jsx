import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import API from "../../services/api";
import {
  LineChart,
  Line,
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
import {
  FaUsers,
  FaDumbbell,
  FaAppleAlt,
  FaFire,
  FaChartLine,
  FaUserCheck,
} from "react-icons/fa";
import StatCard from "../../components/StatCard";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userGrowth, setUserGrowth] = useState([]);
  const [workoutDist, setWorkoutDist] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [topPerformers, setTopPerformers] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await API.get("/admin/dashboard");
        console.log("Dashboard Response:", res.data);
        if (res.data.success) {
          setStats(res.data.data);
          setError("");
        }

        // Fetch charts data
        const growthRes = await API.get("/admin/user-growth");
        console.log("User Growth Response:", growthRes.data);
        if (growthRes.data.success) {
          const chartData = growthRes.data.data.months.map((month, idx) => ({
            month,
            users: growthRes.data.data.users[idx],
          }));
          console.log("Chart Data:", chartData);
          setUserGrowth(chartData);
        }

        const distRes = await API.get("/admin/workout-distribution");
        console.log("Workout Distribution Response:", distRes.data);
        if (distRes.data.success) {
          setWorkoutDist(distRes.data.data);
        }

        // Fetch recent activities
        const activitiesRes = await API.get("/admin/recent-activities");
        if (activitiesRes.data.success) {
          setRecentActivities(activitiesRes.data.data);
        }

        // Fetch top performers
        const performersRes = await API.get("/admin/top-performers");
        if (performersRes.data.success) {
          setTopPerformers(performersRes.data.data);
          console.log("Top Performers:", performersRes.data.data);
        }

        // Fetch system health
        const healthRes = await API.get("/admin/system-health");
        if (healthRes.data.success) {
          setSystemHealth(healthRes.data.data);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
        setError("Failed to fetch dashboard stats");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-b-2 border-red-500 rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!stats) {
    return (
      <DashboardLayout>
        <div className="py-12 text-center">
          <p className="text-slate-400">No data available</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-slate-400">
          Monitor your fitness platform's performance
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 mb-6 text-red-400 border rounded-lg bg-red-500/10 border-red-500/20">
          {error}
        </div>
      )}

      {/* Stats Grid - 4 Cards */}
      <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Users Card */}
        <div className="p-6 shadow-md bg-slate-900 rounded-xl">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="mb-2 text-sm text-slate-400">👥 Users</h3>
              <p className="text-3xl font-bold text-white">
                {stats.totalUsers || 0}
              </p>
              <p className="mt-2 text-sm text-green-400">
                +{stats.userGrowth || 0}%
              </p>
            </div>
            <FaUsers className="text-2xl text-slate-600" />
          </div>
        </div>

        {/* Total Workouts Card */}
        <div className="p-6 shadow-md bg-slate-900 rounded-xl">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="mb-2 text-sm text-slate-400">💪 Workouts</h3>
              <p className="text-3xl font-bold text-white">
                {stats.totalWorkouts || 0}
              </p>
              <p className="mt-2 text-sm text-blue-400">
                +{stats.monthWorkouts || 0} MTD
              </p>
            </div>
            <FaDumbbell className="text-2xl text-slate-600" />
          </div>
        </div>

        {/* Total Diet Plans Card */}
        <div className="p-6 shadow-md bg-slate-900 rounded-xl">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="mb-2 text-sm text-slate-400">🍽️ Diet Plans</h3>
              <p className="text-3xl font-bold text-white">
                {stats.totalDiets || 0}
              </p>
              <p className="mt-2 text-sm text-yellow-400">
                {Math.round((stats.totalDiets || 0) * 0.73)} Active
              </p>
            </div>
            <FaAppleAlt className="text-2xl text-slate-600" />
          </div>
        </div>

        {/* Total Calories Burned Card */}
        <div className="p-6 shadow-md bg-slate-900 rounded-xl">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="mb-2 text-sm text-slate-400">🏋️ Coaches</h3>
              <p className="text-3xl font-bold text-white">
                {Math.round((stats.totalUsers || 0) * 0.08)}
              </p>
              <p className="mt-2 text-sm text-purple-400">
                {Math.round((stats.totalUsers || 0) * 0.65)} Users
              </p>
            </div>
            <FaFire className="text-2xl text-slate-600" />
          </div>
        </div>
      </div>

      {/* Grid md:grid-cols-2 gap-6 mb-8 grid-cols-1 (user Growt Chart:-(1.Line cart:-  Last 12Months(x-months, y-=new)) (Workouts Distributions :- (2.Pie Chart:- type(cardio:40%, strenth:55%, yoga: 15%, oother:10%))) */}

      {/* Additional Stats Section */}
      <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-2">
        {/* User Growth Chart */}
        <div className="p-6 bg-slate-900 rounded-xl">
          <h3 className="mb-4 text-xl font-semibold">
            📈 User Growth (Last 12 Months)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={userGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="users" stroke="#22c55e" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Workout Distribution Chart */}
        <div className="p-6 bg-slate-900 rounded-xl">
          <h3 className="mb-4 text-xl font-semibold">
            🥧 Workout Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={workoutDist}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {workoutDist.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      ["#22c55e", "#3b82f6", "#ef4444", "#f59e0b"][index % 4]
                    }
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* tabl

      {/* Additional Stats Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Platform Overview */}
        <div className="p-6 bg-slate-900 rounded-xl">
          <h3 className="flex items-center mb-4 text-xl font-semibold">
            <FaChartLine className="mr-2 text-red-500" />
            Platform Overview
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Active Users</span>
              <span className="font-semibold">{stats.totalUsers || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Total Activities</span>
              <span className="font-semibold">
                {(stats.totalWorkouts || 0) + (stats.totalDiets || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Avg. Calories/User</span>
              <span className="font-semibold">
                {stats.totalUsers && stats.totalCaloriesBurned
                  ? Math.round(stats.totalCaloriesBurned / stats.totalUsers)
                  : 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Total Calories Burned</span>
              <span className="font-semibold">
                {stats.totalCaloriesBurned || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-6 bg-slate-900 rounded-xl">
          <h3 className="flex items-center mb-4 text-xl font-semibold">
            <FaUserCheck className="mr-2 text-red-500" />
            Quick Actions
          </h3>
          <div className="space-y-3">
            <button
              className="w-full px-4 py-2 text-white transition-colors bg-red-600 rounded-lg hover:bg-red-700"
              onClick={() => navigate("/admin/users")}
            >
              👁️ Manage Users
            </button>
            <button
              className="w-full px-4 py-2 text-white transition-colors rounded-lg bg-slate-700 hover:bg-slate-600"
              onClick={() => navigate("/admin/reports")}
            >
              📊 View Reports
            </button>
            <button
              className="w-full px-4 py-2 text-white transition-colors rounded-lg bg-slate-700 hover:bg-slate-600"
              onClick={() => navigate("/settings")}
            >
              ⚙️ System Settings
            </button>
          </div>
        </div>
      </div>

      {/* System Health Status */}
      <div className="p-6 mt-8 bg-slate-900 rounded-xl">
        <h3 className="mb-4 text-xl font-semibold">🏥 System Health Status</h3>
        {systemHealth ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Overall Status */}
            <div className="p-4 rounded-lg bg-slate-800/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Overall Status</span>
                <span
                  className={`text-2xl ${systemHealth.status === "Healthy" ? "🟢" : "🔴"}`}
                ></span>
              </div>
              <p
                className={`text-lg font-bold ${systemHealth.status === "Healthy" ? "text-green-400" : "text-red-400"}`}
              >
                {systemHealth.status}
              </p>
            </div>

            {/* Server Status */}
            <div className="p-4 rounded-lg bg-slate-800/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Server</span>
                <span className="text-2xl">🖥️</span>
              </div>
              <p className="text-lg font-bold text-white">
                {systemHealth.server.status}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Uptime: {systemHealth.server.uptime}
              </p>
            </div>

            {/* Database Status */}
            <div className="p-4 rounded-lg bg-slate-800/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Database</span>
                <span className="text-2xl">🗄️</span>
              </div>
              <p
                className={`text-lg font-bold ${systemHealth.database.status === "Connected" ? "text-green-400" : "text-red-400"}`}
              >
                {systemHealth.database.status}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {systemHealth.database.type}
              </p>
            </div>

            {/* Redis Status */}
            <div className="p-4 rounded-lg bg-slate-800/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Redis Cache</span>
                <span className="text-2xl">⚡</span>
              </div>
              <p
                className={`text-lg font-bold ${systemHealth.redis.status === "Connected" ? "text-green-400" : "text-red-400"}`}
              >
                {systemHealth.redis.status}
              </p>
            </div>

            {/* Memory Usage */}
            <div className="p-4 rounded-lg bg-slate-800/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Memory Usage</span>
                <span className="text-2xl">💾</span>
              </div>
              <p className="text-lg font-bold text-white">
                {systemHealth.memory.used}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                of {systemHealth.memory.total} ({systemHealth.memory.percentage}
                %)
              </p>
            </div>

            {/* API Response Time */}
            <div className="p-4 rounded-lg bg-slate-800/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">API Response</span>
                <span className="text-2xl">⚡</span>
              </div>
              <p
                className={`text-lg font-bold ${systemHealth.api.status === "Fast" ? "text-green-400" : "text-yellow-400"}`}
              >
                {systemHealth.api.responseTime}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {systemHealth.api.status}
              </p>
            </div>

            {/* Node Version */}
            <div className="p-4 rounded-lg bg-slate-800/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Node.js</span>
                <span className="text-2xl">🟢</span>
              </div>
              <p className="text-lg font-bold text-white">
                {systemHealth.server.nodeVersion}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {systemHealth.server.platform}
              </p>
            </div>

            {/* Last Check */}
            <div className="p-4 rounded-lg bg-slate-800/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Last Check</span>
                <span className="text-2xl">🕐</span>
              </div>
              <p className="text-sm font-bold text-white">
                {new Date(systemHealth.timestamp).toLocaleTimeString()}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {new Date(systemHealth.timestamp).toLocaleDateString()}
              </p>
            </div>
          </div>
        ) : (
          <p className="py-4 text-center text-slate-400">
            Loading system health...
          </p>
        )}
      </div>

      {/* Recent Activities and Top Performers */}
      <div className="grid grid-cols-1 gap-6 mt-8 lg:grid-cols-2">
        {/* Recent Activities */}
        <div className="p-6 bg-slate-900 rounded-xl">
          <h3 className="mb-4 text-xl font-semibold">📋 Recent Activities</h3>
          <div className="space-y-3 overflow-y-auto max-h-96">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50"
                >
                  <div className="text-2xl">
                    {activity.icon === "user" && "👤"}
                    {activity.icon === "dumbbell" && "💪"}
                    {activity.icon === "apple" && "🍎"}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white">{activity.description}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-4 text-center text-slate-400">
                No activities yet
              </p>
            )}
          </div>
        </div>

        {/* Top Performers */}
        <div className="p-6 bg-slate-900 rounded-xl">
          <h3 className="mb-4 text-xl font-semibold">🏆 Top Performers</h3>
          <div className="space-y-4">
            {topPerformers && (
              <>
                {/* Top Users */}
                <div>
                  <h4 className="mb-3 text-sm font-semibold text-slate-300">
                    Top Users by Workouts
                  </h4>
                  <div className="space-y-2">
                    {topPerformers.topUsersByWorkouts?.length > 0 ? (
                      topPerformers.topUsersByWorkouts.map((user, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded bg-slate-800/50"
                        >
                          <div>
                            <p className="text-sm text-white">{user.name}</p>
                            <p className="text-xs text-slate-400">
                              {user.workouts} workouts
                            </p>
                          </div>
                          <span className="font-semibold text-yellow-400">
                            {user.totalCalories} cal
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400">No data</p>
                    )}
                  </div>
                </div>

                {/* Top Coaches */}
                <div>
                  <h4 className="mb-3 text-sm font-semibold text-slate-300">
                    Top Coaches
                  </h4>
                  <div className="space-y-2">
                    {topPerformers.topCoaches?.length > 0 ? (
                      topPerformers.topCoaches.map((coach, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded bg-slate-800/50"
                        >
                          <div>
                            <p className="text-sm text-white">{coach.name}</p>
                            <p className="text-xs text-slate-400">
                              {coach.email}
                            </p>
                          </div>
                          <span className="font-semibold text-blue-400">
                            {coach.clientsCount} clients
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400">No coaches</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
