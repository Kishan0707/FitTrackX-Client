const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },

    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    affiliateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Affiliate",
      default: null,
    },
    price: Number,
    commission: Number,
    gst: Number,
    total: Number,
    status: {
      type: String,
      enum: ["padding", "shipped", "delivered", "cancelled"],
      default: "padding",
    },
  },
  {
    timestamps: true,
  },
);

exports.Order = mongoose.model("Order", orderSchema);
