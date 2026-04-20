const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema({
  foodName: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  calories: {
    type: Number,
    required: true,
  },
  protein: {
    type: Number,
    required: true,
  },
  carbs: {
    type: Number,
    required: true,
  },
  fat: {
    type: Number,
    required: true,
  },
  sugar: {
    type: Number,
    required: true,
  },
  sodium: {
    type: Number,
    required: true,
  },
  time: {
    type: Date,
    default: Date.now,
  },
});

const mealSchema = new mongoose.Schema({
  mealName: {
    type: String,
    required: true,
  },
  foods: [foodSchema],
});

const dietSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    coachId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    date: {
      type: Date,
      default: Date.now,
    },

    meals: [mealSchema],

    totalCalories: {
      type: Number,
      default: 0,
    },

    totalProtein: {
      type: Number,
      default: 0,
    },

    totalCarbs: {
      type: Number,
      default: 0,
    },
    totalFat: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

// Calculate totals before saving
dietSchema.pre('save', async function() {
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;

  this.meals.forEach(meal => {
    meal.foods.forEach(food => {
      totalCalories += food.calories || 0;
      totalProtein += food.protein || 0;
      totalCarbs += food.carbs || 0;
      totalFat += food.fat || 0;
    });
  });

  this.totalCalories = totalCalories;
  this.totalProtein = totalProtein;
  this.totalCarbs = totalCarbs;
  this.totalFat = totalFat;
});

module.exports = mongoose.model("Diet", dietSchema);
