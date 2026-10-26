const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      unique: [true, "email should be unique"],
      required: [true, "email is required"],
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email"],
    },
    name: {
      type: String,
      required: [true, "name is required"],
      trim: true,
      minlength: [3, "name must be at least 3 character"],
      maxlength: [30, "name  should be maximum 30"],
    },

    password: {
      type: String,
      required: [true, "password is required"],
      minlength: [6, "password must be more thn 6 chracters"],
      maxlength: [14, "password not more than 14 characters"],
      match: [
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/,
        "Password must contain uppercase, lowercase, number and special character",
      ],
      select: false,
    },
    
    verified :{
      type:Boolean,
      default:false
    }

  },
  { timestamps: true },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }
  const hash = await bcrypt.hash(this.password, 10);
  this.password = hash;
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const userModel = mongoose.model("users", userSchema);

module.exports = userModel;
