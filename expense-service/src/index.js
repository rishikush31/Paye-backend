require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");

const expenseRoutes = require("./routes/expenseRoutes");
const shareRoutes = require("./routes/shareRoutes");

require("dotenv").config();

const app = express();
app.use(bodyParser.json());

// Routes
app.use("/expenses", expenseRoutes);
app.use("/shares", shareRoutes);

app.listen(process.env.PORT || 5000, () => {
  console.log(`Expense service running at Port : ${process.env.PORT || 5000}`);
});
