const Cart = require("../models/cart.model");

exports.addToCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user._id;
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = await Cart.create({
        userId,
        items: [{ productId }],
      });
    } else {
      const item = cart.items.find((i) => i.productId.toString() === productId);
      if (item) {
        item.quantity += 1;
      } else {
        cart.items.push({ productId });
      }
      await cart.save();
    }
    res.status(201).json({
      success: true,
      cart,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id }).populate(
      "items.productId",
    );

    res.json({ cart });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
exports.removeFromCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });

    cart.items = cart.items.filter(
      (i) => i.productId.toString() !== req.params.productId,
    );

    await cart.save();

    res.json({ success: true, cart });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};
