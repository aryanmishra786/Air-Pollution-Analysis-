const db = require("../db");
const fs = require("fs");
const mysql = require("mysql2/promise");
const http = require("http");

const ML_SERVICE_URL = "http://localhost:5000";

// GET all data
exports.getTopCleanCity = (req, res) => {
  db.query("SELECT * FROM tbl_top_clean_cities_2025", (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
};

exports.getTopPoppulatedCity = (req, res) => {
  db.query("SELECT * FROM tbl_top_polluted_cities_2025", (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
};

// Import data from JSON
exports.importTopCleanData = (req, res) => {
  const data = fs.readFileSync("data/top_clear_city_2025.json");
  const users = JSON.parse(data);

  //console.log(users);
  users.forEach((user) => {
    const { city_state, country, region, aqi, condition } = user;
    db.query(
      "INSERT INTO tbl_top_clean_cities_2025 (city_state, country, region,aqi,msg) VALUES (?, ?, ?,?,?)",
      [city_state, country, region, aqi, condition],
      (err) => {
        if (err) console.error(err);
      },
    );
  });

  res.send("✅ Data imported successfully!");
};

// Import data from JSON
exports.importAQIData = (req, res) => {
  const data = fs.readFileSync("data/data_aqi_2015_2025.json");
  const users = JSON.parse(data);

  //console.log(users);
  users.forEach((user) => {
    const {
      Date,
      City,
      Country,
      AQI,
      PM2_5,
      PM10,
      NO2,
      SO2,
      CO,
      O3,
      Temperature,
      Humidity,
      WindSpeed,
    } = user;
    db.query(
      "INSERT INTO `tbl_aqi_data`(`a_date`, `city`, `country`, `aqi`, `pm2`, `pm10`, `no2`, `so2`, `co`, `o3`, `temprature`, `humidity`, `wind_speed`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
      [
        excelSerialToDate(Date),
        City,
        Country,
        AQI,
        PM2_5,
        PM10,
        NO2,
        SO2,
        CO,
        O3,
        Temperature,
        Humidity,
        WindSpeed,
      ],
      (err) => {
        if (err) console.error(err);
      },
    );
  });

  res.send("✅ Data imported successfully!");
};

// Import data from JSON
exports.charts = async (req, res) => {
  try {
    const { start, end } = req.query;

    // --- Build WHERE clause dynamically
    let whereClause = "";
    const params = [];

    if (start && end) {
      whereClause = "WHERE a_date BETWEEN ? AND ?";
      params.push(start, end);
    } else if (start) {
      whereClause = "WHERE a_date >= ?";
      params.push(start);
    } else if (end) {
      whereClause = "WHERE a_date <= ?";
      params.push(end);
    }

    // --- Fetch distinct cities
    const [citiesResult] = await db.query(
      `SELECT DISTINCT city FROM tbl_aqi_data`,
    );

    // --- Fetch AQI data
    const [aqiResult] = await db.query(
      `
      SELECT city, pm2, pm10, no2, so2, co, o3, temprature, humidity, wind_speed, a_date, aqi
      FROM tbl_aqi_data
      ${whereClause}
      ORDER BY a_date ASC
      `,
      params,
    );

    // Monthly average AQI per city
    const [monthlyResult] = await db.query(
      `
      SELECT city, DATE_FORMAT(a_date, '%Y-%m') AS month, AVG(aqi) AS avg_aqi
      FROM tbl_aqi_data
      ${whereClause}
      GROUP BY city, month
      ORDER BY month ASC
      `,
      params,
    );

    // --- Group and calculate stats per city
    const grouped = citiesResult.map((c) => {
      const cityData = aqiResult.filter((d) => d.city === c.city);

      if (cityData.length === 0) {
        // Skip cities with no data
        return {
          city: c.city,
          pollutant: "PM2.5",
          aqi: [],
          startAQI: null,
          endAQI: null,
          change: 0,
        };
      }

      const startAQI = cityData[0].aqi;
      const endAQI = cityData[cityData.length - 1].aqi;
      const change = parseFloat((endAQI - startAQI).toFixed(2));

      return {
        city: c.city,
        pollutant: "PM2.5",
        aqi: cityData.map((r) => ({
          date: new Date(r.a_date).toISOString().split("T")[0],
          value: r.aqi,
          pm2: r.pm2,
          pm10: r.pm10,
          no2: r.no2,
          so2: r.so2,
          co: r.co,
          o3: r.o3,
          temprature: r.temprature,
          humidity: r.humidity,
          wind_speed: r.wind_speed,
        })),
        startAQI,
        endAQI,
        change,
      };
    });

    res.json({
      cities: citiesResult.map((c) => c.city),
      data: grouped,
      filters: { start, end },
    });
  } catch (err) {
    console.error("Error fetching AQI data:", err);
    res.status(500).json({ error: "Failed to fetch AQI data" });
  }
};

exports.allData = async (req, res) => {
  try {
    const { start, end } = req.query;

    // --- Build WHERE clause dynamically
    let whereClause = "";
    const params = [];

    if (start && end) {
      whereClause = "WHERE a_date BETWEEN ? AND ?";
      params.push(start, end);
    } else if (start) {
      whereClause = "WHERE a_date >= ?";
      params.push(start);
    } else if (end) {
      whereClause = "WHERE a_date <= ?";
      params.push(end);
    }

    // --- Fetch distinct cities
    const [citiesResult] = await db.query(
      `SELECT DISTINCT city FROM tbl_aqi_data`,
    );

    // --- Fetch AQI data
    const [aqiResult] = await db.query(
      `
      SELECT country as Country,city as City, pm2 as PM2_5, pm10 as PM10, no2 as NO2, so2 as SO2, co as CO, o3 as O3, temprature as Temperature, humidity as Humidity, wind_speed as WindSpeed, a_date as Date, aqi as AQI
      FROM tbl_aqi_data
      ${whereClause}
      ORDER BY a_date ASC
      `,
      params,
    );

    res.json({
      cities: citiesResult.map((c) => c.city),
      data: aqiResult,
      filters: { start, end },
    });
  } catch (err) {
    console.error("Error fetching AQI data:", err);
    res.status(500).json({ error: "Failed to fetch AQI data" });
  }
};

exports.allHistoryData = async (req, res) => {
  const city = req.query.city;
  const from = Number(req.query.from);
  const to = Number(req.query.to);

  const sql = `
    SELECT 
      city,
      YEAR(a_date) AS year,
      AVG(AQI) AS avgAqi
    FROM tbl_aqi_data
    WHERE city = ?
      AND YEAR(a_date) BETWEEN ? AND ?
    GROUP BY city, YEAR(a_date)
    ORDER BY YEAR(a_date)
  `;

  const [citiesResult] = await db.query(
    `SELECT DISTINCT city FROM tbl_aqi_data`,
  );

  const [rows] = await db.query(sql, [city, from, to]);

  // Create map for easy lookup
  const aqiMap = {};
  let resultCity = city;

  rows.forEach((row) => {
    resultCity = row.city;
    aqiMap[row.year] = Number(row.avgAqi);
  });

  const labels = [];
  const avgAqi = [];

  // Fill missing years with 0
  for (let year = from; year <= to; year++) {
    labels.push(year.toString());

    avgAqi.push(aqiMap[year] || 0);
  }

  const json = {
    cities: citiesResult.map((c) => c.city),
    city: resultCity,
    labels,
    avgAqi,
  };

  res.json(json);
};

function excelSerialToDate(serial) {
  // Excel starts counting from 1900-01-01 (with 1 = 1900-01-01)
  const excelStartDate = new Date(1900, 0, 1);
  // Adjust by (serial - 2) because Excel incorrectly counts 1900 as a leap year
  const jsDate = new Date(
    excelStartDate.getTime() + (serial - 2) * 24 * 60 * 60 * 1000,
  );

  // Format to YYYY-MM-DD for MySQL
  const year = jsDate.getFullYear();
  const month = String(jsDate.getMonth() + 1).padStart(2, "0");
  const day = String(jsDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

exports.predictAQI = async (req, res) => {
  const city = req.query.city;
  const days = req.query.days || 7;

  if (!city) {
    return res.status(400).json({ error: "City parameter required" });
  }

  const url = `${ML_SERVICE_URL}/api/predict?city=${encodeURIComponent(city)}&days=${days}`;

  http
    .get(url, (mlRes) => {
      let data = "";
      mlRes.on("data", (chunk) => (data += chunk));
      mlRes.on("end", () => {
        try {
          res.json(JSON.parse(data));
        } catch (e) {
          res.status(500).json({ error: "Failed to parse ML response" });
        }
      });
    })
    .on("error", (err) => {
      res.status(503).json({
        error: "ML service unavailable",
        message: "Please ensure the ML service is running on port 5000",
      });
    });
};

exports.getMLCities = async (req, res) => {
  const url = `${ML_SERVICE_URL}/api/cities`;

  http
    .get(url, (mlRes) => {
      let data = "";
      mlRes.on("data", (chunk) => (data += chunk));
      mlRes.on("end", () => {
        try {
          res.json(JSON.parse(data));
        } catch (e) {
          res.status(500).json({ error: "Failed to parse ML response" });
        }
      });
    })
    .on("error", (err) => {
      res.status(503).json({
        error: "ML service unavailable",
        cities: [],
      });
    });
};
