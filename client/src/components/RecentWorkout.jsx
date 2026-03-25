import WorkoutCard from "./WorkoutCard";
import { AuthContext } from "../context/authContext";

const RecentWorkouts = ({ workouts }) => {
  return (
    <div className="mt-6">
      <h2 className="mb-4 font-semibold text-xl">Recent Workouts</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workouts.map((workout) => (
          <WorkoutCard key={workout._id} workout={workout} />
        ))}
      </div>
    </div>
  );
};

export default RecentWorkouts;
