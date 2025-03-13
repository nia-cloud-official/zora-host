require('dotenv').config();
const express = require('express');
const authRoutes = require('./routes/authRoutes');
const deployRoutes = require('./routes/deployRoutes');

const app = express();
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/deploy', deployRoutes);

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});