const dietModel = require("../models/diet.model");
const User = require("../models/user.model");
const redisClient = require("../config/redis");

exports.addDiet = async (req, res) => {
  try {
    const { meals } = req.body;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Find existing diet for today
    let diet = await dietModel.findOne({
      userId: req.user._id,
      createdAt: {
        $gte: today,
        $lt: tomorrow,
      },
    });

    if (diet) {
      // Update existing diet: add new meals and recalculate totals
      diet.meals.push(...meals);
      diet.totalCalories = 0;
      diet.totalProtein = 0;
      diet.totalCarbs = 0;
      diet.totalFat = 0;
      diet.meals.forEach((meal) => {
        meal.foods.forEach((food) => {
          diet.totalCalories += food.calories;
          diet.totalProtein += food.protein;
          diet.totalCarbs += food.carbs;
          diet.totalFat += food.fat;
        });
      });
      await diet.save();
    } else {
      // Create new diet
      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;

      meals.forEach((meal) => {
        meal.foods.forEach((food) => {
          totalCalories += food.calories;
          totalProtein += food.protein;
          totalCarbs += food.carbs;
          totalFat += food.fat;
        });
      });

      diet = await dietModel.create({
        userId: req.user._id,
        meals,
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFat,
      });
    }

    res.status(201).json({
      success: true,
      data: diet,
    });
  } catch (err) {
    console.log("====================================");
    console.error(err);
    console.log("====================================");

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getAllDiet = async (req, res) => {
  try {
    const diets = await dietModel.find({ userId: req.user._id });
    res.status(200).json({
      success: true,
      count: diets.length,
      data: diets,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
// today diet summary
exports.getTodayDiet = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set time to beginning of day
    const diet = await dietModel
      .findOne({
        userId: req.user._id,
        createdAt: {
          $gte: today, // Start of day
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000), // End of day
        },
      })
      .sort({ createdAt: -1 }); // Get the latest diet for today

    // Removed caching to ensure fresh data after updates
    res.status(200).json({
      success: true,
      source: "database",
      data: diet || {},
    });
  } catch (err) {
    console.log("====================================");
    console.log(err);
    console.log("====================================");
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.deleteDiet = async (req, res) => {
  try {
    const diet = await dietModel.findByIdAndDelete(req.params.id);
    if (!diet) {
      return res.status(404).json({
        success: false,
        message: "Diet not found",
      });
    }
    if (diet.userId.toString() !== req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "Unauthorized",
      });
    }
    res.status(200).json({
      success: true,
      message: "Diet deleted successfully",
    });
  } catch (err) {
    console.log("====================================");
    console.log(err);
    console.log("====================================");
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.updateDiet = async (req, res) => {
  try {
    const { meals } = req.body;

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    meals.forEach((meal) => {
      meal.foods.forEach((food) => {
        totalCalories += food.calories;
        totalProtein += food.protein;
        totalCarbs += food.carbs;
        totalFat += food.fat;
      });
    });

    const diet = await dietModel.findByIdAndUpdate(
      req.params.id,
      {
        userId: req.user._id,
        meals,
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFat,
      },
      { new: true },
    );

    if (!diet) {
      return res.status(404).json({
        success: false,
        message: "Diet not found",
      });
    }

    if (diet.userId.toString() !== req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "Unauthorized",
      });
    }

    res.status(200).json({
      success: true,
      data: diet,
    });
  } catch (err) {
    console.log("====================================");
    console.error(err);
    console.log("====================================");

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
exports.getMacroDistribution = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const diet = await dietModel.findOne({
      userId: req.user._id,
      createdAt: {
        $gte: today,
        $lt: tomorrow,
      },
    });

    if (!diet) {
      return res.status(404).json({
        success: false,
        message: "No diet found for today",
      });
    }

    const totalCalories = diet.totalCalories;
    const proteinCalories = diet.totalProtein * 4; // 1g protein = 4 cal
    const carbCalories = diet.totalCarbs * 4; // 1g carbs = 4 cal
    const fatCalories = diet.totalFat * 9; // 1g fat = 9 cal

    const proteinPercentage = (proteinCalories / totalCalories) * 100;
    const carbPercentage = (carbCalories / totalCalories) * 100;
    const fatPercentage = (fatCalories / totalCalories) * 100;

    res.status(200).json({
      success: true,
      data: {
        totalCalories,
        protein: {
          calories: proteinCalories,
          percentage: proteinPercentage,
        },
        carbs: {
          calories: carbCalories,
          percentage: carbPercentage,
        },
        fat: {
          calories: fatCalories,
          percentage: fatPercentage,
        },
      },
    });
  } catch (err) {
    console.log("====================================");
    console.log(err);
    console.log("====================================");
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
exports.getGrocerySuggestions = async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  try {
    const diet = await dietModel.findOne({
      userId: req.user._id,
      createdAt: {
        $gte: today, // Start of day
        $lt: tomorrow, // End of day
      },
    });
    const target = {
      calories: 2500,
      protein: 150,
      carbs: 300,
      fat: 80,
    };
    const suggestion = [];
    const current = {
      calories: diet ? diet.totalCalories : 0,
      protein: diet ? diet.totalProtein : 0,
      carbs: diet ? diet.totalCarbs : 0,
      fat: diet ? diet.totalFat : 0,
      remaining: {
        calories: target.calories - (diet ? diet.totalCalories : 0),
        protein: target.protein - (diet ? diet.totalProtein : 0),
        carbs: target.carbs - (diet ? diet.totalCarbs : 0),
        fat: target.fat - (diet ? diet.totalFat : 0),
      },
      suggestion: [],
    };
    if (current.protein < target.protein) {
      suggestion.push("Soya Chunks", "Paneer", "Greek Yogurt", "Peanut Butter");
    }
    if (current.carbs < target.carbs) {
      suggestion.push("Oats", "Brown Rice", "Potatoes", "Bananas");
    }
    if (current.carbs < target.carbs) {
      suggestion.push("Oats", "Brown Rice", "Potatoes", "Bananas");
    }
    res.status(200).json({
      success: true,
      currentIntake: current,
      target,
      suggestion,
    });
  } catch (err) {
    console.log("====================================");
    console.log(err);
    console.log("====================================");
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
