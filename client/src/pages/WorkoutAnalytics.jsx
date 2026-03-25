import React, { useEffect, useState } from "react";
import DashboardLayout from "../layout/DashboardLayout";
import API from "../services/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

const WorkoutAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    weeklyData: [],
    exerciseDistribution: [],
    caloriesTrend: [],
    totalWorkouts: 0,
    totalCalories: 0,
    avgDuration: 0
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("week");

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/workouts?range=${timeRange}`);
      const workouts = res.data.data || [];

      // Process data for analytics
      const weeklyData = processWeeklyData(workouts);
      const exerciseDistribution = processExerciseDistribution(workouts);
      const caloriesTrend = processCaloriesTrend(workouts);
      
      const totalWorkouts = workouts.length;
      const totalCalories = workouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);
      const avgDuration = workouts.length > 0 
        ? workouts.reduce((sum, w) => sum + (w.duration || 0), 0) / workouts.length 
        : 0;

      setAnalytics({
        weeklyData,
        exerciseDistribution,
        caloriesTrend,
        totalWorkouts,
        totalCalories,
        avgDuration: Math.round(avgDuration)
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const processWeeklyData = (workouts) => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const data = days.map(day => ({ day, workouts: 0, calories: 0 }));
    
    workouts.forEach(workout => {
      const date = new Date(workout.date);
      const dayIndex = (date.getDay() + 6) % 7;
      data[dayIndex].workouts += 1;
      data[dayIndex].calories += workout.caloriesBurned || 0;
    });
    
    return data;
  };

  const processExerciseDistribution = (workouts) => {
    const distribution = {};
    workouts.forEach(workout => {
      const type = workout.exerciseType || "Other";
      distribution[type] = (distribution[type] || 0) + 1;
    });
    
    return Object.entries(distribution).map(([name, value]) => ({ name, value }));
  };

  const processCaloriesTrend = (workouts) => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      
      const dayWorkouts = workouts.filter(w => {
        const wDate = new Date(w.date);
        return wDate.toDateString() === date.toDateString();
      });
      
      const calories = dayWorkouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);
      last7Days.push({ date: dateStr, calories });
    }
    
    return last7Days;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-400">Loading analytics...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Workout Analytics</h1>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-slate-800 text-white px-4 py-2 rounded-lg border border-slate-700"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
            <p className="text-slate-400 text-sm">Total Workouts</p>
            <p className="text-3xl font-bold text-white mt-2">{analytics.totalWorkouts}</p>
          </div>
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
            <p className="text-slate-400 text-sm">Total Calories Burned</p>
            <p className="text-3xl font-bold text-white mt-2">{analytics.totalCalories.toLocaleString()}</p>
          </div>
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
            <p className="text-slate-400 text-sm">Avg Duration (min)</p>
            <p className="text-3xl font-bold text-white mt-2">{analytics.avgDuration}</p>
          </div>
        </div>

        {/* Weekly Workouts Chart */}
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-4">Weekly Workout Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="day" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }} />
              <Legend />
              <Bar dataKey="workouts" fill="#3b82f6" name="Workouts" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calories Trend */}
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
            <h2 className="text-xl font-semibold text-white mb-4">Calories Burned Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.caloriesTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }} />
                <Line type="monotone" dataKey="calories" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Exercise Distribution */}
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
            <h2 className="text-xl font-semibold text-white mb-4">Exercise Type Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.exerciseDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.exerciseDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default WorkoutAnalytics;
