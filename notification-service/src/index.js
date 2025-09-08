require("dotenv").config();
const express = require("express");
const app = express();
const notificationRoutes = require("./routes/notificationRoutes");

app.use(express.json());

// Routes
app.use("/notifications", notificationRoutes);

const PORT = process.env.PORT || 3003;

app.listen(PORT, () => {
  console.log(`Notification service running on port ${PORT}`);
});
