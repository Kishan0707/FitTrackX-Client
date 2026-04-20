exports.calculateBMI = async (req, res) => {
  try {
    const { height, weight } = req.body;

    if (!height || !weight) {
      return res.status(400).json({
        success: false,
        message: "Height and weight are required",
      });
    }

    const heightInMeter = height / 100;

    const bmi = weight / (heightInMeter * heightInMeter);

    let category = "";

    if (bmi < 18.5) {
      category = "Underweight";
    } else if (bmi < 25) {
      category = "Normal";
    } else if (bmi < 30) {
      category = "Overweight";
    } else {
      category = "Obese";
    }

    res.status(200).json({
      success: true,
      data: {
        height,
        weight,
        bmi: bmi.toFixed(2),
        category,
        message: `Your BMI is ${bmi.toFixed(2)} and you are ${category}`,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.calculateCalories = async (req, res) => {
  try {
    const { age, gender, height, weight, activityLevel } = req.body;

    if (!age || !gender || !height || !weight || !activityLevel) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    let bmr = 0;

    if (gender === "male") {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      veryActive: 1.9,
    };
    const multiplier = activityMultipliers[activityLevel];
    const TDEE = bmr * multiplier;

    const maintenance = Math.round(TDEE);
    const bulk = Math.round(TDEE + 500);
    const cut = Math.round(TDEE - 500);
    const dailyCalorieRequirement = Math.round(TDEE);

    res.status(200).json({
      success: true,
      data: {
        BMR: Math.round(bmr),
        TDEE: maintenance,
        calories: {
          maintenance,
          bulk,
          cut,
        },
        multiplier,
        message: `Your daily calorie requirement is ${Math.round(dailyCalorieRequirement)} calories`,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};
