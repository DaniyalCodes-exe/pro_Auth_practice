const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "user is required"],
      ref: "users",
    },
    refreshTokenHash: {
      type: String,
      required: [true, "refreshToken is required"],
    },
    ip: {
      type: String,
      required: [true, "ip is required"],
    },
    revoked: {
      type: Boolean,
      default: false,
    },
    userAgent: {
      type: String,
      required: [true, "userAgent is required"],
    },
  },
  { timestamps: true },
);

const sessionModel = mongoose.model("sessions", sessionSchema);

module.exports = sessionModel;
