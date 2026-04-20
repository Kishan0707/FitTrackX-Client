const User = require("../models/user.model");
const OnboardingSubmission = require("../models/onboarding.model");
const BodyMeasurement = require("../models/bodyMeasurement.model");

const deriveCoachSuggestion = (goal) => {
  if (!goal) return "Performance + Mobility Coach";
  const normalized = goal.toLowerCase();
  if (normalized.includes("lose")) return "Fat-loss Calisthenics Coach";
  if (normalized.includes("build") || normalized.includes("muscle"))
    return "Strength & Hypertrophy Coach";
  if (normalized.includes("endurance")) return "Metabolic Conditioning Coach";
  if (normalized.includes("calisthenics")) return "Calisthenics Flow Mentor";
  return "Performance + Mobility Coach";
};

exports.completeOnboarding = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const {
      promoRevealed = false,
      feedback = null,
      photoName = null,
      ...answers
    } = req.body || {};
    Z;

    const height = Number(answers.height || 0);
    const currentWeight = Number(answers.currentWeight || 0);
    const goalWeight = Number(answers.goalWeight || currentWeight || 60);
    const heightMeters = height / 100;
    const bmi =
      heightMeters > 0 && currentWeight > 0 ?
        currentWeight / (heightMeters * heightMeters)
      : 0;
    const bodyType =
      bmi < 18.5 ? "Ectomorph"
      : bmi < 25 ? "Mesomorph"
      : "Endomorph";
    const metabolism =
      bodyType === "Ectomorph" ? "Fast (tough to gain mass)"
      : bodyType === "Mesomorph" ? "Balanced and responsive"
      : "Slower, focus on calorie timing";
    const lifestyle = answers.workSchedule || "Flexible lifestyle";
    const coachSuggestion = deriveCoachSuggestion(answers.mainGoal);
    const projection = [
      { label: "Now", weight: currentWeight || 65 },
      {
        label: "Target Week 3",
        weight: Number(
          currentWeight + (goalWeight - currentWeight) * 0.5 || 65,
        ),
      },
      { label: "Goal", weight: goalWeight || currentWeight || 65 },
    ];

    const onboardingData = {
      answers,
      bmi,
      bodyType,
      metabolism,
      lifestyle,
      coachSuggestion,
      projection,
      completedAt: new Date(),
    };

    await BodyMeasurement.create({
      userId: userId,
      height,
      weight: currentWeight,
      chest: answers.chest || 0,
      waist: answers.waist || 0,
      hips: answers.hips || 0,
      thighs: answers.thighs || 0,
      arms: answers.arms || 0,
      forearms: answers.forearms || 0,
      biceps: answers.biceps || 0,
      bodyFat: answers.bodyFat || 0,
      source: "onboarding",
    });

    await OnboardingSubmission.create({
      user: userId,
      answers,
      promoRevealed,
      feedback,
      photoName,
    });

    const user = await User.findByIdAndUpdate(
      userId,
      {
        onboardingComplete: true,
        onboardingData,
        coachSuggestion,
      },
      { new: true },
    )
      .select("-password")
      .populate([
        {
          path: "assignedCoach",
          select: "_id name email profilePicture specialization role",
        },
        {
          path: "coachId",
          select: "_id name email profilePicture specialization role",
        },
      ]);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("completeOnboarding error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to complete onboarding",
    });
  }
};
