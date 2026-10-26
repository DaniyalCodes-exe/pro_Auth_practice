const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();

const authrouter = require("./routes/auth.route");

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.status(200).json({ message: "Server is running" });
});

app.use("/api/auth", authrouter);
module.exports = app;
