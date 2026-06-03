// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import {
//     Chart as ChartJS,
//     LineElement,
//     CategoryScale,
//     LinearScale,
//     PointElement,
//     Tooltip,
//     Legend,
//     Title,
// } from "chart.js";
// import { Line } from "react-chartjs-2";
//
// ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, Title);
//
// interface AQIData {
//     date: string;
//     aqi: number;
//     pollutant: string;
// }
//
// const generateMockData = (pollutant: string, startDate: string, endDate: string): AQIData[] => {
//     const start = new Date(startDate);
//     const end = new Date(endDate);
//     const data: AQIData[] = [];
//     const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
//
//     for (let i = 0; i <= days; i++) {
//         const date = new Date(start);
//         date.setDate(start.getDate() + i);
//         data.push({
//             date: date.toISOString().split("T")[0],
//             aqi: Math.floor(50 + Math.random() * 200),
//             pollutant,
//         });
//     }
//     return data;
// };
//
// // AQI calculator helper (EPA formula)
// const calculateAQI = (C: number, breakpoints: number[], AQIBreaks: number[]) => {
//     const [Clow, Chigh] = breakpoints;
//     const [AQIlow, AQIhigh] = AQIBreaks;
//     return ((AQIhigh - AQIlow) / (Chigh - Clow)) * (C - Clow) + AQIlow;
// };
//
// const AQIAnalyticsDashboard: React.FC = () => {
//     const [city, setCity] = useState("Delhi");
//     const [pollutant, setPollutant] = useState("PM2.5");
//     const [aqiData, setAqiData] = useState<AQIData[]>([]);
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState("");
//
//     // Date range filter
//     const today = new Date().toISOString().split("T")[0];
//     const [startDate, setStartDate] = useState(() => {
//         const d = new Date();
//         d.setDate(d.getDate() - 30);
//         return d.toISOString().split("T")[0];
//     });
//     const [endDate, setEndDate] = useState(today);
//
//     // Calculator states
//     const [concentration, setConcentration] = useState("");
//     const [calculatedAQI, setCalculatedAQI] = useState<number | null>(null);
//
//     // Fetch data from OpenAQ or mock fallback
//     useEffect(() => {
//         const fetchData = async () => {
//             setLoading(true);
//             setError("");
//
//             try {
//                 const res = await axios.get(
//                     `https://api.openaq.org/v2/measurements?city=${city}&parameter=${pollutant.toLowerCase()}&date_from=${startDate}&date_to=${endDate}&limit=1000&sort=asc`
//                 );
//
//                 if (res.data?.results?.length > 0) {
//                     const formatted = res.data.results.map((r: any) => ({
//                         date: r.date.local.split("T")[0],
//                         aqi: r.value,
//                         pollutant,
//                     }));
//                     setAqiData(formatted);
//                 } else {
//                     console.warn("API returned no data, using mock data.");
//                     //setAqiData(generateMockData(pollutant, startDate, endDate));
//                 }
//             } catch (err) {
//                 console.warn("API unavailable, using mock data.");
//                 //setAqiData(generateMockData(pollutant, startDate, endDate));
//             } finally {
//                 setLoading(false);
//             }
//         };
//
//         fetchData();
//     }, [city, pollutant, startDate, endDate]);
//
//     // Chart setup
//     const chartData = {
//         labels: aqiData.map((d) => d.date),
//         datasets: [
//             {
//                 label: `${pollutant} AQI in ${city}`,
//                 data: aqiData.map((d) => d.aqi),
//                 borderColor: "#007bff",
//                 backgroundColor: "rgba(0, 123, 255, 0.2)",
//                 tension: 0.3,
//                 fill: true,
//             },
//         ],
//     };
//
//     const chartOptions = {
//         responsive: true,
//         plugins: {
//             legend: { position: "top" as const },
//             title: { display: true, text: `Air Quality Trend (${startDate} → ${endDate})` },
//         },
//         scales: {
//             y: {
//                 beginAtZero: true,
//                 max: 500,
//                 title: { display: true, text: "AQI" },
//             },
//             x: {
//                 title: { display: true, text: "Date" },
//             },
//         },
//     };
//
//     // AQI calculator
//     const handleCalculate = () => {
//         const C = parseFloat(concentration);
//         if (isNaN(C)) {
//             setCalculatedAQI(null);
//             return;
//         }
//
//         const breakpoints = [
//             { range: [0, 12], AQI: [0, 50] },
//             { range: [12.1, 35.4], AQI: [51, 100] },
//             { range: [35.5, 55.4], AQI: [101, 150] },
//             { range: [55.5, 150.4], AQI: [151, 200] },
//             { range: [150.5, 250.4], AQI: [201, 300] },
//             { range: [250.5, 500], AQI: [301, 500] },
//         ];
//
//         const bp = breakpoints.find((b) => C >= b.range[0] && C <= b.range[1]);
//         if (!bp) {
//             setCalculatedAQI(999);
//             return;
//         }
//
//         const AQI = calculateAQI(C, bp.range, bp.AQI);
//         setCalculatedAQI(parseFloat(AQI.toFixed(1)));
//     };
//
//     return (
//         <div style={{ padding: "2rem", maxWidth: "950px", margin: "auto" }}>
//             <h2>🌍 Air Quality Trend & Calculator</h2>
//
//             {/* --- Filters --- */}
//             <div
//                 style={{
//                     display: "flex",
//                     flexWrap: "wrap",
//                     gap: "1rem",
//                     marginBottom: "1.5rem",
//                     alignItems: "center",
//                 }}
//             >
//                 <select value={city} onChange={(e) => setCity(e.target.value)}>
//                     <option value="Delhi">Delhi</option>
//                     <option value="Mumbai">Mumbai</option>
//                     <option value="Beijing">Beijing</option>
//                     <option value="London">London</option>
//                     <option value="Los Angeles">Los Angeles</option>
//                 </select>
//
//                 <select value={pollutant} onChange={(e) => setPollutant(e.target.value)}>
//                     <option value="PM2.5">PM₂.₅</option>
//                     <option value="PM10">PM₁₀</option>
//                     <option value="O3">O₃</option>
//                     <option value="NO2">NO₂</option>
//                 </select>
//
//                 <label>
//                     Start Date:
//                     <input
//                         type="date"
//                         value={startDate}
//                         onChange={(e) => setStartDate(e.target.value)}
//                     />
//                 </label>
//
//                 <label>
//                     End Date:
//                     <input
//                         type="date"
//                         value={endDate}
//                         onChange={(e) => setEndDate(e.target.value)}
//                     />
//                 </label>
//             </div>
//
//             {/* --- Chart --- */}
//             {loading ? (
//                 <p>Loading AQI data...</p>
//             ) : error ? (
//                 <p style={{ color: "red" }}>{error}</p>
//             ) : (
//                 <Line data={chartData} options={chartOptions} />
//             )}
//
//             {/* --- Analysis Summary --- */}
//             {aqiData.length > 0 &&
//                 `AQI in ${city} for ${pollutant} has ${
//                     aqiData[aqiData.length - 1].aqi > aqiData[0].aqi ? "increased" : "decreased"
//                 } compared to ${aqiData.length} days ago.`}
//
//             {/* --- AQI Calculator --- */}
//             <div
//                 style={{
//                     marginTop: "2rem",
//                     padding: "1.5rem",
//                     borderRadius: "8px",
//                     background: "#f9f9f9",
//                     border: "1px solid #ddd",
//                 }}
//             >
//                 <h3>🧮 AQI Calculator</h3>
//                 <p style={{ fontSize: "0.9rem", color: "#555" }}>
//                     Enter PM₂.₅ concentration (µg/m³) to calculate approximate AQI:
//                 </p>
//
//                 <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
//                     <input
//                         type="number"
//                         placeholder="Concentration..."
//                         value={concentration}
//                         onChange={(e) => setConcentration(e.target.value)}
//                         style={{ padding: "0.5rem", flex: 1 }}
//                     />
//                     <button
//                         onClick={handleCalculate}
//                         style={{
//                             padding: "0.6rem 1rem",
//                             background: "#007bff",
//                             color: "#fff",
//                             border: "none",
//                             borderRadius: "4px",
//                             cursor: "pointer",
//                         }}
//                     >
//                         Calculate
//                     </button>
//                 </div>
//
//                 {calculatedAQI !== null && (
//                     <p style={{ marginTop: "1rem", fontWeight: "bold" }}>
//                         AQI Result:{" "}
//                         <span
//                             style={{
//                                 color:
//                                     calculatedAQI < 50
//                                         ? "green"
//                                         : calculatedAQI < 100
//                                             ? "orange"
//                                             : calculatedAQI < 200
//                                                 ? "red"
//                                                 : "purple",
//                             }}
//                         >
//               {calculatedAQI}
//             </span>
//                     </p>
//                 )}
//             </div>
//         </div>
//     );
// };
//
// export default AQIAnalyticsDashboard;

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    Chart as ChartJS,
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement,
    Tooltip,
    Legend,
    Title,
} from "chart.js";
import { Line } from "react-chartjs-2";
import WeatherDashboard from "./WeatherData.tsx";


ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, Title);

