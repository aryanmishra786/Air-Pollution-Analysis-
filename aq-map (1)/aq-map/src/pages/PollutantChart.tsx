import React from "react";
import { Chart } from "react-chartjs-2";



import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Tooltip,
    Legend
} from "chart.js";


ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend);

type Props = {
    title: string;
    records?: any;
};

// AQI color logic
const getAQIColor = (value: number) => {
    if (value <= 50) return "rgba(0, 176, 80, 0.7)";   // Green
    if (value <= 100) return "rgba(255, 255, 0, 0.7)"; // Yellow
    if (value <= 150) return "rgba(255, 165, 0, 0.7)"; // Orange
    if (value <= 200) return "rgba(255, 0, 0, 0.7)";   // Red
    if (value <= 300) return "rgba(128, 0, 128, 0.7)"; // Purple
    return "rgba(64, 64, 64, 0.7)";                    // Dark
};

// AQI Legend data
const AQI_LEGEND = [
    { label: "Good (0-50)", color: "rgba(0,176,80,0.7)" },
    { label: "Moderate (51-100)", color: "rgba(255,255,0,0.7)" },
    { label: "Unhealthy for SG (101-150)", color: "rgba(255,165,0,0.7)" },
    { label: "Unhealthy (151-200)", color: "rgba(255,0,0,0.7)" },
    { label: "Very Unhealthy (201-300)", color: "rgba(128,0,128,0.7)" },
    { label: "Hazardous (300+)", color: "rgba(64,64,64,0.7)" },
];

const PollutantChart: React.FC<Props> = ({ title, records }) => {
    const labels = records.map((d: any) => d.day);
    const values = records.map((d: any) => d.avg);

    const barColors = values.map((v: number) => getAQIColor(v));

    const data = {
        labels,
        datasets: [
            {
                type: "bar" as const,
                data: values,
                backgroundColor: barColors,
                borderColor: barColors.map((c:any) => c.replace("0.7", "1")),
                borderWidth: 1,
            },
            {
                type: "line" as const,
                data: values,
                borderColor: "#2C3E50",
                tension: 0.3,
                borderWidth: 2,
                pointRadius: 3,
                fill: false,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } },
    };

    return (
        <div
            style={{
                background: "#fff",
                padding: 20,
                borderRadius: 12,
                marginTop: 20,
                boxShadow: "0px 4px 20px rgba(0,0,0,0.05)",
            }}
        >
            <h3 style={{ marginBottom: 10 }}>{title}</h3>

            <Chart type="bar" data={data} options={options} />

            {/* --- AQI COLOR LEGEND --- */}
            <div style={{ marginTop: 20 }}>
                <h4 style={{ marginBottom: 10, fontWeight: 600 }}>AQI Levels</h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 15 }}>
                    {AQI_LEGEND.map((item) => (
                        <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div
                                style={{
                                    width: 16,
                                    height: 16,
                                    borderRadius: 4,
                                    background: item.color,
                                }}
                            ></div>
                            <span style={{ fontSize: 14 }}>{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PollutantChart;
