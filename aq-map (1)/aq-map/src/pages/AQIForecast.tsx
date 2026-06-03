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
    Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, Title, Filler);

interface Prediction {
    date: string;
    predicted_aqi: number;
    lower_bound: number;
    upper_bound: number;
    category: {
        level: string;
        color: string;
    };
}

interface PredictionResponse {
    city: string;
    predictions: Prediction[];
    generated_at: string;
    error?: string;
}

const AQIForecast: React.FC = () => {
    const [cities, setCities] = useState<string[]>([]);
    const [selectedCity, setSelectedCity] = useState<string>("");
    const [days, setDays] = useState<number>(7);
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [generatedAt, setGeneratedAt] = useState("");

    useEffect(() => {
        fetchCities();
    }, []);

    const fetchCities = async () => {
        try {
            const res = await axios.get("http://localhost:3000/api/chart/ml_cities");
            if (res.data?.cities?.length > 0) {
                setCities(res.data.cities);
                setSelectedCity(res.data.cities[0]);
            } else {
                setError("No trained models available. Please run the ML training script first.");
            }
        } catch (err) {
            setError("ML service unavailable. Make sure the Python ML service is running on port 5000.");
        }
    };

    const fetchPredictions = async () => {
        if (!selectedCity) return;
        
        setLoading(true);
        setError("");
        setPredictions([]);

        try {
            const res = await axios.get<PredictionResponse>(
                `http://localhost:3000/api/chart/predict?city=${encodeURIComponent(selectedCity)}&days=${days}`
            );

            if (res.data.error) {
                setError(res.data.error);
            } else {
                setPredictions(res.data.predictions);
                setGeneratedAt(res.data.generated_at);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to fetch predictions");
        } finally {
            setLoading(false);
        }
    };

    const chartData = {
        labels: predictions.map((_, i) => `Day ${i + 1}`),
        datasets: [
            {
                label: "Predicted AQI",
                data: predictions.map((p) => p.predicted_aqi),
                borderColor: "#007bff",
                backgroundColor: "rgba(0, 123, 255, 0.1)",
                tension: 0.4,
                fill: false,
                pointRadius: 5,
                pointBackgroundColor: predictions.map((p) => p.category.color),
            },
            {
                label: "Upper Bound",
                data: predictions.map((p) => p.upper_bound),
                borderColor: "rgba(255, 99, 132, 0.5)",
                backgroundColor: "rgba(255, 99, 132, 0.1)",
                borderDash: [5, 5],
                tension: 0.4,
                fill: false,
                pointRadius: 0,
            },
            {
                label: "Lower Bound",
                data: predictions.map((p) => p.lower_bound),
                borderColor: "rgba(75, 192, 192, 0.5)",
                backgroundColor: "rgba(75, 192, 192, 0.1)",
                borderDash: [5, 5],
                tension: 0.4,
                fill: "-1",
                pointRadius: 0,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { position: "top" as const },
            title: {
                display: true,
                text: `AQI Forecast for ${selectedCity} (Next ${days} Days)`,
                font: { size: 16 },
            },
            tooltip: {
                callbacks: {
                    afterLabel: (context: any) => {
                        if (context.datasetIndex === 0) {
                            const pred = predictions[context.dataIndex];
                            return `Category: ${pred.category.level}`;
                        }
                        return "";
                    },
                },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 500,
                title: { display: true, text: "AQI" },
            },
            x: {
                title: { display: true, text: "Days" },
            },
        },
    };

    const getAverageCategory = () => {
        if (predictions.length === 0) return null;
        const avg = predictions.reduce((a, b) => a + b.predicted_aqi, 0) / predictions.length;
        
        if (avg <= 50) return { level: "Good", color: "#00e400", advice: "Air quality is satisfactory. Enjoy outdoor activities!" };
        if (avg <= 100) return { level: "Moderate", color: "#ffff00", advice: "Acceptable air quality. Sensitive individuals should limit prolonged outdoor exertion." };
        if (avg <= 150) return { level: "Unhealthy for Sensitive Groups", color: "#ff7e00", advice: "People with respiratory conditions should reduce outdoor activities." };
        if (avg <= 200) return { level: "Unhealthy", color: "#ff0000", advice: "Everyone may begin to experience health effects. Limit outdoor activities." };
        if (avg <= 300) return { level: "Very Unhealthy", color: "#8f3f97", advice: "Health alert! Avoid outdoor activities and use air purifiers indoors." };
        return { level: "Hazardous", color: "#7e0023", advice: "Emergency conditions! Stay indoors with air filtration." };
    };

    const avgCategory = getAverageCategory();

    return (
        <div style={{ padding: "2rem", maxWidth: "1000px", margin: "auto" }}>
            {/* Controls */}
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "1rem",
                    marginBottom: "1.5rem",
                    alignItems: "center",
                    background: "#f5f5f5",
                    padding: "1rem",
                    borderRadius: "8px",
                }}
            >
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <strong>City:</strong>
                    <select
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        style={{ padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                    >
                        {cities.map((city) => (
                            <option key={city} value={city}>
                                {city}
                            </option>
                        ))}
                    </select>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <strong>Forecast Days:</strong>
                    <select
                        value={days}
                        onChange={(e) => setDays(Number(e.target.value))}
                        style={{ padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                    >
                        <option value={7}>7 Days</option>
                        <option value={14}>14 Days</option>
                        <option value={30}>30 Days</option>
                        <option value={90}>90 Days</option>
                    </select>
                </label>

                <button
                    onClick={fetchPredictions}
                    disabled={loading || !selectedCity}
                    style={{
                        padding: "0.6rem 1.5rem",
                        background: loading ? "#ccc" : "#007bff",
                        color: "#fff",
                        border: "none",
                        borderRadius: "4px",
                        cursor: loading ? "not-allowed" : "pointer",
                        fontWeight: "bold",
                    }}
                >
                    {loading ? "Predicting..." : "🔍 Generate Forecast"}
                </button>
            </div>

            {/* Error Display */}
            {error && (
                <div
                    style={{
                        background: "#ffebee",
                        color: "#c62828",
                        padding: "1rem",
                        borderRadius: "8px",
                        marginBottom: "1rem",
                    }}
                >
                    ⚠️ {error}
                </div>
            )}

            {/* Chart */}
            {predictions.length > 0 && (
                <>
                    <div style={{ background: "#fff", padding: "1rem", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                        <Line data={chartData} options={chartOptions} />
                    </div>

                    {/* Summary */}
                    {avgCategory && (
                        <div
                            style={{
                                marginTop: "1.5rem",
                                padding: "1.5rem",
                                borderRadius: "8px",
                                background: avgCategory.color + "20",
                                borderLeft: `4px solid ${avgCategory.color}`,
                            }}
                        >
                            <h3 style={{ margin: "0 0 0.5rem 0" }}>📊 Forecast Summary</h3>
                            <p style={{ margin: "0.3rem 0" }}>
                                <strong>Average Predicted AQI:</strong>{" "}
                                {(predictions.reduce((a, b) => a + b.predicted_aqi, 0) / predictions.length).toFixed(1)}
                            </p>
                            <p style={{ margin: "0.3rem 0" }}>
                                <strong>Expected Condition:</strong>{" "}
                                <span style={{ color: avgCategory.color, fontWeight: "bold" }}>{avgCategory.level}</span>
                            </p>
                            <p style={{ margin: "0.3rem 0" }}>
                                <strong>Range:</strong> {Math.min(...predictions.map((p) => p.predicted_aqi)).toFixed(0)} -{" "}
                                {Math.max(...predictions.map((p) => p.predicted_aqi)).toFixed(0)}
                            </p>
                            <p style={{ margin: "0.5rem 0 0 0", fontStyle: "italic", color: "#555" }}>
                                💡 {avgCategory.advice}
                            </p>
                        </div>
                    )}

                    {/* Predictions Table */}
                    <div style={{ marginTop: "1.5rem", overflowX: "auto" }}>
                        <h3>📅 Daily Predictions</h3>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                            <thead>
                                <tr style={{ background: "#f0f0f0" }}>
                                    <th style={{ padding: "0.75rem", textAlign: "left", borderBottom: "2px solid #ddd" }}>Day</th>
                                    <th style={{ padding: "0.75rem", textAlign: "center", borderBottom: "2px solid #ddd" }}>Predicted AQI</th>
                                    <th style={{ padding: "0.75rem", textAlign: "center", borderBottom: "2px solid #ddd" }}>Range</th>
                                    <th style={{ padding: "0.75rem", textAlign: "left", borderBottom: "2px solid #ddd" }}>Category</th>
                                </tr>
                            </thead>
                            <tbody>
                                {predictions.map((pred, idx) => (
                                    <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                                        <td style={{ padding: "0.75rem" }}>Day {idx + 1}</td>
                                        <td style={{ padding: "0.75rem", textAlign: "center", fontWeight: "bold" }}>
                                            {pred.predicted_aqi.toFixed(1)}
                                        </td>
                                        <td style={{ padding: "0.75rem", textAlign: "center", color: "#666" }}>
                                            {pred.lower_bound.toFixed(0)} - {pred.upper_bound.toFixed(0)}
                                        </td>
                                        <td style={{ padding: "0.75rem" }}>
                                            <span
                                                style={{
                                                    background: pred.category.color,
                                                    color: pred.category.color === "#ffff00" ? "#000" : "#fff",
                                                    padding: "0.25rem 0.5rem",
                                                    borderRadius: "4px",
                                                    fontSize: "0.8rem",
                                                }}
                                            >
                                                {pred.category.level}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {generatedAt && (
                        <p style={{ marginTop: "1rem", fontSize: "0.8rem", color: "#999" }}>
                            Generated at: {new Date(generatedAt).toLocaleString()}
                        </p>
                    )}
                </>
            )}

            {/* Instructions when no predictions */}
            {predictions.length === 0 && !loading && !error && (
                <div
                    style={{
                        textAlign: "center",
                        padding: "3rem",
                        background: "#f9f9f9",
                        borderRadius: "8px",
                        color: "#666",
                    }}
                >
                    <p style={{ fontSize: "1.2rem" }}>👆 Select a city and click "Generate Forecast" to see predictions</p>
                    <p style={{ fontSize: "0.9rem", marginTop: "1rem" }}>
                        Predictions are generated using Facebook Prophet trained on 10+ years of historical AQI data.
                    </p>
                </div>
            )}
        </div>
    );
};

export default AQIForecast;
