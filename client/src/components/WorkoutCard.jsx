import API from "../services/api";

const WorkoutCard = ({ workout }) => {
  const deleteWorkout = async () => {
    await API.delete(`/workouts/${workout._id}`);

    window.location.reload();
  };

  return (
    <div className="bg-slate-900 p-5 rounded-xl shadow ring-1 ring-slate-700 hover:ring-red-500">
      <h2 className="text-lg font-semibold mb-2">{workout.type}</h2>

      <div className="mb-3">
        <h3 className="text-sm font-medium text-slate-300 mb-1">Exercises:</h3>
        {workout.exercises && workout.exercises.length > 0 ? (
          <ul className="text-sm text-slate-400 space-y-1">
            {workout.exercises.map((exercise, index) => (
              <li key={index} className="border-l-2 border-slate-600 pl-2">
                <span className="font-medium">{exercise.name}</span> -
                {exercise.sets} sets × {exercise.reps} reps
                {exercise.weight && ` @ ${exercise.weight}kg`}
                {exercise.duration && ` for ${exercise.duration} min`}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">No exercises recorded</p>
        )}
      </div>

      <p className="text-sm text-slate-400 mb-1">
        Duration: {workout.duration} minutes
      </p>

      <p className="text-sm text-slate-400 mb-1">
        Calories Burned: {workout.caloriesBurned}
      </p>

      <p className="text-sm text-slate-400">
        Date: {new Date(workout.createdAt).toLocaleDateString()}
      </p>

      <button
        onClick={deleteWorkout}
        className="mt-4 bg-red-500 px-3 py-1 rounded hover:bg-red-600 transition"
      >
        Delete
      </button>
    </div>
  );
};

export default WorkoutCard;
