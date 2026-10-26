require("dotenv").config();
const connectDB = require("./src/db");
const app = require("./src/app");

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

connectDB().catch((error) => {
  console.error("MongoDB connection failed:", error.message);
});
