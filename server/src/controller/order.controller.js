const { Order } = require("../models/order.model");
const User = require("../models/user.model");
const Product = require("../models/product.model");
const Affiliate = require("../models/affiliate.model");
const Store = require("../models/store.model");

exports.createOrder = async (req, res) => {
  try {
    const { productId, referralCode } = req.body;
    const userId = req.user._id;

    // 🔥 get product
    const product = await Product.findById(productId);

    if (!product || product.status !== "verified") {
      return res.status(400).json({
        success: false,
        message: "Product not available",
      });
    }

    const sellerId = product.sellerId || product.coach;

    // 🔥 affiliate
    let affiliate = null;
    if (referralCode) {
      affiliate = await Affiliate.findOne({ referralCode });
    }

    // 🔥 pricing
    const price = product.finalPrice;
    const gstAmount = (product.gstRate / 100) * price;

    let commissionAmount = 0;
    if (affiliate && product.affiliateEnabled) {
      commissionAmount = (product.commissionPercent / 100) * price;
    }

    const totalAmount = price + gstAmount;

    // ✅ FIX: delivery date
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 5);

    // 🔥 create order
    const order = await Order.create({
      userId,
      productId,
      sellerId,
      affiliateId: affiliate ? affiliate.userId : null,
      price,
      gstAmount,
      commissionAmount,
      totalAmount,
      estimatedDelivery: deliveryDate, // ✅ correct
      statusHistory: [{ status: "pending" }],
    });

    // 🔥 affiliate update
    if (affiliate && commissionAmount > 0) {
      await Affiliate.updateOne(
        { userId: affiliate.userId },
        {
          $inc: {
            earnings: commissionAmount,
            totalSales: 1,
            conversions: 1,
          },
        },
      );

      await User.updateOne(
        { _id: affiliate.userId },
        {
          $inc: { walletBalance: commissionAmount },
        },
      );
    }

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
exports.getMyOrder = async (req, res) => {
  try {
    const orders = await Order.find({
      userId: req.user._id,
    })
      .populate("productId")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      orders,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
exports.getSellerOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      sellerId: req.user._id,
    })
      .populate("productId userId")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      orders,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    // 🔐 SECURITY CHECK
    if (order.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    order.status = status;

    order.statusHistory.push({
      status,
      date: new Date(),
    });

    await order.save();

    res.json({
      success: true,
      order,
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};
exports.getSingleOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("productId");

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    // 🔐 Only owner or seller can see
    if (
      order.userId.toString() !== req.user._id.toString() &&
      order.sellerId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    res.json({ order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
