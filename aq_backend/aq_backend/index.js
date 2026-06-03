const express = require("express");
const bodyParser = require("body-parser");
const cors = require('cors');
const aqiRoutes = require("./router/aqi_route");

const app = express();
app.use(cors({
  origin: '*', // or specify: 'http://localhost:3000'
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(bodyParser.json());
app.use(cors());
// Use routes
app.use("/api/top_clear_aqi", aqiRoutes);
app.use("/api/chart", aqiRoutes);

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
