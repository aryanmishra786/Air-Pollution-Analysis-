import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import AQIGauge from "./AQIGauge.tsx";
import WeatherDashboard from "./WeatherData.tsx";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface IAqiResponse {
    status: string;
    data: {
        aqi: number;
        city: {
            name: string;
            geo: [number, number];
        };
        dominentpol: string;
        iaqi: { [pollutant: string]: { v: number } };
        time: { s: string; tz: string; iso: string };
    };
}

interface PollutantDatum {
    pollutant: string;
    value: number;
}

const getAQICategory = (aqi: number) => {
    if (aqi <= 50) return { label: "Good", color: "#009966" };
    if (aqi <= 100) return { label: "Moderate", color: "#FFDE33" };
    if (aqi <= 150)
        return { label: "Unhealthy for Sensitive Groups", color: "#FF9933" };
    if (aqi <= 200) return { label: "Unhealthy", color: "#CC0033" };
    if (aqi <= 300) return { label: "Very Unhealthy", color: "#660099" };
    return { label: "Hazardous", color: "#7E0023" };
};

type Props = {
    city: string;
    token: string;
    refreshMinutes?: number; // 🔹 Optional: auto-refresh interval
};

const AQIWidgetWithChart: React.FC<Props> = ({
                                                 city,
                                                 token,
                                                 refreshMinutes = 10, // default: refresh every 10 minutes
                                             }) => {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [aqiValue, setAqiValue] = useState<number>(0);
    const [cityName, setCityName] = useState<string>("");
    const [pollutants, setPollutants] = useState<PollutantDatum[]>([]);
    const [lastUpdated, setLastUpdated] = useState<string>("");

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const url = `https://api.waqi.info/feed/${encodeURIComponent(
                city
            )}/?token=${token}`;
            const resp = await fetch(url);
            const json: IAqiResponse = await resp.json();

            if (json.status !== "ok") {
                throw new Error("API status not ok");
            }

            const d = json.data;
            setAqiValue(d.aqi);
            setCityName(d.city.name);
            setLastUpdated(d.time.iso || d.time.s);

            const iaqi = d.iaqi || {};
            const arr: PollutantDatum[] = Object.keys(iaqi).map((p) => ({
                pollutant: p.toUpperCase(),
                value: iaqi[p].v,
            }));
            setPollutants(arr);
        } catch (err: any) {
            setError(err.message || "Failed to fetch AQI");
        } finally {
            setLoading(false);
        }
    };

    // 🔄 Fetch immediately, then set up interval
    useEffect(() => {
        fetchData();

        const interval = setInterval(fetchData, refreshMinutes * 60 * 1000);
        return () => clearInterval(interval);
    }, [city, token, refreshMinutes]);

    if (loading) {
        return (
            <div style={{ padding: "1rem", textAlign: "center" }}>
                Loading AQI for {city}…
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: "1rem", color: "red", textAlign: "center" }}>
                Error: {error}
            </div>
        );
    }

    const category = getAQICategory(aqiValue);

    // Chart setup
    const chartData = {
        labels: pollutants.map((p) => p.pollutant),
        datasets: [
            {
                label: "Concentration",
                data: pollutants.map((p) => p.value),
                backgroundColor: pollutants.map(() => category.color),
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { display: false },
            title: { display: true, text: `Pollutant Levels in ${cityName}` },
        },
        scales: {
            y: { beginAtZero: true },
        },
    };

    return (

        <div
            style={{
                maxWidth: "480px",
                margin: "1rem auto",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                padding: "1.5rem",
                textAlign: "center",
                background: "#fff",
                fontFamily: "'Titillium Web', sans-serif",
            }}
        >
            <h5 style={{ margin: "0 0 1rem" ,fontFamily: "'Titillium Web', sans-serif", }}>{cityName}</h5>

            <div
                style={{
                    fontSize: "2.5rem",
                    fontFamily: "'Titillium Web', sans-serif",
                    fontWeight: "bold",
                    color: "#fff",
                    backgroundColor: category.color,
                    borderRadius: "8px",
                    padding: "0.5rem 1rem",
                    display: "inline-block",
                    marginBottom: "1rem",
                }}
            >
                {aqiValue}
            </div>
            <div style={{ marginBottom: "0.8rem", fontSize: "1.1rem",fontFamily: "'Titillium Web', sans-serif", }}>
            <AQIGauge aqi={aqiValue} />
            </div>
            <div style={{ marginBottom: "0.8rem", fontSize: "1.1rem",fontFamily: "'Titillium Web', sans-serif", }}>
                {category.label}
            </div>

            <div style={{ marginBottom: "1.5rem",fontFamily: "'Titillium Web', sans-serif", }}>
                <Bar data={chartData} options={chartOptions} />
            </div>

            <small style={{ color: "#666" ,fontFamily: "'Titillium Web', sans-serif",}}>
                Last updated:{" "}
                {lastUpdated
                    ? new Date(lastUpdated).toLocaleString()
                    : "Unknown time"}{" "}
                (auto-refresh every {refreshMinutes} min)
            </small>
            <div style={{ marginBottom: "1.5rem" }}>
                <WeatherDashboard key={city} city={city} refreshMins={refreshMinutes} />
            </div>
        </div>
    );
};

export default AQIWidgetWithChart;
