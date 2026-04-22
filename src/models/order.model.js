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
    commissionAmount: Number,
    gstAmount: Number,
    totalAmount: Number,
    // Legacy compatibility fields
    commission: Number,
    gst: Number,
    total: Number,
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "shipped",
        "out_for_delivery",
        "delivered",
      ],
      default: "pending",
    },
    statusHistory: [
      {
        status: String,
        date: { type: Date, default: Date.now },
      },
    ],
    estimatedDelivery: Date,
    stripeSessionId: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
  },
);

exports.Order = mongoose.model("Order", orderSchema);
