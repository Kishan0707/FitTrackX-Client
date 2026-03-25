import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import API from "../../services/api";
import WorkoutCard from "../../components/WorkoutCard";

const Workouts = () => {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        console.log("Starting fetch...");
        const res = await API.get("/workouts");
        console.log("API Response received:", res);
        console.log("Status:", res.status);
        console.log("Data:", res.data);

        if (res.data && res.data.data) {
          console.log("Setting workouts:", res.data.data);
          setWorkouts(res.data.data);
        } else {
          console.log("No data found in response");
          setError("No workouts data received");
        }
      } catch (error) {
        console.error("Error fetching workouts:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkouts();
  }, []);

  return (
    <div className="bg-slate-800 p-6 my-5">
      <h1 className="text-2xl font-bold mb-6">My Workouts</h1>

      {loading && <p className="text-slate-400">Loading...</p>}

      {error && <p className="text-red-500">Error: {error}</p>}

      {!loading && !error && workouts.length === 0 ? (
        <p className="text-slate-400">
          No workouts found. Add your first workout!
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workouts.map((workout) => (
            <WorkoutCard key={workout._id} workout={workout} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Workouts;
