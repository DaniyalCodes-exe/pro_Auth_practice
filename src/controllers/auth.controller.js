const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const sessionModel = require("../models/session.model");
const crypto = require("crypto");
const { sendEmail } = require("../services/email.service");
const { generateOtp, getOtpHtml } = require("../utils/utils");
const otpModel = require("../models/otp.model");

async function userRegisterController(req, res) {
  try {
    const { name, email, password } = req.body;

    const emailExist = await userModel.findOne({
      email: email,
    });

    if (emailExist) {
      return res.status(422).json({
        message: "user already exist",
        status: "failed",
      });
    }

    const user = await userModel.create({
      name,
      email,
      password,
    });

    const otp = generateOtp();
    const html = getOtpHtml(otp);

    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    await otpModel.create({
      email: email,
      user: user._id,
      otpHash: otpHash,
    });

    await sendEmail(email, "Your OTP Code", `Your OTP code is: ${otp}`, html);
    res.status(200).json({
      message: "user created successfully",
      status: "success",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        verified: user.verified,
      },
    });
  } catch (error) {
    console.error("error:", error.message);
    res.status(400).json({
      message: error.message,
      status: "failed",
    });
  }
}

async function userLoginController(req, res) {
  try {
    const { email, password } = req.body;

    const isExist = await userModel
      .findOne({ email: email })
      .select("+password");

    if (!isExist) {
      return res.status(401).json({
        message: "email or password is invalid",
        status: "failed",
      });
    }

    if (!isExist.verified) {
      return res.status(401).json({
        message: "user is not verified",
        status: "failed",
      });
    }
    const isValidPassword = await isExist.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        message: "email or password is invalid",
        status: "failed",
      });
    }

    const refreshToken = jwt.sign(
      { userId: isExist._id },
      process.env.JWT_REFRESH_SECRET,
      {
        expiresIn: "7d",
      },
    );
    const refreshTokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    const session = await sessionModel.create({
      user: isExist._id,
      refreshTokenHash: refreshTokenHash,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false, // Set to true in production only if using HTTPS
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    const accessToken = jwt.sign(
      { userId: isExist._id, sessionId: session._id },
      process.env.JWT_SECRET,
      {
        expiresIn: "15m",
      },
    );

    res.status(200).json({
      message: "user logged in successfully",
      status: "success",
      user: {
        id: isExist._id,
        name: isExist.name,
        email: isExist.email,
        verified: isExist.verified,
      },
      accessToken: accessToken,
    });
  } catch (error) {
    console.error("error:", error.message);
    res.status(400).json({
      message: error.message,
      status: "failed",
    });
  }
}

async function profileFetch(req, res) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        message: "unauthorized",
      });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const session = await sessionModel.findOne({
      _id: decoded.sessionId,
      revoked: false,
    });

    if (!session) {
      return res.status(401).json({
        message: "session is logged out",
        status: "failed",
      });
    }
    const user = await userModel.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({
        message: "user not found",
      });
    }
    res.status(200).json({
      userId: user._id,
      email: user.email,
      name: user.name,
    });
  } catch (err) {
    console.error("error:", err.message);
    return res.status(422).json({
      message: "server error",
      status: "failed",
    });
  }
}

async function refreshTokenController(req, res) {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({
        message: "unauthorized",
        status: "failed",
      });
    }
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const refreshTokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");
    const session = await sessionModel.findOne({
      refreshTokenHash,
      revoked: false,
    });
    if (!session) {
      return res.status(404).json({
        message: "session not found",
        status: "failed",
      });
    }

    const user = await userModel.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({
        message: "user not found",
        status: "failed",
      });
    }

    const newRefreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_SECRET,
      {
        expiresIn: "7d",
      },
    );
    const newRefreshTokenHash = crypto
      .createHash("sha256")
      .update(newRefreshToken)
      .digest("hex");

    session.refreshTokenHash = newRefreshTokenHash;
    await session.save();
    const accessToken = jwt.sign(
      { userId: user._id, sessionId: session._id },
      process.env.JWT_SECRET,
      {
        expiresIn: "15m",
      },
    );

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: false, // Set to true in production only if using HTTPS
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "access token refreshed successfully",
      status: "success",
      user: {
        id: user._id,
      },
      accessToken: accessToken,
    });
  } catch (error) {
    console.error("error:", error.message);
    return res.status(422).json({
      message: "server error",
      status: "failed",
    });
  }
}

