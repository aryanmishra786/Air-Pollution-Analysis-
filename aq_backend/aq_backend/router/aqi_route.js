const express = require("express");
const router = express.Router();
const aqiController = require("../controller/aqi_controller");

router.get("/lesspopulate", aqiController.getTopCleanCity);
router.get("/toppopulate", aqiController.getTopPoppulatedCity);
router.get("/import", aqiController.importTopCleanData);
router.get("/importAQI", aqiController.importAQIData);
router.get("/compare", aqiController.charts);
router.get("/get_all_city", aqiController.allData);
router.get("/history_year", aqiController.allHistoryData);
router.get("/predict", aqiController.predictAQI);
router.get("/ml_cities", aqiController.getMLCities);

module.exports = router;
