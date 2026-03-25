import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../../context/authContext";
import API from "../../services/api";
import DashboardLayout from "../../layout/DashboardLayout";
import StatCard from "../../components/StatCard";
import WeightChart from "../../components/WeightChart";
import RecentWorkouts from "../../components/RecentWorkout";
import {
  FaFire,
  FaDumbbell,
  FaAppleAlt,
  FaCalendarAlt,
  FaUsers,
  FaChartLine,
  FaPlus,
  FaTrophy,
} from "react-icons/fa";

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({});
  const [progress, setProgress] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let statsRes, progressRes, workoutsRes;

        if (user?.role === "admin") {
          statsRes = await API.get("/admin/dashboard");
          // Admin might not have personal progress/workouts
          setStats(statsRes.data.data || {});
        } else if (user?.role === "coach") {
          // For coach, maybe fetch coach-specific stats
          statsRes = await API.get("/coach/dashboard");
          setStats(statsRes.data.data || {});
        } else {
          // Regular user
          statsRes = await API.get("/stats");
          progressRes = await API.get("/progress/graphs");
          workoutsRes = await API.get("/workouts");

          setStats(statsRes.data.data);
          setProgress(progressRes.data.data.weightHistory);
          setWorkouts(workoutsRes.data.data);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();

      // Real-time updates every 10 seconds for users
      if (user.role === "user") {
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
      }
    }
  }, [user]);

  return (
    <DashboardLayout>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
        </div>
      ) : user?.role === "admin" ? (
        <>
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Admin Dashboard
            </h1>
            <p className="text-slate-400">
              Monitor your fitness platform's performance
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Users"
              value={stats.totalUsers || 0}
              icon={<FaUsers />}
            />
            <StatCard
              title="Total Workouts"
              value={stats.totalWorkouts || 0}
              icon={<FaDumbbell />}
            />
            <StatCard
              title="Total Diet Logs"
              value={stats.totalDiets || 0}
              icon={<FaAppleAlt />}
            />
            <StatCard
              title="Total Calories Burned"
              value={stats.totalCaloriesBurned || 0}
              icon={<FaFire />}
            />
          </div>

          {/* Additional Stats Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Platform Overview */}
            <div className="bg-slate-900 p-6 rounded-xl">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <FaChartLine className="mr-2 text-red-500" />
                Platform Overview
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Active Users</span>
                  <span className="font-semibold">{stats.totalUsers || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Total Activities</span>
                  <span className="font-semibold">
                    {(stats.totalWorkouts || 0) + (stats.totalDiets || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Avg. Calories/User</span>
                  <span className="font-semibold">
                    {stats.totalUsers && stats.totalCaloriesBurned
                      ? Math.round(stats.totalCaloriesBurned / stats.totalUsers)
                      : 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-slate-900 p-6 rounded-xl">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <FaUsers className="mr-2 text-red-500" />
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors">
                  Manage Users
                </button>
                <button className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2 px-4 rounded-lg transition-colors">
                  View Reports
                </button>
                <button className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2 px-4 rounded-lg transition-colors">
                  System Settings
                </button>
              </div>
            </div>
          </div>
        </>
      ) : user?.role === "coach" ? (
        <>
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Coach Dashboard
            </h1>
            <p className="text-slate-400">
              Manage your clients and track their progress
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="My Clients"
              value={stats.totalClients || 0}
              icon={<FaUsers />}
            />
            <StatCard
              title="Active Plans"
              value={stats.activePlans || 0}
              icon={<FaDumbbell />}
            />
            <StatCard
              title="This Month Sessions"
              value={stats.monthlySessions || 0}
              icon={<FaCalendarAlt />}
            />
            <StatCard
              title="Total Workouts Assigned"
              value={stats.totalWorkoutsAssigned || 0}
              icon={<FaTrophy />}
            />
          </div>

          {/* Client Management and Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Client Overview */}
            <div className="bg-slate-900 p-6 rounded-xl">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <FaChartLine className="mr-2 text-red-500" />
                Client Overview
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Active Clients</span>
                  <span className="font-semibold">
                    {stats.totalClients || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Active Plans</span>
                  <span className="font-semibold">
                    {stats.activePlans || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Sessions This Month</span>
                  <span className="font-semibold">
                    {stats.monthlySessions || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Client Progress Summary */}
            <div className="bg-slate-900 p-6 rounded-xl">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <FaUsers className="mr-2 text-red-500" />
                Client Progress
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Avg. Weight Loss</span>
                  <span className="font-semibold text-green-400">
                    {stats.avgWeightLoss || 0} kg
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Completed Workouts</span>
                  <span className="font-semibold">
                    {stats.completedWorkouts || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Client Satisfaction</span>
                  <span className="font-semibold text-yellow-400">
                    {stats.clientSatisfaction || 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-900 p-6 rounded-xl">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <FaPlus className="mr-2 text-red-500" />
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center">
                <FaUsers className="mr-2" />
                Manage Clients
              </button>
              <button className="bg-slate-700 hover:bg-slate-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center">
                <FaDumbbell className="mr-2" />
                Assign Workout
              </button>
              <button className="bg-slate-700 hover:bg-slate-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center">
                <FaChartLine className="mr-2" />
                View Progress
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">My Dashboard</h1>
            <p className="text-slate-400">
              Track your fitness journey and progress
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Calories Burned"
              value={stats.totalCaloriesBurned || 0}
              icon={<FaFire />}
            />
            <StatCard
              title="Workouts"
              value={stats.totalWorkouts || 0}
              icon={<FaDumbbell />}
            />
            <StatCard
              title="Protein Intake"
              value={stats.totalProteinIntake || 0}
              icon={<FaAppleAlt />}
            />
            <StatCard
              title="Workout Streak"
              value={stats.workoutStrike || 0}
              icon={<FaTrophy />}
            />
          </div>

          {/* Charts and Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Weight Progress Chart */}
            <div className="bg-slate-900 p-6 rounded-xl">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <FaChartLine className="mr-2 text-red-500" />
                Weight Progress
              </h3>
              <WeightChart data={progress} />
            </div>

            {/* Recent Workouts */}
            <div className="bg-slate-900 p-6 rounded-xl">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <FaDumbbell className="mr-2 text-red-500" />
                Recent Workouts
              </h3>
              <RecentWorkouts workouts={workouts} />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-900 p-6 rounded-xl">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <FaPlus className="mr-2 text-red-500" />
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center">
                <FaDumbbell className="mr-2" />
                Add Workout
              </button>
              <button className="bg-slate-700 hover:bg-slate-600 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center">
                <FaAppleAlt className="mr-2" />
                Log Meal
              </button>
              <button className="bg-slate-700 hover:bg-slate-600 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center">
                <FaChartLine className="mr-2" />
                View Progress
              </button>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default Dashboard;