async function logoutController(req, res) {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({
        message: "unauthorized",
        status: "failed",
      });
    }
    const refreshTokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");
    const session = await sessionModel.findOne({
      refreshTokenHash,
      revoked: false,
    });
    if (!session) {
      return res.status(404).json({
        message: "session not found",
        status: "failed",
      });
    }
    session.revoked = true;
    await session.save();
    res.clearCookie("refreshToken");
    res.status(200).json({
      message: "logged out successfully",
      status: "success",
    });
  } catch (error) {
    console.error("error:", error.message);
    return res.status(422).json({
      message: "server error",
      status: "failed",
    });
  }
}

async function logoutAllController(req, res) {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({
        message: "unauthorized",
        status: "failed",
      });
    }
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const userId = decoded.userId;
    await sessionModel.updateMany(
      { user: userId, revoked: false },
      { $set: { revoked: true } },
    );
    res.clearCookie("refreshToken");
    res.status(200).json({
      message: "logged out from all sessions successfully",
      status: "success",
    });
  } catch (error) {
    console.error("error:", error.message);
    return res.status(422).json({
      message: "server error",
      status: "failed",
    });
  }
}

async function verifyEmailController(req, res) {
  try {
    const { email, otp } = req.body;
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    const otpDoc = await otpModel.findOne({ email, otpHash });
    if (!otpDoc) {
      return res.status(400).json({
        message: "invalid OTP",
        status: "failed",
      });
    }
    const user = await userModel.findByIdAndUpdate(otpDoc.user, {
      verified: true,
    }, { new: true });
    await otpModel.deleteMany({ user: otpDoc.user });
    return res.status(200).json({
      message: "email verified successfully",
      user: user,
    });
  } catch (error) {
    console.error("error:", error.message);
    return res.status(422).json({
      message: "server error",
      status: "failed",
    });
  }
}


async function forgotPasswordController(req, res) {
  try {
    const { email } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "user not found", status: "failed" });
    }

    // generate OTP & store hash
    const otp = generateOtp();
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    await otpModel.create({ email, user: user._id, otpHash });

    // send email with plain OTP
    await sendEmail(email, "Password Reset OTP", `Your OTP is: ${otp}`, getOtpHtml(otp));

    return res.status(200).json({ message: "OTP sent to email", status: "success" });
  } catch (error) {
    console.error("error:", error.message);
    return res.status(500).json({ message: error.message, status: "failed" });
  }
}

async function resetPasswordController(req, res) {
  try {
    const { email, otp, newPassword } = req.body;
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    const otpDoc = await otpModel.findOne({ email, otpHash });
    if (!otpDoc) {
      return res.status(400).json({ message: "invalid OTP", status: "failed" });
    }
    const user = await userModel.findById(otpDoc.user);
    if (!user) {
      return res.status(404).json({ message: "user not found", status: "failed" });
    }
    // update password – pre‑save hook will hash it
    user.password = newPassword;
    await user.save();
    // clean up OTPs for this user
    await otpModel.deleteMany({ user: otpDoc.user });
    return res.status(200).json({ message: "Password reset successful", status: "success" });
  } catch (error) {
    console.error("error:", error.message);
    return res.status(500).json({ message: error.message, status: "failed" });
  }
}

module.exports = {
  userRegisterController,
  userLoginController,
  profileFetch,
  refreshTokenController,
  logoutController,
  logoutAllController,
  verifyEmailController,
  forgotPasswordController,
  resetPasswordController,
};
