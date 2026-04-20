const AiWorkoutPlan = require("../models/aiWorkoutPlan.model");

const normalizeExercises = (exercises) => {
  if (!Array.isArray(exercises)) return [];

  return exercises
    .map((ex) => {
      if (!ex) return null;

      if (typeof ex === "string") {
        const name = ex.trim();
        if (!name) return null;
        return { name, sets: 3, reps: 10 };
      }

      const name = String(ex.name || ex.exercise || ex.title || "").trim();
      if (!name) return null;

      const sets = Number.isFinite(Number(ex.sets)) ? Number(ex.sets) : 3;
      const reps = Number.isFinite(Number(ex.reps)) ? Number(ex.reps) : 10;

      return {
        name,
        sets,
        reps,
        video: ex.video ? String(ex.video) : undefined,
        isCompleted: Boolean(ex.isCompleted),
      };
    })
    .filter(Boolean);
};

const normalizeDays = (workoutPlan) => {
  if (!Array.isArray(workoutPlan)) return [];

  return workoutPlan
    .map((day, index) => {
      if (!day) return null;

      const normalizedDay = String(day.day ?? index + 1).trim();
      const workout = String(day.workout || day.title || "Workout").trim();

      return {
        day: normalizedDay || String(index + 1),
        workout: workout || "Workout",
        image: day.image ? String(day.image) : undefined,
        exercises: normalizeExercises(day.exercises),
      };
    })
    .filter(Boolean);
};

