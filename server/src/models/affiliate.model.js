const mongoose = require("mongoose");

const affiliateSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  referralCode: {
    type: String,
    required: true,
    unique: true,
  },
  referredUsers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  clicks: { type: Number, default: 0 },
  conversions: { type: Number, default: 0 },
  earnings: {
    type: Number,
    default: 0,
  },
  totalSales: {
    type: Number,
    default: 0,
  },
});

exports.Affiliate = mongoose.model("Affiliate", affiliateSchema);
