const PDFDocument = require("pdfkit");
const { Workout } = require("../models/workout.model");
const Diet = require("../models/diet.model");

exports.exportuserReport = async (req, res) => {
  try {
    const userId = req.user._id;

    const workouts = await Workout.find({ userId }).lean();
    const diet = await Diet.find({ userId });

    const doc = new PDFDocument();

    const filename = `user-report-${userId}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    doc.pipe(res);

    doc.fontSize(18).text("FitTrackX Report", {
      align: "center",
      underline: true,
    });

    doc.moveDown();

    doc.fontSize(14).text("Workouts:");

    workouts.forEach((workout, index) => {
      doc.fontSize(12).text(
        `${index + 1}. ${workout.exercises.name}
Calories Burned: ${workout.caloriesBurned}
Duration: ${workout.duration} minutes
Date: ${new Date(workout.date).toLocaleDateString()}`,
      );
      doc.moveDown();
    });

    doc.moveDown();
    doc.fontSize(14).text("Diet Summary:");

    diet.forEach((d, index) => {
      doc.fontSize(12).text(
        `${index + 1}. ${d.dayOfWeek}
Carbs: ${d.totalCarbs}g
Fat: ${d.totalFat}g
Protein: ${d.totalProtein}g
Calories: ${d.totalCalories}`,
      );
      doc.moveDown();
    });

    doc.end();
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
