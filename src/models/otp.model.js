const mongoose = require("mongoose");
const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "email is required"],
    },
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: [true, "user is required"],
    },
    otpHash: {
      type: String,
      required: [true, "otpHash is required"],
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 300,
    },
},  { timestamps: true }
);

const otpModel = mongoose.model("otps", otpSchema);

module.exports = otpModel;