interface CityAQIData {
    date: string;
    value: number;
}

interface CityData {
    city: string;
    pollutant: string;
    aqi: CityAQIData[];
    startAQI?: number;
    endAQI?: number;
    change?: number;
    avgAQI?: number;
}

const AQIAnalyticsDashboard: React.FC = () => {
    const [data, setData] = useState<CityData[]>([]);
    const [selectedCity, setSelectedCity] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [concentration, setConcentration] = useState("");
    const [calculatedAQI, setCalculatedAQI] = useState<number | null>(null);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const fetchData = async () => {
        setLoading(true);
        setError("");
        try {
            const query = [];
            if (startDate) query.push(`start=${startDate}`);
            if (endDate) query.push(`end=${endDate}`);
            const url = `http://localhost:3000/api/chart/compare${query.length ? "?" + query.join("&") : ""}`;

            const res = await axios.get(url);
            if (res.data?.data) {
                // Enrich data with AQI comparisons
                const enriched = res.data.data.map((city: CityData) => {
                    if (city.aqi.length >= 2) {
                        const first = Number(city.aqi[0].value) || 0;
                        const last = Number(city.aqi[city.aqi.length - 1].value) || 0;
                        const change = last - first;
                        const avg =
                            city.aqi.reduce((a, b) => a + Number(b.value || 0), 0) / city.aqi.length;

                        return {
                            ...city,
                            startAQI: Number(first),
                            endAQI: Number(last),
                            change: Number(change),
                            avgAQI: Number(avg),
                        };
                    }
                    return { ...city, startAQI: 0, endAQI: 0, change: 0, avgAQI: 0 };
                });


                setData(enriched);
                setSelectedCity(enriched[0]?.city || "");
            } else {
                setError("No data received from API");
            }
        } catch (err) {
            console.error(err);
            setError("Failed to load AQI data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleFilter = () => {
        fetchData();
    };

    const selectedData = data.find((d) => d.city === selectedCity);

    // Chart data
    const chartData = selectedData
        ? {
            labels: selectedData.aqi.map((d) => d.date),
            datasets: [
                {
                    label: `${selectedData.city} AQI`,
                    data: selectedData.aqi.map((d) => d.value),
                    borderColor: "#007bff",
                    backgroundColor: "rgba(0, 123, 255, 0.2)",
                    tension: 0.3,
                    fill: true,
                },
            ],
        }
        : { labels: [], datasets: [] };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { position: "top" as const },
            title: {
                display: true,
                text: selectedCity ? `AQI Trend for ${selectedCity}` : "Select a City to View AQI Data",
            },
        },
        scales: {
            y: { beginAtZero: true, max: 500, title: { display: true, text: "AQI" } },
            x: { title: { display: true, text: "Date" } },
        },
    };

    // AQI Calculator
    const calculateAQI = (C: number, breakpoints: number[], AQIBreaks: number[]) => {
        const [Clow, Chigh] = breakpoints;
        const [AQIlow, AQIhigh] = AQIBreaks;
        return ((AQIhigh - AQIlow) / (Chigh - Clow)) * (C - Clow) + AQIlow;
    };

    const handleCalculate = () => {
        const C = parseFloat(concentration);
        if (isNaN(C)) {
            setCalculatedAQI(null);
            return;
        }

        const breakpoints = [
            { range: [0, 12], AQI: [0, 50] },
            { range: [12.1, 35.4], AQI: [51, 100] },
            { range: [35.5, 55.4], AQI: [101, 150] },
            { range: [55.5, 150.4], AQI: [151, 200] },
            { range: [150.5, 250.4], AQI: [201, 300] },
            { range: [250.5, 500], AQI: [301, 500] },
        ];

        const bp = breakpoints.find((b) => C >= b.range[0] && C <= b.range[1]);
        if (!bp) {
            setCalculatedAQI(999);
            return;
        }

        const AQI = calculateAQI(C, bp.range, bp.AQI);
        setCalculatedAQI(parseFloat(AQI.toFixed(1)));
    };

    return (
        <div style={{ padding: "2rem", maxWidth: "1000px", margin: "auto" }}>
            <h2>🌍 City-wise AQI Dashboard & Calculator</h2>



            {/* --- Date Filters --- */}
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "1rem",
                    marginBottom: "1.5rem",
                    alignItems: "center",
                }}
            >
                <label>
                    Start Date:
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        style={{ marginLeft: "0.5rem" }}
                    />
                </label>

                <label>
                    End Date:
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        style={{ marginLeft: "0.5rem" }}
                    />
                </label>

                <button
                    onClick={handleFilter}
                    style={{
                        padding: "0.5rem 1rem",
                        background: "#007bff",
                        color: "#fff",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                    }}
                >
                    Apply Filter
                </button>
            </div>

            {/* --- City Selector --- */}
            <div style={{ marginBottom: "1.5rem" }}>
                <label>
                    Select City:
                    <select
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        style={{ marginLeft: "0.5rem" }}
                    >
                        {data.map((d) => (
                            <option key={d.city} value={d.city}>
                                {d.city}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            {/* --- AQI Chart --- */}
            {loading ? (
                <p>Loading AQI data...</p>
            ) : error ? (
                <p style={{ color: "red" }}>{error}</p>
            ) : (
                selectedData && <Line data={chartData} options={chartOptions} />
            )}




            {/* --- AQI Depth Report --- */}
            {selectedData && (
                <div style={{ marginTop: "1.5rem", background: "#f8f8f8", padding: "1rem", borderRadius: "8px" }}>
                    <h3>📊 AQI Depth Analysis - {selectedData.city}</h3>
                    <p>
                        <b>Start AQI:</b> {selectedData.startAQI?.toFixed(1)} <br />
                        <b>End AQI:</b> {selectedData.endAQI?.toFixed(1)} <br />
                        <b>Average AQI:</b> {selectedData.avgAQI?.toFixed(1)} <br />
                        <b>Status:</b>{" "}
                        {selectedData.change && selectedData.change > 0
                            ? `😞 Worsened by ${selectedData.change.toFixed(1)} points`
                            : `😊 Improved by ${Math.abs(selectedData.change || 0).toFixed(1)} points`}{" "}
                        over the selected period.
                    </p>
                </div>
            )}

            {/* --- AQI Calculator --- */}


            {/*<div style={{ marginBottom: "1.5rem" }}>*/}
            {/*    <WeatherDashboard key={selectedCity} city={selectedCity} refreshMins={10} />*/}
            {/*</div>*/}

            <div
                style={{
                    marginTop: "2rem",
                    padding: "1.5rem",
                    borderRadius: "8px",
                    background: "#f9f9f9",
                    border: "1px solid #ddd",
                }}
            >
                <h3>🧮 AQI Calculator</h3>
                <p style={{ fontSize: "0.9rem", color: "#555" }}>
                    Enter PM₂.₅ concentration (µg/m³) to calculate approximate AQI:
                </p>

                <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                    <input
                        type="number"
                        placeholder="Concentration..."
                        value={concentration}
                        onChange={(e) => setConcentration(e.target.value)}
                        style={{ padding: "0.5rem", flex: 1 }}
                    />
                    <button
                        onClick={handleCalculate}
                        style={{
                            padding: "0.6rem 1rem",
                            background: "#007bff",
                            color: "#fff",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                        }}
                    >
                        Calculate
                    </button>
                </div>

                {calculatedAQI !== null && (
                    <p style={{ marginTop: "1rem", fontWeight: "bold" }}>
                        AQI Result:{" "}
                        <span
                            style={{
                                color:
                                    calculatedAQI < 50
                                        ? "green"
                                        : calculatedAQI < 100
                                            ? "orange"
                                            : calculatedAQI < 200
                                                ? "red"
                                                : "purple",
                            }}
                        >
              {calculatedAQI}
            </span>
                    </p>
                )}
            </div>
        </div>
    );
};

export default AQIAnalyticsDashboard;






