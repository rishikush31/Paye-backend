require("dotenv").config();
const express = require("express");
const app = express();
const notificationRoutes = require("./routes/notificationRoutes");

app.use(express.json());

// Routes
app.use("/notifications", notificationRoutes);

const PORT = process.env.PORT || 3000;

console.log(process.env.PORT);

app.listen(PORT, () => {
  console.log(`Expense service running on port ${PORT}`);
});
