const { Order } = require("../models/order.model");
const User = require("../models/user.model");
const Product = require("../models/product.model");
const Affiliate = require("../models/affiliate.model");
const Store = require("../models/store.model");

exports.createOrder = async (req, res) => {
  try {
    const { productId, referralCode } = req.body;
    const userId = req.user._id;

    // 🔥 product
    const product = await Product.findById(productId);
    if (!product || product.status !== "verified") {
      return res.status(400).json({
        success: false,
        message: "Product not available",
      });
    }

    // 🔥 seller
    const sellerId = product.sellerId || product.coach;

    // 🔥 affiliate optional
    let affiliate = null;
    if (referralCode) {
      affiliate = await Affiliate.findOne({ referralCode });
    }

    // 🔥 calculations
    const price = product.finalPrice;
    const gstAmount = (product.gstRate / 100) * price;

    let commissionAmount = 0;

    if (affiliate && product.affiliateEnabled) {
      commissionAmount = (product.commissionPercent / 100) * price;
    }

    const totalAmount = price + gstAmount;

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

    // ✅ ALWAYS RETURN RESPONSE
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
    res.status(500).json({ success: false, error: err.message });
  }
};
exports.getSellerOrders = async (req, res) => {
  try {
    const Orders = await Order.find({ sellerId: req.user._id })
      .populate("productId userId")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      orders,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const orders = await Order.findByIdAndUpdate(
      req.params.id,
      {
        status,
      },
      { new: true },
    );
    if (!orders.length) {
      return res.status(400).json({
        success: false,
        message: "order not updated",
      });
    }
    res.json({
      success: true,
      orders,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
