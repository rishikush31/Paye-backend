const express = require('express');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const gatewayRoutes = require('./routes/gatewayRoutes');

dotenv.config();
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -------------------- Load Public Key --------------------
const publicKeyPath = path.join(__dirname, 'keys', 'public.pem');
const PUBLIC_KEY = fs.readFileSync(publicKeyPath, 'utf8');

// Make public key available for middleware
app.use((req, res, next) => {
    req.publicKey = PUBLIC_KEY;
    next();
});

// -------------------- Gateway Routes --------------------
app.use('/', gatewayRoutes);

// -------------------- Start Server --------------------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
});