exports.getAiWorkout = async (req, res) => {
  try {
    const { goal, experience } = req.body;
    let WorkoutPlan = [];
    if (!goal || !experience) {
      return res.status(400).json({
        success: false,
        message: "Please add all fields",
      });
    }
    if (experience === "beginner") {
      if (goal === "fat loss") {
        // Generate workout for fat loss beginner
        WorkoutPlan = [
          {
            day: "1",
            workout: "Full Body HIIT",
            exercises: [
              { name: "Burpees", sets: 3, reps: 10 },
              { name: "Mountain Climbers", sets: 3, reps: 20 },
              { name: "Jump Squats", sets: 3, reps: 15 },
              { name: "High Knees", sets: 3, reps: 30 },
            ],
            image:
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
          },
          {
            day: "2",
            workout: "Cardio + Abs",
            image:
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
          },
          {
            day: "3",
            workout: "Upper Body Strength",
            image:
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
          },
          {
            day: "4",
            workout: "Lower Body Strength",
            image:
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
          },
        ];
      } else if (goal === "muscle gain") {
        // Generate workout for muscle gain beginner
        WorkoutPlan = [
          {
            day: "1",
            workout: "Chest + Triceps",
            exercises: [
              "Bench Press",
              "Tricep Dips",
              "Push-ups",
              "Overhead Tricep Extension",
            ],
            image:
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
          },
          {
            day: "2",
            workout: "Back + Biceps",
            exercises: [
              { name: "Pull-ups", sets: 3, reps: 8 },
              { name: "Bent-over Rows", sets: 3, reps: 10 },
              { name: "Bicep Curls", sets: 3, reps: 12 },
              { name: "Hammer Curls", sets: 3, reps: 12 },
            ],
            image:
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
          },
          {
            day: "3",
            workout: "Legs",
            exercises: [
              { name: "Squats", sets: 4, reps: 8 },
              { name: "Deadlifts", sets: 4, reps: 6 },
              { name: "Leg Press", sets: 3, reps: 10 },
              { name: "Calf Raises", sets: 3, reps: 15 },
            ],
            image:
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
          },
          {
            day: "4",
            workout: "Shoulders + Abs",
            exercises: [
              { name: "Shoulder Press", sets: 3, reps: 10 },
              { name: "Lateral Raises", sets: 3, reps: 12 },
              { name: "Plank", sets: 3, reps: 30 },
              { name: "Russian Twists", sets: 3, reps: 20 },
            ],
            image:
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
          },
        ];
      } else if (goal === "strength") {
        // Generate workout for strength training beginner
        WorkoutPlan = [
          {
            day: "1",
            workout: "Full Body Strength",
            exercises: [
              { name: "Deadlifts", sets: 3, reps: 5 },
              { name: "Squats", sets: 3, reps: 5 },
              { name: "Bench Press", sets: 3, reps: 5 },
              { name: "Overhead Press", sets: 3, reps: 5 },
            ],
            image:
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
          },
          {
            day: "2",
            workout: "Cardio + Abs",
            exercises: [
              { name: "Running", sets: 1, reps: 20 },
              { name: "Plank", sets: 3, reps: 30 },
              { name: "Crunches", sets: 3, reps: 15 },
              { name: "Leg Raises", sets: 3, reps: 12 },
            ],
            image:
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
          },
          {
            day: "3",
            workout: "Upper Body Strength",
            exercises: [
              { name: "Pull-ups", sets: 3, reps: 6 },
              { name: "Push-ups", sets: 3, reps: 10 },
              { name: "Rows", sets: 3, reps: 8 },
              { name: "Dips", sets: 3, reps: 8 },
            ],
            image:
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
          },
          {
            day: "4",
            workout: "Lower Body Strength",
            exercises: [
              { name: "Squats", sets: 3, reps: 6 },
              { name: "Lunges", sets: 3, reps: 8 },
              { name: "Calf Raises", sets: 3, reps: 15 },
              { name: "Glute Bridges", sets: 3, reps: 10 },
            ],
            image:
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
          },
          {
            day: "5",
            workout: "Full Body Strength",
            exercises: [
              { name: "Deadlifts", sets: 3, reps: 5 },
              { name: "Bench Press", sets: 3, reps: 5 },
              { name: "Squats", sets: 3, reps: 5 },
              { name: "Pull-ups", sets: 3, reps: 5 },
            ],
            image:
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
          },
        ];
      }
    } else if (experience === "intermediate") {
      if (goal === "fat loss") {
        // Generate workout for fat loss intermediate
        WorkoutPlan = [
          {
            day: "1",
            workout: "Push + Pull + Legs",
            exercises: [
              { name: "Bench Press", sets: 4, reps: 8 },
              { name: "Pull-ups", sets: 4, reps: 8 },
              { name: "Squats", sets: 4, reps: 8 },
              { name: "Overhead Press", sets: 3, reps: 10 },
            ],
            image:
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
          },
          {
            day: "2",
            workout: "HIIT Cardio",
            exercises: [
              { name: "Burpees", sets: 4, reps: 15 },
              { name: "Jump Rope", sets: 4, reps: 50 },
              { name: "Mountain Climbers", sets: 4, reps: 30 },
              { name: "Sprint Intervals", sets: 4, reps: 20 },
            ],
            image:
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
          },
          {
            day: "3",
            workout: "Upper Body Hypertrophy",
            exercises: [
              { name: "Incline Bench Press", sets: 4, reps: 10 },
              { name: "Lat Pulldowns", sets: 4, reps: 10 },
              { name: "Bicep Curls", sets: 3, reps: 12 },
              { name: "Tricep Extensions", sets: 3, reps: 12 },
            ],
            image:
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
          },
          {
            day: "4",
            workout: "Lower Body Hypertrophy",
            exercises: [
              { name: "Leg Press", sets: 4, reps: 10 },
              { name: "Romanian Deadlifts", sets: 4, reps: 8 },
              { name: "Leg Curls", sets: 3, reps: 12 },
              { name: "Calf Raises", sets: 3, reps: 15 },
            ],
            image:
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
          },
          {
            day: "5",
            workout: "Full Body Power",
            exercises: [
              { name: "Clean and Press", sets: 4, reps: 6 },
              { name: "Box Jumps", sets: 4, reps: 8 },
              { name: "Kettlebell Swings", sets: 4, reps: 15 },
              { name: "Push Press", sets: 3, reps: 8 },
            ],
            image:
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
          },
        ];
      } else if (goal === "muscle gain") {
        // Generate workout for muscle gain intermediate
        WorkoutPlan = [
          {
            day: "1",
            workout: "Chest + Triceps",
            exercises: [
              { name: "Bench Press", sets: 4, reps: 8 },
              { name: "Incline Dumbbell Press", sets: 4, reps: 10 },
              { name: "Tricep Dips", sets: 3, reps: 12 },
              { name: "Overhead Tricep Extension", sets: 3, reps: 12 },
            ],
            image:
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
          },
          {
            day: "2",
            workout: "Back + Biceps",
            exercises: [
              { name: "Deadlifts", sets: 4, reps: 6 },
              { name: "Pull-ups", sets: 4, reps: 8 },
              { name: "Barbell Rows", sets: 4, reps: 8 },
              { name: "Hammer Curls", sets: 3, reps: 12 },
            ],
            image:
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
          },
          {
            day: "3",
            workout: "Legs + Abs",
            exercises: [
              { name: "Squats", sets: 4, reps: 8 },
              { name: "Leg Press", sets: 4, reps: 10 },
              { name: "Plank", sets: 3, reps: 45 },
              { name: "Hanging Leg Raises", sets: 3, reps: 12 },
            ],
            image:
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
          },
          {
            day: "4",
            workout: "Shoulders + Abs",
            exercises: [
              { name: "Shoulder Press", sets: 4, reps: 8 },
              { name: "Lateral Raises", sets: 3, reps: 12 },
              { name: "Russian Twists", sets: 3, reps: 20 },
              { name: "Bicycle Crunches", sets: 3, reps: 15 },
            ],
            image:
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
          },
          {
            day: "5",
            workout: "Full Body Hypertrophy",
            exercises: [
              { name: "Clean and Jerk", sets: 4, reps: 6 },
              { name: "Push-ups", sets: 4, reps: 15 },
              { name: "Squats", sets: 4, reps: 8 },
              { name: "Pull-ups", sets: 4, reps: 8 },
            ],
            image:
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
          },
        ];
      } else {
        // Generate workout for strength training intermediate
        WorkoutPlan = [
          {
            day: "1",
            workout: "Full Body Strength",
            exercises: [
              { name: "Deadlifts", sets: 5, reps: 5 },
              { name: "Bench Press", sets: 5, reps: 5 },
              { name: "Squats", sets: 5, reps: 5 },
              { name: "Pull-ups", sets: 5, reps: 5 },
            ],
            image:
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
          },
          {
            day: "2",
            workout: "Push + Pull + Legs",
            exercises: [
              { name: "Bench Press", sets: 5, reps: 5 },
              { name: "Pull-ups", sets: 5, reps: 5 },
              { name: "Squats", sets: 5, reps: 5 },
              { name: "Overhead Press", sets: 4, reps: 6 },
            ],
            image:
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
          },
          {
            day: "3",
            workout: "Upper Body Strength",
            exercises: [
              { name: "Rows", sets: 4, reps: 6 },
              { name: "Dips", sets: 4, reps: 8 },
              { name: "Bicep Curls", sets: 4, reps: 8 },
              { name: "Tricep Extensions", sets: 4, reps: 8 },
            ],
            image:
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
          },
          {
            day: "4",
            workout: "Lower Body Strength",
            exercises: [
              { name: "Front Squats", sets: 5, reps: 5 },
              { name: "Lunges", sets: 4, reps: 8 },
              { name: "Calf Raises", sets: 4, reps: 12 },
              { name: "Glute Bridges", sets: 4, reps: 10 },
            ],
            image:
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
          },
          {
            day: "5",
            workout: "Full Body Strength",
            exercises: [
              { name: "Clean and Press", sets: 5, reps: 5 },
              { name: "Snatches", sets: 5, reps: 3 },
              { name: "Box Jumps", sets: 4, reps: 8 },
              { name: "Push Press", sets: 4, reps: 6 },
            ],
            image:
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
          },
        ];
      }
    } else if (experience === "expert") {
      // Generate workout for expert
      if (goal === "fat loss") {
        // Generate workout for fat loss expert
        WorkoutPlan = [
          {
            day: "1",
            workout: "Push + Pull + Legs",
            exercises: [
              { name: "Bench Press", sets: 5, reps: 5 },
              { name: "Pull-ups", sets: 5, reps: 5 },
              { name: "Squats", sets: 5, reps: 5 },
              { name: "Overhead Press", sets: 4, reps: 6 },
            ],
            image:
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
          },
          {
            day: "2",
            workout: "HIIT Cardio",
            exercises: [
              { name: "Burpees", sets: 5, reps: 20 },
              { name: "Jump Rope", sets: 5, reps: 100 },
              { name: "Mountain Climbers", sets: 5, reps: 40 },
              { name: "Sprint Intervals", sets: 5, reps: 30 },
            ],
            image:
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
          },
          {
            day: "3",
            workout: "Upper Body Hypertrophy",
            exercises: [
              { name: "Incline Bench Press", sets: 4, reps: 8 },
              { name: "Lat Pulldowns", sets: 4, reps: 8 },
              { name: "Bicep Curls", sets: 4, reps: 10 },
              { name: "Tricep Extensions", sets: 4, reps: 10 },
            ],
            image:
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
          },
          {
            day: "4",
            workout: "Lower Body Hypertrophy",
            exercises: [
              { name: "Leg Press", sets: 4, reps: 8 },
              { name: "Romanian Deadlifts", sets: 4, reps: 6 },
              { name: "Leg Curls", sets: 4, reps: 10 },
              { name: "Calf Raises", sets: 4, reps: 12 },
            ],
            image:
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
          },
          {
            day: "5",
            workout: "Full Body Power",
            exercises: [
              { name: "Clean and Press", sets: 5, reps: 5 },
              { name: "Box Jumps", sets: 5, reps: 6 },
              { name: "Kettlebell Swings", sets: 5, reps: 20 },
              { name: "Push Press", sets: 4, reps: 6 },
            ],
            image:
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
          },
          {
            day: "6",
            workout: "Cardio + Abs",
            exercises: [
              { name: "Running in Place", sets: 4, reps: 60 },
              { name: "Plank", sets: 4, reps: 45 },
              { name: "Bicycle Crunches", sets: 4, reps: 25 },
              { name: "Leg Raises", sets: 4, reps: 15 },
            ],
            image:
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
          },
          {
            day: "7",
            workout: "Rest Day",
            image:
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
          },
        ];
      } else if (goal === "muscle gain") {
        // Generate workout for muscle gain expert
        WorkoutPlan = [
          {
            day: "1",
            workout: "Chest + Triceps",
            exercises: [
              { name: "Bench Press", sets: 5, reps: 5 },
              { name: "Incline Dumbbell Press", sets: 4, reps: 8 },
              { name: "Tricep Dips", sets: 4, reps: 10 },
              { name: "Overhead Tricep Extension", sets: 4, reps: 10 },
            ],
            image:
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
          },
          {
            day: "2",
            workout: "Back + Biceps",
            exercises: [
              { name: "Deadlifts", sets: 5, reps: 5 },
              { name: "Pull-ups", sets: 5, reps: 6 },
              { name: "Barbell Rows", sets: 4, reps: 8 },
              { name: "Hammer Curls", sets: 4, reps: 10 },
            ],
            image:
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
          },
          {
            day: "3",
            workout: "Legs + Abs",
            exercises: [
              { name: "Squats", sets: 5, reps: 5 },
              { name: "Leg Press", sets: 4, reps: 8 },
              { name: "Plank", sets: 4, reps: 60 },
              { name: "Hanging Leg Raises", sets: 4, reps: 12 },
            ],
            image:
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
          },
          {
            day: "4",
            workout: "Shoulders + Abs",
            exercises: [
              { name: "Shoulder Press", sets: 5, reps: 5 },
              { name: "Lateral Raises", sets: 4, reps: 10 },
              { name: "Russian Twists", sets: 4, reps: 20 },
              { name: "Bicycle Crunches", sets: 4, reps: 20 },
            ],
            image:
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
          },
          {
            day: "5",
            workout: "Full Body Hypertrophy",
            exercises: [
              { name: "Clean and Jerk", sets: 5, reps: 5 },
              { name: "Push-ups", sets: 5, reps: 15 },
              { name: "Squats", sets: 5, reps: 5 },
              { name: "Pull-ups", sets: 5, reps: 6 },
            ],
            image:
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
          },
          {
            day: "6",
            workout: "Cardio + Abs",
            exercises: [
              { name: "Running in Place", sets: 4, reps: 60 },
              { name: "Plank", sets: 4, reps: 45 },
              { name: "Bicycle Crunches", sets: 4, reps: 25 },
              { name: "Leg Raises", sets: 4, reps: 15 },
            ],
            image:
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
          },
          {
            day: "7",
            workout: "Rest Day",
            image:
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
          },
        ];
      } else {
        // Generate workout for strength training expert
        WorkoutPlan = [
          {
            day: "1",
            workout: "Full Body Strength",
            exercises: [
              { name: "Deadlifts", sets: 6, reps: 3 },
              { name: "Bench Press", sets: 6, reps: 3 },
              { name: "Squats", sets: 6, reps: 3 },
              { name: "Pull-ups", sets: 6, reps: 3 },
            ],
            image:
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
          },
          {
            day: "2",
            workout: "Push + Pull + Legs",
            exercises: [
              { name: "Bench Press", sets: 6, reps: 3 },
              { name: "Pull-ups", sets: 6, reps: 3 },
              { name: "Squats", sets: 6, reps: 3 },
              { name: "Overhead Press", sets: 5, reps: 4 },
            ],
            image:
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
          },
          {
            day: "3",
            workout: "Upper Body Strength",
            exercises: [
              { name: "Rows", sets: 5, reps: 4 },
              { name: "Dips", sets: 5, reps: 5 },
              { name: "Bicep Curls", sets: 5, reps: 5 },
              { name: "Tricep Extensions", sets: 5, reps: 5 },
            ],
            image:
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
          },
          {
            day: "4",
            workout: "Lower Body Strength",
            exercises: [
              { name: "Front Squats", sets: 6, reps: 3 },
              { name: "Lunges", sets: 5, reps: 5 },
              { name: "Calf Raises", sets: 5, reps: 8 },
              { name: "Glute Bridges", sets: 5, reps: 8 },
            ],
            image:
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
          },
          {
            day: "5",
            workout: "Full Body Strength",
            exercises: [
              { name: "Clean and Press", sets: 6, reps: 3 },
              { name: "Snatches", sets: 6, reps: 2 },
              { name: "Box Jumps", sets: 5, reps: 5 },
              { name: "Push Press", sets: 5, reps: 4 },
            ],
            image:
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
          },
          {
            day: "6",
            workout: "Cardio + Abs",
            exercises: [
              { name: "Running in Place", sets: 4, reps: 60 },
              { name: "Plank", sets: 4, reps: 45 },
              { name: "Bicycle Crunches", sets: 4, reps: 25 },
              { name: "Leg Raises", sets: 4, reps: 15 },
            ],
            image:
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
          },
          {
            day: "7",
            workout: "Rest Day",
            image:
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
          },
        ];
      }
    }

    const days = normalizeDays(WorkoutPlan);

    // If the request is authenticated, persist the generated plan for the user.
    if (req.user && req.user._id) {
      const savedPlan = await AiWorkoutPlan.create({
        userId: req.user._id,
        goal,
        experience,
        days,
      });

      return res.status(200).json({
        success: true,
        saved: true,
        message: "AI Workout generated and saved",
        data: { planId: savedPlan._id, days: savedPlan.days },
      });
    }

    return res.status(200).json({
      success: true,
      saved: false,
      message: "AI Workout generated",
      data: { days },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
      error: "Server Error" + err.message,
    });
  }
};

exports.completeExercise = async (req, res) => {
  try {
    const { planId, dayId, exerciseId } = req.body || {};

    if (!planId || !dayId || !exerciseId) {
      return res.status(400).json({
        success: false,
        message: "planId, dayId and exerciseId are required",
      });
    }

    const plan = await AiWorkoutPlan.findOne({
      _id: planId,
      userId: req.user._id,
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    const day = plan.days.id(dayId);
    if (!day) {
      return res.status(404).json({
        success: false,
        message: "Day not found",
      });
    }

    const exercise = day.exercises.id(exerciseId);
    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: "Exercise not found",
      });
    }

    exercise.isCompleted = true;
    await plan.save();

    return res.status(200).json({
      success: true,
      message: "Exercise marked as completed",
      data: { planId, dayId, exerciseId },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
      error: "Server Error" + err.message,
    });
  }
};
