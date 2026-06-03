import React from "react";

interface AQIGaugeProps {
    aqi: number;
}



const AQIGauge: React.FC<AQIGaugeProps> = ({ aqi }) => {
    const clampedAQI = Math.min(500, Math.max(0, aqi));
    const angle = (clampedAQI / 500) * 180 - 90; // Map 0–500 AQI to -90°–+90°

    const segments = [
        { color: "#00e400", range: [0, 50], label: "Good" },
        { color: "#ffff00", range: [51, 100], label: "Moderate" },
        { color: "#ff7e00", range: [101, 150], label: "Unhealthy (Sensitive)" },
        { color: "#ff0000", range: [151, 200], label: "Unhealthy" },
        { color: "#8f3f97", range: [201, 300], label: "Very Unhealthy" },
        { color: "#7e0023", range: [301, 500], label: "Hazardous" },
    ];

    return (
        <div style={{ textAlign: "center", width: "320px", margin: "auto" }}>
            <svg viewBox="0 0 200 120" width="100%">
                {/* Gauge segments */}
                {segments.map((seg, i) => {
                    const startAngle = (-90 + (seg.range[0] / 500) * 180) * (Math.PI / 180);
                    const endAngle = (-90 + (seg.range[1] / 500) * 180) * (Math.PI / 180);
                    const x1 = 100 + 80 * Math.cos(startAngle);
                    const y1 = 100 + 80 * Math.sin(startAngle);
                    const x2 = 100 + 80 * Math.cos(endAngle);
                    const y2 = 100 + 80 * Math.sin(endAngle);
                    return (
                        <path
                            key={i}
                            d={`M${x1},${y1} A80,80 0 0,1 ${x2},${y2}`}
                            stroke={seg.color}
                            strokeWidth="15"
                            fill="none"
                        />
                    );
                })}

                {/* Needle */}
                <line
                    x1="100"
                    y1="100"
                    x2={100 + 70 * Math.cos((angle * Math.PI) / 180)}
                    y2={100 + 70 * Math.sin((angle * Math.PI) / 180)}
                    stroke="#222"
                    strokeWidth="3"
                />
                <circle cx="100" cy="100" r="5" fill="#222" />

                {/* Labels */}
                {/*<text x="100" y="115" textAnchor="middle" fontSize="12" fill="#333">*/}
                {/*    AQI: {aqi}*/}
                {/*</text>*/}

            </svg>

            {/* Legend */}
            <div style={{ marginTop: "1rem", fontSize: "12px" }}>
                {segments.map((seg) => (
                    <div key={seg.label} style={{ display: "inline-block", margin: "0 6px" }}>
            <span
                style={{
                    background: seg.color,
                    display: "inline-block",
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    marginRight: 4,
                }}
            />
                        {seg.label}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AQIGauge;
