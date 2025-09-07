require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");

require("dotenv").config();

require("./config/passport");

const app = express();
app.use(bodyParser.json());

// Routes
app.use("/auth", authRoutes);
app.use("/user", userRoutes); // protect /set-password via gateway header

app.listen(process.env.PORT || 5000, () => {
  console.log(`Auth service running at Port : ${process.env.PORT || 5000}`);
});
