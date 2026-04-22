const Product = require("../models/product.model");
const { ROLES } = require("../constants/roles");

const calculateFinalAmounts = ({ originalPrice, discountPrice, gstRate }) => {
  const sellPrice =
    discountPrice && discountPrice < originalPrice ?
      discountPrice
    : originalPrice;
  const gstAmount = Number(((sellPrice * (gstRate || 18)) / 100).toFixed(2));
  return {
    finalPrice: Number((sellPrice + gstAmount).toFixed(2)),
    gstAmount,
  };
};

exports.createProduct = async (req, res) => {
  try {
    if (
      !req.user ||
      ![ROLES.COACH, ROLES.SELLER, ROLES.ADMIN].includes(req.user.role)
    ) {
      return res.status(403).json({
        success: false,
        message: "Only coach, seller, or admin can add products",
      });
    }

    const {
      name,
      description,
      originalPrice,
      discountPrice,
      gstRate = 18,
      imageUrl,
      inventory = 0,
      instructions,
    } = req.body;

    if (!name || !originalPrice) {
      return res
        .status(400)
        .json({ success: false, message: "Name and price are required" });
    }

    const { finalPrice, gstAmount } = calculateFinalAmounts({
      originalPrice,
      discountPrice,
      gstRate,
    });

    const product = await Product.create({
      coach: req.user._id,
      sellerId: req.user.role === ROLES.SELLER ? req.user._id : null,
      createdBy:
        req.user.role === ROLES.ADMIN ? ROLES.ADMIN
        : req.user.role === ROLES.SELLER ? ROLES.SELLER
        : ROLES.COACH,
      name,
      description,
      originalPrice,
      discountPrice: discountPrice || null,
      gstRate,
      gstAmount,
      finalPrice,
      imageUrl,
      inventory,
      instructions,
    });

    return res.status(201).json({ success: true, data: product });
  } catch (error) {
    console.error("product.createProduct error", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to create product" });
  }
};

const buildFilter = (req) => {
  if (req.user?.role === ROLES.ADMIN) {
    return {};
  }
  if (req.user?.role === ROLES.COACH && req.query.mine === "true") {
    return { coach: req.user._id };
  }
  if (req.user?.role === ROLES.SELLER && req.query.mine === "true") {
    return { sellerId: req.user._id };
  }
  return { status: "verified" };
};

exports.getProducts = async (req, res) => {
  try {
    const filter = buildFilter(req);
    const products = await Product.find(filter)
      .populate({
        path: "coach",
        select: "_id name profilePicture",
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: products });
  } catch (error) {
    console.error("product.getProducts error", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to load products" });
  }
};

exports.getPendingProducts = async (req, res) => {
  try {
    if (!req.user || req.user.role !== ROLES.ADMIN) {
      return res.status(403).json({ success: false, message: "Admin only" });
    }
    const products = await Product.find({ status: "pending" })
      .populate({ path: "coach", select: "_id name email" })
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: products });
  } catch (error) {
    console.error("product.getPendingProducts error", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to load pending products" });
  }
};

exports.verifyProduct = async (req, res) => {
  try {
    if (!req.user || req.user.role !== ROLES.ADMIN) {
      return res.status(403).json({ success: false, message: "Admin only" });
    }
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    product.status = "verified";
    product.verifiedBadge = true;
    product.verifiedAt = new Date();
    product.rejectionReason = null;
    product.rejectionAt = null;
    await product.save();
    return res.status(200).json({ success: true, data: product });
  } catch (error) {
    console.error("product.verifyProduct error", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to verify product" });
  }
};

exports.rejectProduct = async (req, res) => {
  try {
    if (!req.user || req.user.role !== ROLES.ADMIN) {
      return res.status(403).json({ success: false, message: "Admin only" });
    }
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    product.status = "rejected";
    product.verifiedBadge = false;
    product.verifiedAt = null;
    product.rejectionReason = req.body?.reason ?? "Not approved in the store";
    product.rejectionAt = new Date();
    await product.save();
    return res.status(200).json({ success: true, data: product });
  } catch (error) {
    console.error("product.rejectProduct error", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to reject product" });
  }
};
exports.getSingleProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || id === "undefined") {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.json({ product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
