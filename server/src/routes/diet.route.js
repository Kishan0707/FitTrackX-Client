const express = require("express");
const router = express.Router();

const dietController = require("../controller/diet.controller");
const { protect } = require("../middleware/auth.middleware");

router.post("/", protect, dietController.addDiet);
router.get("/", protect, dietController.getAllDiet);
router.get("/today", protect, dietController.getTodayDiet);
router.delete("/:id", protect, dietController.deleteDiet);
router.put("/:id", protect, dietController.updateDiet);
router.get(
  "/grocery-suggestion",
  protect,
  dietController.getGrocerySuggestions,
);
router.get("/macro-distribution", protect, dietController.getMacroDistribution);

module.exports = router;
