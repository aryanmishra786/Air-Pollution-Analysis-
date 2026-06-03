// import { useEffect, useState } from "react";
// import { Line } from "react-chartjs-2";
// import {
//     Chart as ChartJS,
//     LineElement,
//     PointElement,
//     CategoryScale,
//     LinearScale,
//     Legend,
//     Tooltip,
// } from "chart.js";
//
// ChartJS.register(
//     LineElement,
//     PointElement,
//     CategoryScale,
//     LinearScale,
//     Legend,
//     Tooltip
// );
//
// interface AqiTrendResponse {
//     cities: string[];
//     city: string;
//     labels: string[];
//     avgAqi: number[];
// }
//
// export default function CityAqiTrendChart() {
//     const [cities, setCities] = useState<string[]>([]);
//     const [city, setCity] = useState("London");
//
//     const [fromYear, setFromYear] = useState(2015);
//     const [toYear, setToYear] = useState(2025);
//
//     const [trendText, setTrendText] = useState<{
//         message: string;
//         color: string;
//         arrow: string;
//         emoji: string;
//         health: string;
//     } | null>(null);
//
//     const [labels, setLabels] = useState<string[]>([]);
//     const [avgAqi, setAvgAqi] = useState<number[]>([]);
//
//     // Fetch data whenever filters change
//     useEffect(() => {
//         async function fetchData() {
//             const res = await fetch(
//                 `http://localhost:3000/api/top_clear_aqi/history_year?city=${city}&from=${fromYear}&to=${toYear}`
//             );
//             const json: AqiTrendResponse = await res.json();
//
//             if (json.cities) setCities(json.cities);
//             if (json.city) setCity(json.city);
//
//             setLabels(json.labels);
//             setAvgAqi(json.avgAqi);
//
//             // ---- ENHANCED AQI TREND LOGIC ----
//             if (json.avgAqi.length >= 2) {
//                 const first = json.avgAqi[0];
//                 const last = json.avgAqi[json.avgAqi.length - 1];
//                 const diff = last - first;
//                 const percentChange = ((diff / first) * 100).toFixed(2);
//
//                 let emoji = "";
//                 let health = "";
//                 let color = "";
//                 let arrow = "";
//                 let message = "";
//
//                 if (diff > 1) {
//                     emoji = "🔥";
//                     health = "Air Quality Worsened • Higher health risk";
//                     color = "red";
//                     arrow = "↑";
//                     message = `AQI increased by ${percentChange}% over the selected years.`;
//                 } else if (diff < -1) {
//                     emoji = "🌿";
//                     health = "Air Quality Improved • Lower health risk";
//                     color = "green";
//                     arrow = "↓";
//                     message = `AQI decreased by ${percentChange}% over the selected years.`;
//                 } else {
//                     emoji = "⚪";
//                     health = "Stable • No major change in pollution levels";
//                     color = "gray";
//                     arrow = "→";
//                     message = "AQI is stable across the selected years.";
//                 }
//
//                 setTrendText({
//                     emoji,
//                     health,
//                     color,
//                     arrow,
//                     message,
//                 });
//             } else {
//                 setTrendText(null);
//             }
//         }
//
//         fetchData();
//     }, [city, fromYear, toYear]);
//
//     // Build the years dynamically
//     const years = Array.from({ length: 11 }, (_, i) => 2015 + i);
//
//     const data = {
//         labels,
//         datasets: [
//             {
//                 label: `Average AQI (${city})`,
//                 data: avgAqi,
//                 borderColor: "rgba(54, 162, 235, 1)",
//                 backgroundColor: "rgba(54, 162, 235, 0.2)",
//                 tension: 0.2,
//                 pointRadius: 3,
//             },
//         ],
//     };
//
//     const options = {
//         responsive: true,
//         plugins: {
//             legend: { position: "top" as const },
//             tooltip: { mode: "index" as const, intersect: false },
//         },
//         scales: {
//             x: { title: { display: true, text: "Year" } },
//             y: { title: { display: true, text: "Average AQI" } },
//         },
//     };
//
//     return (
//         <div style={{ maxWidth: 900, margin: "0 auto" }}>
//             <h3>AQI Chart</h3>
//
//             {/* Filters Section */}
//             <div
//                 style={{
//                     display: "flex",
//                     gap: "20px",
//                     marginBottom: "20px",
//                     alignItems: "center",
//                 }}
//             >
//                 {/* City Dropdown */}
//                 <div>
//                     <label>City</label>
//                     <br />
//                     <select
//                         value={city}
//                         onChange={(e) => setCity(e.target.value)}
//                         style={{ padding: "6px", width: "180px" }}
//                     >
//                         {cities.length === 0 ? (
//                             <option>Loading…</option>
//                         ) : (
//                             cities.map((c) => <option key={c}>{c}</option>)
//                         )}
//                     </select>
//                 </div>
//
//                 {/* From Year */}
//                 <div>
//                     <label>From Year</label>
//                     <br />
//                     <select
//                         value={fromYear}
//                         onChange={(e) => setFromYear(Number(e.target.value))}
//                         style={{ padding: "6px", width: "140px" }}
//                     >
//                         {years.map((y) => (
//                             <option key={y}>{y}</option>
//                         ))}
//                     </select>
//                 </div>
//
//                 {/* To Year */}
//                 <div>
//                     <label>To Year</label>
//                     <br />
//                     <select
//                         value={toYear}
//                         onChange={(e) => setToYear(Number(e.target.value))}
//                         style={{ padding: "6px", width: "140px" }}
//                     >
//                         {years.map((y) => (
//                             <option key={y}>{y}</option>
//                         ))}
//                     </select>
//                 </div>
//             </div>
//
//             {/* ⭐ TREND SUMMARY CARD ⭐ */}
//             {trendText && (
//                 <div
//                     style={{
//                         marginBottom: "20px",
//                         padding: "15px",
//                         borderRadius: "10px",
//                         background: "#f6f6f6",
//                         boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
//                         borderLeft: `6px solid ${trendText.color}`,
//                     }}
//                 >
//                     <h4 style={{ margin: 0, fontSize: "20px" }}>
//                         {trendText.emoji} {trendText.message}
//                     </h4>
//                     <p style={{ margin: "5px 0 0 0", color: trendText.color, fontWeight: 600 }}>
//                         {trendText.arrow} {trendText.health}
//                     </p>
//                 </div>
//             )}
//
//             {/* Chart */}
//             <Line data={data} options={options} />
//         </div>
//     );
// }
// CityAqiDashboard.tsx
import { useEffect, useState } from "react";
import { Line, Bar, Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Legend,
  Tooltip,
  ArcElement,
  RadialLinearScale,
  Filler,
} from "chart.js";

