import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement,
    Tooltip,
    Legend,
} from "chart.js";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

interface WeatherData {
    current_condition: any[];
    weather: {
        date: string;
        avgtempC: string;
        maxtempC: string;
        mintempC: string;
        hourly: { tempC: string; time: string }[];
    }[];
}

const WeatherDashboard: React.FC<{ city?: string; refreshMins?: number }> = ({
                                                                                 city = "sydney",
                                                                                 refreshMins = 15,
                                                                             }) => {
    const [data, setData] = useState<WeatherData | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchWeather = async () => {
        try {
            const res = await fetch(`https://wttr.in/${city}?format=j1`);
            const json = await res.json();
            setData(json);
            setLastUpdated(new Date());
        } catch (e) {
            console.error("Failed to fetch weather:", e);
        }
    };

    useEffect(() => {
        fetchWeather().then();
        const timer = setInterval(fetchWeather, refreshMins * 60 * 1000);
        return () => clearInterval(timer);
    }, [city, refreshMins]);

    if (!data) return <div>Loading weather data...</div>;

    const current = data.current_condition[0];
    const forecast = data.weather.slice(0, 3); // next 3 days
    const today = forecast[0];

    // --- Chart Data ---
    const chartData = {
        labels: today.hourly.map((h) => h.time.padStart(4, "0").replace(/(\d{2})(\d{2})/, "$1:$2")),
        datasets: [
            {
                label: "Temperature (°C)",
                data: today.hourly.map((h) => parseFloat(h.tempC)),
                borderColor: "#007bff",
                backgroundColor: "rgba(0,123,255,0.2)",
                fill: true,
                tension: 0.3,
            },
        ],
    };

    return (
        <div
            style={{
                background: "#fff",
                borderRadius: 12,
                padding: "1.5rem",
                margin: "1rem auto",
                boxShadow: "0 6px 16px rgba(0,0,0,0.1)",
                maxWidth: 800,
                fontFamily: "'Titillium Web', sans-serif",
            }}
        >
            <h2 style={{ textAlign: "center", color: "#007bff" }}>🌤 Weather in {city}</h2>

            <div style={{ textAlign: "center", marginBottom: "1rem" }}>
                <h3>{current.temp_C}°C — {current.weatherDesc[0].value}</h3>
                <p>
                    💧 {current.humidity}% humidity | 🌬 {current.windspeedKmph} km/h | ☁ Pressure:{" "}
                    {current.pressure} hPa
                </p>
                {lastUpdated && (
                    <small style={{ color: "#555" }}>
                        Last updated: {lastUpdated.toLocaleTimeString()} — auto-refresh every {refreshMins} min
                    </small>
                )}
            </div>

            {/* Temperature Chart */}
            <div style={{ height: 300 }}>
                <Line data={chartData} />
            </div>

            {/* 3-Day Forecast */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-around",
                    marginTop: "1.5rem",
                    flexWrap: "wrap",
                }}
            >
                {forecast.map((day) => (
                    <div
                        key={day.date}
                        style={{
                            background: "#f8f9fa",
                            padding: "1rem",
                            borderRadius: 5,
                            width: 120,
                            margin: "0.2rem",
                            textAlign: "center",
                            boxShadow: "0 3px 6px rgba(0,0,0,0.05)",
                        }}
                    >
                        <strong>{new Date(day.date).toDateString()}</strong>
                        <div style={{ marginTop: 6 }}>
                            🌡 Avg: {day.avgtempC}°C<br />
                            ⬆ Max: {day.maxtempC}°C<br />
                            ⬇ Min: {day.mintempC}°C
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WeatherDashboard;
