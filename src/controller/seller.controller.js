const Product = require("../models/product.model");
const { Order } = require("../models/order.model");

// 📦 SELLER PRODUCTS
exports.getMyProducts = async (req, res) => {
  const products = await Product.find({
    sellerId: req.user._id,
  });

  res.json({ success: true, products });
};

// 📊 SELLER ORDERS
exports.getSellerOrders = async (req, res) => {
  const orders = await Order.find({
    sellerId: req.user._id,
  })
    .populate("productId userId")
    .sort({ createdAt: -1 });

  res.json({ success: true, orders });
};

// 📈 SELLER STATS
exports.getSellerStats = async (req, res) => {
  const orders = await Order.find({ sellerId: req.user._id });

  const totalSales = orders.length;
  const totalRevenue = orders.reduce(
    (acc, order) => acc + Number(order.totalAmount || order.total || 0),
    0,
  );

  res.json({
    success: true,
    totalSales,
    totalRevenue,
  });
};