ChartJS.register(
  LineElement,
  PointElement,
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  Legend,
  Tooltip,
  Filler,
);

interface AqiTrendResponse {
  cities: string[];
  city: string;
  labels: string[];
  avgAqi: number[];
}

interface TrendText {
  message: string;
  color: string;
  arrow: string;
}

export default function CityAqiDashboard() {
  const [cities, setCities] = useState<string[]>([]);
  const [city, setCity] = useState("London");
  const [fromYear, setFromYear] = useState(2015);
  const [toYear, setToYear] = useState(2025);
  const [labels, setLabels] = useState<string[]>([]);
  const [avgAqi, setAvgAqi] = useState<number[]>([]);
  const [trendText, setTrendText] = useState<TrendText | null>(null);
  const [pollutantData, setPollutantData] = useState<{
    pm25: number; pm10: number; no2: number; so2: number; co: number; o3: number;
  }>({ pm25: 0, pm10: 0, no2: 0, so2: 0, co: 0, o3: 0 });

  const years = Array.from({ length: 11 }, (_, i) => 2015 + i);

  // ------------------- Fetch AQI data -------------------
  useEffect(() => {
    async function fetchData() {
      const res = await fetch(
        `http://localhost:3000/api/top_clear_aqi/history_year?city=${city}&from=${fromYear}&to=${toYear}`,
      );
      const json: AqiTrendResponse = await res.json();

      if (json.cities) setCities(json.cities);
      if (json.city) setCity(json.city);

      setLabels(json.labels);
      setAvgAqi(json.avgAqi);

      // Trend summary
      if (json.avgAqi.length >= 2) {
        const first = json.avgAqi[0];
        const last = json.avgAqi[json.avgAqi.length - 1];
        const diff = last - first;
        const percentChange = ((diff / first) * 100).toFixed(2);

        if (diff > 1) {
          setTrendText({
            message: `AQI increased by ${percentChange}% over the selected years. 🔥`,
            color: "red",
            arrow: "↑",
          });
        } else if (diff < -1) {
          setTrendText({
            message: `AQI decreased by ${percentChange}% over the selected years. 🌿`,
            color: "green",
            arrow: "↓",
          });
        } else {
          setTrendText({
            message: "AQI is stable across the selected years. ➡️",
            color: "gray",
            arrow: "→",
          });
        }
      } else {
        setTrendText(null);
      }
    }

    fetchData();
  }, [city, fromYear, toYear]);

  // ------------------- Fetch Pollutant Data for Radar -------------------
  useEffect(() => {
    async function fetchPollutants() {
      try {
        const res = await fetch(
          `http://localhost:3000/api/chart/compare?start=${fromYear}-01-01&end=${toYear}-12-31`
        );
        const json = await res.json();
        if (json.data && json.data.length > 0) {
          const cityObj = json.data.find((d: any) => d.city === city);
          if (cityObj && cityObj.aqi && cityObj.aqi.length > 0) {
            const aqiData = cityObj.aqi;
            const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length || 0;
            setPollutantData({
              pm25: avg(aqiData.map((d: any) => Number(d.pm2) || 0)),
              pm10: avg(aqiData.map((d: any) => Number(d.pm10) || 0)),
              no2: avg(aqiData.map((d: any) => Number(d.no2) || 0)),
              so2: avg(aqiData.map((d: any) => Number(d.so2) || 0)),
              co: avg(aqiData.map((d: any) => Number(d.co) || 0)),
              o3: avg(aqiData.map((d: any) => Number(d.o3) || 0)),
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch pollutant data", err);
      }
    }
    fetchPollutants();
  }, [city, fromYear, toYear]);

  // ------------------- Helper analytics -------------------
  const computeYearlyChange = () => {
    const change: number[] = [];
    for (let i = 1; i < avgAqi.length; i++) {
      change.push(avgAqi[i] - avgAqi[i - 1]);
    }
    return change;
  };

  const computeRollingAverage = (period: number) => {
    const result: number[] = [];
    for (let i = 0; i < avgAqi.length; i++) {
      if (i + 1 < period) {
        result.push(null as any);
        continue;
      }
      const sum = avgAqi
        .slice(i + 1 - period, i + 1)
        .reduce((a, b) => a + b, 0);
      result.push(Number((sum / period).toFixed(2)));
    }
    return result;
  };

  const categorizeAQI = (aqi: number) => {
    if (aqi <= 50) return "Good";
    if (aqi <= 100) return "Moderate";
    if (aqi <= 150) return "Unhealthy for sensitive";
    if (aqi <= 200) return "Unhealthy";
    if (aqi <= 300) return "Very Unhealthy";
    return "Hazardous";
  };

  const getCategoryDistribution = () => {
    const categories = [
      "Good",
      "Moderate",
      "Unhealthy for sensitive",
      "Unhealthy",
      "Very Unhealthy",
      "Hazardous",
    ];
    const counts = categories.map(
      (cat) => avgAqi.filter((v) => categorizeAQI(v) === cat).length,
    );
    return { categories, counts };
  };

  const bestYear = labels[avgAqi.indexOf(Math.min(...avgAqi))];
  const worstYear = labels[avgAqi.indexOf(Math.max(...avgAqi))];

  const rolling3 = computeRollingAverage(3);
  const rolling5 = computeRollingAverage(5);
  const yearlyChange = computeYearlyChange();

  // ------------------- Chart Data -------------------
  const mainChartData = {
    labels,
    datasets: [
      {
        label: `Average AQI (${city})`,
        data: avgAqi,
        borderColor: "rgba(54, 162, 235, 1)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        tension: 0.2,
        pointRadius: 3,
      },
      {
        label: "3-yr Moving Avg",
        data: rolling3,
        borderColor: "rgba(255, 206, 86, 1)",
        borderDash: [5, 5],
        pointRadius: 0,
        tension: 0.2,
      },
      {
        label: "5-yr Moving Avg",
        data: rolling5,
        borderColor: "rgba(75, 192, 192, 1)",
        borderDash: [5, 5],
        pointRadius: 0,
        tension: 0.2,
      },
    ],
  };

  const yearlyChangeData = {
    labels: labels.slice(1),
    datasets: [
      {
        label: "Year-over-Year Change",
        data: yearlyChange,
        borderColor: "#ff9500",
        backgroundColor: "#ff950022",
        borderWidth: 2,
        fill: true,
        tension: 0.3,
        pointRadius: 5,
        pointBackgroundColor: yearlyChange.map((v) => (v >= 0 ? "#ff3b30" : "#34c759")),
      },
    ],
  };

  const radarData = {
    labels: ["PM2.5", "PM10", "NO2", "SO2", "CO", "O3"],
    datasets: [
      {
        label: `Pollutant Levels (${city})`,
        data: [
          pollutantData.pm25,
          pollutantData.pm10,
          pollutantData.no2,
          pollutantData.so2,
          pollutantData.co,
          pollutantData.o3,
        ],
        backgroundColor: "rgba(54, 162, 235, 0.3)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 2,
        pointBackgroundColor: "rgba(54, 162, 235, 1)",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "rgba(54, 162, 235, 1)",
      },
    ],
  };

  const barHighlightData = {
    labels,
    datasets: [
      {
        label: "AQI Highlight",
        data: avgAqi,
        backgroundColor: labels.map((y) =>
          y === bestYear
            ? "green"
            : y === worstYear
              ? "red"
              : "rgba(54, 162, 235, 0.5)",
        ),
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const },
      tooltip: { mode: "index" as const, intersect: false },
    },
    scales: {
      x: { title: { display: true, text: "Year" } },
      y: { title: { display: true, text: "Average AQI" } },
    },
  };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <h2>Year & City wise AQI Dashboard</h2>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          marginBottom: "20px",
          alignItems: "center",
        }}
      >
        <div>
          <label>City</label>
          <br />
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            style={{ padding: "6px", width: "180px" }}
          >
            {cities.length === 0 ? (
              <option>Loading…</option>
            ) : (
              cities.map((c) => <option key={c}>{c}</option>)
            )}
          </select>
        </div>
        <div>
          <label>From Year</label>
          <br />
          <select
            value={fromYear}
            onChange={(e) => setFromYear(Number(e.target.value))}
            style={{ padding: "6px", width: "140px" }}
          >
            {years.map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
        </div>
        <div>
          <label>To Year</label>
          <br />
          <select
            value={toYear}
            onChange={(e) => setToYear(Number(e.target.value))}
            style={{ padding: "6px", width: "140px" }}
          >
            {years.map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Trend Summary Card */}
      {trendText && (
        <div
          style={{
            padding: "12px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            marginBottom: "20px",
            color: trendText.color,
          }}
        >
          <strong>{trendText.arrow}</strong> {trendText.message}
          <br />
          <em>
            Health Impact Summary:{" "}
            {avgAqi.length > 0
              ? avgAqi[avgAqi.length - 1] <= 50
                ? "Light"
                : avgAqi[avgAqi.length - 1] <= 100
                  ? "Moderate"
                  : "Hazardous"
              : "N/A"}
          </em>
        </div>
      )}

      {/* Charts - 2x2 uniform square grid */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "1fr 1fr", 
        gap: "20px", 
        marginTop: "20px" 
      }}>
        <div style={{ background: "#fff", padding: "16px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
          <h4 style={{ marginBottom: "10px", fontWeight: 600, fontSize: "14px" }}>Average AQI Trend</h4>
          <Line data={mainChartData} options={{ ...options, maintainAspectRatio: true }} />
        </div>

        <div style={{ background: "#fff", padding: "16px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
          <h4 style={{ marginBottom: "10px", fontWeight: 600, fontSize: "14px" }}>Year-over-Year AQI Change</h4>
          <Line
            data={yearlyChangeData}
            options={{
              ...options,
              maintainAspectRatio: true,
              plugins: { ...options.plugins, title: { display: false } },
              elements: { line: { tension: 0.3 } },
              scales: {
                x: { title: { display: true, text: "Year" } },
                y: { title: { display: true, text: "Change" } },
              },
            }}
          />
        </div>

        <div style={{ background: "#fff", padding: "16px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
          <h4 style={{ marginBottom: "10px", fontWeight: 600, fontSize: "14px" }}>Pollutant Comparison Radar</h4>
          <Radar data={radarData} options={{ maintainAspectRatio: true }} />
        </div>

        <div style={{ background: "#fff", padding: "16px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
          <h4 style={{ marginBottom: "10px", fontWeight: 600, fontSize: "14px" }}>Best/Worst Year Highlight</h4>
          <Bar data={barHighlightData} options={{ ...options, maintainAspectRatio: true }} />
        </div>
      </div>
    </div>
  );
}
