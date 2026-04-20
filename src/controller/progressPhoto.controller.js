const cloudinary = require("../config/cloudinary");
const ProgressPhoto = require("../models/progressPhoto.model");
const fs = require("fs");

exports.uploadPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "File not uploaded",
      });
    }
    

    // upload to cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "fittrack-progress",
    });

    // save to DB
    const photo = await ProgressPhoto.create({
      userId: req.user._id,
      photo: result.secure_url,
      cloudinary_id: result.public_id,
    });

    // delete local file after upload
    fs.unlinkSync(req.file.path);

    res.status(201).json({
      success: true,
      data: photo,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
