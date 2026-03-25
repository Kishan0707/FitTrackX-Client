import React, { useEffect, useState } from "react";
import DashboardLayout from "../layout/DashboardLayout";
import API from "../services/api";

const WorkoutsHistory = () => {
  const [workouts, setWorkouts] = useState([]);
  const [filteredWorkouts, setFilteredWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  useEffect(() => {
    fetchWorkouts();
  }, []);

  useEffect(() => {
    filterAndSortWorkouts();
  }, [workouts, searchTerm, filterType, sortBy]);

  const fetchWorkouts = async () => {
    try {
      setLoading(true);
      const res = await API.get("/workouts");
      setWorkouts(res.data.data || []);
    } catch (error) {
      console.error("Error fetching workouts:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortWorkouts = () => {
    let filtered = [...workouts];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (w) =>
          w.exerciseType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          w.notes?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Type filter
    if (filterType !== "all") {
      filtered = filtered.filter((w) => w.exerciseType === filterType);
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.date) - new Date(a.date);
      } else if (sortBy === "calories") {
        return (b.caloriesBurned || 0) - (a.caloriesBurned || 0);
      } else if (sortBy === "duration") {
        return (b.duration || 0) - (a.duration || 0);
      }
      return 0;
    });

    setFilteredWorkouts(filtered);
  };

  const deleteWorkout = async (id) => {
    if (!window.confirm("Are you sure you want to delete this workout?"))
      return;

    try {
      await API.delete(`/workouts/${id}`);
      setWorkouts(workouts.filter((w) => w._id !== id));
    } catch (error) {
      console.error("Error deleting workout:", error);
      alert("Failed to delete workout");
    }
  };

  const exerciseTypes = [
    ...new Set(workouts.map((w) => w.exerciseType).filter(Boolean)),
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-400">Loading history...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Workout History</h1>

        {/* Filters */}
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Search workouts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900 text-white px-4 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500"
            />

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-900 text-white px-4 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Types</option>
              {exerciseTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-900 text-white px-4 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="date">Sort by Date</option>
              <option value="calories">Sort by Calories</option>
              <option value="duration">Sort by Duration</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <p className="text-slate-400">
          Showing {filteredWorkouts.length} of {workouts.length} workouts
        </p>

        {/* Workout List */}
        {filteredWorkouts.length === 0 ? (
          <div className="bg-slate-800 p-8 rounded-lg border border-slate-700 text-center">
            <p className="text-slate-400">No workouts found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredWorkouts.map((workout) => (
              <div
                key={workout._id}
                className="bg-slate-800 p-6 rounded-lg border border-slate-700 hover:border-blue-500 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-white">
                        {workout.exerciseType || "Workout"}
                      </h3>
                      <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                        {new Date(workout.date).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-slate-400 text-sm">Duration</p>
                        <p className="text-white font-semibold">
                          {workout.duration || 0} min
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm">Calories</p>
                        <p className="text-white font-semibold">
                          {workout.caloriesBurned || 0} kcal
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm">Sets</p>
                        <p className="text-white font-semibold">
                          {workout.sets || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm">Reps</p>
                        <p className="text-white font-semibold">
                          {workout.reps || 0}
                        </p>
                      </div>
                    </div>

                    {workout.notes && (
                      <div className="mt-4">
                        <p className="text-slate-400 text-sm">Notes</p>
                        <p className="text-white">{workout.notes}</p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => deleteWorkout(workout._id)}
                    className="ml-4 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default WorkoutsHistory;
