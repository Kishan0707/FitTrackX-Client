import { useNavigate } from "react-router-dom";
import { useState } from "react";
import React from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import API from "../../services/api";
import Workouts from "./Workouts";

const AddWorkout = () => {
  const [formData, setFormData] = useState({
    type: "",
    caloriesBurned: "",
    duration: "",
    exercises: [],
  });

  const [exercise, setExercise] = useState({
    name: "",
    sets: "",
    reps: "",
    weight: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const exerciseOptions = [
    "Push Ups",
    "Pull Ups",
    "Squats",
    "Lunges",
    "Plank",
    "Burpees",
    "Bench Press",
    "Deadlift",
    "Bicep Curls",
    "Tricep Dips",
    "Shoulder Press",
    "Leg Press",
    "Running",
    "Cycling",
    "Swimming",
  ];

  const navigate = useNavigate();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleExerciseChange = (e) =>
    setExercise({ ...exercise, [e.target.name]: e.target.value });

  const addExercise = () => {
    if (exercise.name && exercise.sets && exercise.reps) {
      setFormData({
        ...formData,
        exercises: [...formData.exercises, exercise],
      });
      setExercise({ name: "", sets: "", reps: "", weight: "", duration: "" });
    }
  };

  const removeExercise = (index) => {
    setFormData({
      ...formData,
      exercises: formData.exercises.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await API.post("/workouts", formData);

      setSuccess(response.data.message);
      setFormData({
        type: "",
        caloriesBurned: "",
        duration: "",
        exercises: [],
        weight: null,
      });

      setTimeout(() => {
        setSuccess("");
        navigate("/workouts");
      }, 3000);
    } catch (error) {
      setError(error.response?.data?.message || "Error adding workout");
    }
  };

  return (
    <>
      <DashboardLayout>
        {error && (
          <div className="bg-red-500 text-white p-2 rounded mb-2 absolute right-10 top-30">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-500 text-white p-2 rounded mb-2 absolute right-10 top-25">
            {success}
          </div>
        )}
        <div
          className="
          flex flex-col items-center justify-center w-full
        "
        >
          <form
            onSubmit={handleSubmit}
            className="flex flex-col w-full gap-4 max-w-3xl bg-slate-800/80 p-6 rounded-2xl backdrop-blur-2xl shadow-lg"
          >
            <h1 className="text-2xl font-bold mb-6 flex justify-start items-center gap-2 w-full text-white  md:text-2xl lg:text-3xltext-start">
              Add Workout
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-3 ">
              <input
                type="text"
                className="p-2 rounded bg-slate-900/80 border border-slate-700 backdrop-blur-2xl shadow  focus:border-blue-500 outline-0"
                name="type"
                value={formData.type}
                onChange={handleChange}
                placeholder="Workout Type"
                required
              />
              <input
                type="number"
                placeholder="Calories Burned"
                name="caloriesBurned"
                value={formData.caloriesBurned}
                onChange={handleChange}
                className="p-2 rounded bg-slate-900/80 border border-slate-700 backdrop-blur-2xl shadow  focus:border-blue-500 outline-0"
                required
              />
              <input
                type="number"
                placeholder="Duration (minutes)"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className="p-2 rounded bg-slate-900/80 border border-slate-700 backdrop-blur-2xl shadow  focus:border-blue-500 outline-0"
                required
              />
            </div>

            <div className="border border-slate-700/80 backdrop-blur-2xl p-4 rounded w-full">
              <h3 className="font-semibold mb-3">Add Exercises</h3>
              <div className="flex flex-col gap-3">
                <select
                  name="name"
                  value={exercise.name}
                  onChange={handleExerciseChange}
                  className="p-2 rounded bg-slate-950/80 shadow-lg backdrop-blur-2xl"
                >
                  <option value="">Select Exercise</option>
                  {exerciseOptions.map((ex) => (
                    <option key={ex} value={ex}>
                      {ex}
                    </option>
                  ))}
                </select>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full">
                  <input
                    type="number"
                    name="sets"
                    value={exercise.sets}
                    onChange={handleExerciseChange}
                    placeholder="Sets"
                    className="p-2 rounded bg-slate-900/80 border border-slate-700 backdrop-blur-2xl shadow  focus:border-blue-500 outline-0"
                  />

                  <input
                    type="number"
                    name="reps"
                    value={exercise.reps}
                    onChange={handleExerciseChange}
                    placeholder="Reps"
                    className="p-2 rounded bg-slate-900/80 border border-slate-700 backdrop-blur-2xl shadow  focus:border-blue-500 outline-0"
                  />

                  <input
                    type="number"
                    name="weight"
                    value={exercise.weight}
                    onChange={handleExerciseChange}
                    placeholder="Weight (optional)"
                    className="p-2 rounded bg-slate-900/80 border border-slate-700 backdrop-blur-2xl shadow  focus:border-blue-500 outline-0"
                  />
                </div>
                <input
                  type="number"
                  name="duration"
                  value={exercise.duration}
                  onChange={handleExerciseChange}
                  placeholder="Duration (minutes, optional)"
                  className="p-2 rounded bg-slate-900/80 border border-slate-700 backdrop-blur-2xl shadow  focus:border-blue-500 outline-0"
                />

                <button
                  type="button"
                  onClick={addExercise}
                  className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
                >
                  Add Exercise
                </button>
              </div>

              {formData.exercises.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Added Exercises:</h4>
                  {formData.exercises.map((ex, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center bg-slate-800 p-2 rounded mb-2"
                    >
                      <span>
                        {ex.name} - {ex.sets} sets x {ex.reps} reps{" "}
                        {ex.weight && `x ${ex.weight} lbs`}{" "}
                        {ex.duration && `for ${ex.duration} min`}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeExercise(index)}
                        className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              Add Workout
            </button>
          </form>
        </div>
        <Workouts />
      </DashboardLayout>
    </>
  );
};

export default AddWorkout;
