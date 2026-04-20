const mongoose = require("mongoose");
// const { default: products } = require("razorpay/dist/types/products");

const StoreSchema = new mongoose.Schema({
  ownerId: mongoose.Schema.Types.ObjectId,
  storeName: String,
  location: String,
  isVerified: Boolean,
  products: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
  ],
});

exports.Store = mongoose.model("Store", StoreSchema);
