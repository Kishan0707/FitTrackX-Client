const dietModel = require("../models/diet.model");
const User = require("../models/user.model");
const redisClient = require("../config/redis");

const isCoachRole = (role) => ["coach", "admin"].includes(role);

const buildClientLookup = (req, clientId) => {
  if (!clientId) return null;

  if (req.user.role === "admin") {
    return { _id: clientId, role: "user" };
  }

  return {
    _id: clientId,
    role: "user",
    $or: [{ assignedCoach: req.user._id }, { coachId: req.user._id }],
  };
};

const resolveDietTarget = async (req, clientId) => {
  if (!isCoachRole(req.user.role) || !clientId) {
    return {
      targetUserId: req.user._id,
      coachId: req.user._id,
    };
  }

  const client = await User.findOne(buildClientLookup(req, clientId)).select(
    "_id name email",
  );

  if (!client) {
    const error = new Error("Client not found");
    error.statusCode = 404;
    throw error;
  }

  return {
    client,
    targetUserId: client._id,
    coachId: req.user._id,
  };
};

const computeTotals = (meals = []) => {
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;

  meals.forEach((meal) => {
    meal.foods.forEach((food) => {
      totalCalories += food.calories || 0;
      totalProtein += food.protein || 0;
      totalCarbs += food.carbs || 0;
      totalFat += food.fat || 0;
    });
  });

  return {
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFat,
  };
};

const canManageDiet = (req, diet) =>
  req.user.role === "admin" ||
  diet.userId.toString() === req.user._id.toString() ||
  diet.coachId.toString() === req.user._id.toString();

const validateMeals = (meals) => {
  if (!Array.isArray(meals) || meals.length === 0) {
    const error = new Error("At least one meal is required");
    error.statusCode = 400;
    throw error;
  }

  return meals.map((meal, mealIndex) => {
    const mealName = String(meal?.mealName || "").trim();
    if (!mealName) {
      const error = new Error(`Meal name is required for meal ${mealIndex + 1}`);
      error.statusCode = 400;
      throw error;
    }

    if (!Array.isArray(meal.foods) || meal.foods.length === 0) {
      const error = new Error(`At least one food is required for ${mealName}`);
      error.statusCode = 400;
      throw error;
    }

    const foods = meal.foods.map((food, foodIndex) => {
      const foodName = String(food?.foodName || "").trim();
      if (!foodName) {
        const error = new Error(
          `Food name is required for item ${foodIndex + 1} in ${mealName}`,
        );
        error.statusCode = 400;
        throw error;
      }

      return {
        foodName,
        quantity: Number(food.quantity) || 1,
        calories: Number(food.calories) || 0,
        protein: Number(food.protein) || 0,
        carbs: Number(food.carbs) || 0,
        fat: Number(food.fat) || 0,
        sugar: Number(food.sugar) || 0,
        sodium: Number(food.sodium) || 0,
      };
    });

    return {
      mealName,
      foods,
    };
  });
};

exports.addDiet = async (req, res) => {
  try {
    const { meals, clientId } = req.body;
    const { targetUserId, coachId } = await resolveDietTarget(req, clientId);
    const validatedMeals = validateMeals(meals);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Find existing diet for today
    let diet = await dietModel.findOne({
      userId: targetUserId,
      coachId,
      createdAt: {
        $gte: today,
        $lt: tomorrow,
      },
    });

    if (diet) {
      // Update existing diet: add new meals and recalculate totals
      diet.meals.push(...validatedMeals);
      Object.assign(diet, computeTotals(diet.meals));
      await diet.save();
    } else {
      const totals = computeTotals(validatedMeals);

      diet = await dietModel.create({
        userId: targetUserId,
        coachId,
        meals: validatedMeals,
        ...totals,
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

    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getAllDiet = async (req, res) => {
  try {
    const { clientId } = req.query;
    let query = { userId: req.user._id };

    if (isCoachRole(req.user.role)) {
      if (clientId) {
        const { targetUserId } = await resolveDietTarget(req, clientId);
        query = { userId: targetUserId, coachId: req.user._id };
      } else {
        query = { coachId: req.user._id };
      }
    }

    const diets = await dietModel
      .find(query)
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: diets.length,
      data: diets,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  }
};
// today diet summary
exports.getTodayDiet = async (req, res) => {
  try {
    const { clientId } = req.query;
    const { targetUserId, coachId } = await resolveDietTarget(req, clientId);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set time to beginning of day
    const query = {
      userId: targetUserId,
      createdAt: {
        $gte: today, // Start of day
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000), // End of day
      },
    };

    if (isCoachRole(req.user.role) && clientId) {
      query.coachId = coachId;
    }

    const diet = await dietModel.findOne(query).sort({ createdAt: -1 }); // Get the latest diet for today

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
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.deleteDiet = async (req, res) => {
  try {
    const diet = await dietModel.findById(req.params.id);
    if (!diet) {
      return res.status(404).json({
        success: false,
        message: "Diet not found",
      });
    }
    if (!canManageDiet(req, diet)) {
      return res.status(400).json({
        success: false,
        message: "Unauthorized",
      });
    }

    await diet.deleteOne();

    res.status(200).json({
      success: true,
      message: "Diet deleted successfully",
    });
  } catch (err) {
    console.log("====================================");
    console.log(err);
    console.log("====================================");
    res.status(err.statusCode || 500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.updateDiet = async (req, res) => {
  try {
    const { meals } = req.body;
    const diet = await dietModel.findById(req.params.id);
    const validatedMeals = validateMeals(meals);

    if (!diet) {
      return res.status(404).json({
        success: false,
        message: "Diet not found",
      });
    }

    if (!canManageDiet(req, diet)) {
      return res.status(400).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const totals = computeTotals(validatedMeals);
    diet.meals = validatedMeals;
    diet.totalCalories = totals.totalCalories;
    diet.totalProtein = totals.totalProtein;
    diet.totalCarbs = totals.totalCarbs;
    diet.totalFat = totals.totalFat;
    await diet.save();

    res.status(200).json({
      success: true,
      data: diet,
    });
  } catch (err) {
    console.log("====================================");
    console.error(err);
    console.log("====================================");

    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  }
};
exports.getMacroDistribution = async (req, res) => {
  try {
    const { clientId } = req.query;
    const { targetUserId, coachId } = await resolveDietTarget(req, clientId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const query = {
      userId: targetUserId,
      createdAt: {
        $gte: today,
        $lt: tomorrow,
      },
    };

    if (isCoachRole(req.user.role) && clientId) {
      query.coachId = coachId;
    }

    const diet = await dietModel.findOne(query);

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
    res.status(err.statusCode || 500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
exports.getGrocerySuggestions = async (req, res) => {
  const { clientId } = req.query;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  try {
    const { targetUserId, coachId } = await resolveDietTarget(req, clientId);
    const query = {
      userId: targetUserId,
      createdAt: {
        $gte: today, // Start of day
        $lt: tomorrow, // End of day
      },
    };

    if (isCoachRole(req.user.role) && clientId) {
      query.coachId = coachId;
    }

    const diet = await dietModel.findOne(query);
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
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Internal server error",
    });
  }
};
