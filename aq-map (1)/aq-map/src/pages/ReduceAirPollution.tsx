import React from "react";
import { motion } from "framer-motion";

// 🌿 Actionable Tips
const tips = [
    {
        title: "🚶‍♂️ Use Public Transport or Walk",
        desc: "Reduce private vehicle use — walk, cycle, or use public transit to lower emissions.",
        color: "#56ab2f",
    },
    {
        title: "🌳 Plant More Trees",
        desc: "Trees absorb carbon dioxide and pollutants, improving air quality naturally.",
        color: "#2E8B57",
    },
    {
        title: "⚡ Save Energy at Home",
        desc: "Switch off lights, fans, and appliances when not needed. Use renewable power sources.",
        color: "#4682B4",
    },
    {
        title: "🚗 Maintain Your Vehicle",
        desc: "Regular vehicle maintenance ensures cleaner fuel combustion and lower emissions.",
        color: "#FF8C00",
    },
    {
        title: "🚯 Avoid Open Burning",
        desc: "Avoid burning leaves, waste, or plastic — this releases toxic gases into the air.",
        color: "#B22222",
    },
];

// 💨 Health Recommendations by AQI
const healthGuidelines = [
    {
        level: "Good (0–50)",
        color: "#009966",
        message: "Air quality is satisfactory, and air pollution poses little or no risk.",
        advice: ["Enjoy outdoor activities.", "Keep promoting eco-friendly habits."],
    },
    {
        level: "Moderate (51–100)",
        color: "#ffde33",
        message: "Air quality is acceptable; some pollutants may be a concern for sensitive groups.",
        advice: [
            "Limit prolonged outdoor exposure if sensitive.",
            "Encourage carpooling to reduce emissions.",
        ],
    },
    {
        level: "Unhealthy for Sensitive Groups (101–150)",
        color: "#ff9933",
        message: "Sensitive individuals (children, elderly) may experience health effects.",
        advice: [
            "Avoid heavy outdoor activity.",
            "Use air purifiers indoors.",
            "Wear masks if pollution persists.",
        ],
    },
    {
        level: "Unhealthy (151–200)",
        color: "#cc0033",
        message: "Everyone may experience some adverse effects; sensitive groups more serious.",
        advice: [
            "Limit outdoor activities.",
            "Close windows to prevent indoor air contamination.",
            "Use public transport instead of private vehicles.",
        ],
    },
    {
        level: "Very Unhealthy (201–300)",
        color: "#660099",
        message: "Health warnings of emergency conditions. The entire population may be affected.",
        advice: [
            "Stay indoors with clean air filters.",
            "Avoid strenuous activity.",
            "Follow local health advisories.",
        ],
    },
    {
        level: "Hazardous (300+)",
        color: "#7e0023",
        message: "Serious health effects expected for everyone.",
        advice: [
            "Avoid going outdoors.",
            "Use N95 or P100 masks if necessary.",
            "Stay updated with air quality alerts.",
        ],
    },
];

const ReduceAirPollution: React.FC = () => {
    return (
        <div
            style={{
                padding: "2rem",
                background: "linear-gradient(to bottom, #f0fdf4, #e8f5e9)",
                minHeight: "100vh",
                fontFamily: "'Titillium Web', sans-serif",
            }}
        >
            {/* Header */}
            <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                style={{
                    textAlign: "center",
                    color: "#2e7d32",
                    fontSize: "2rem",
                    marginBottom: "1rem",
                }}
            >
                🌍 How to Reduce Air Pollution
            </motion.h1>

            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                style={{
                    textAlign: "center",
                    color: "#444",
                    maxWidth: "700px",
                    margin: "0 auto 2rem auto",
                    lineHeight: 1.6,
                }}
            >
                Everyone has a role to play in improving air quality. Whether it’s through
                lifestyle choices, sustainable business practices, or policy support —
                small actions can lead to a cleaner, healthier planet.
            </motion.p>

            {/* 🌿 Tips Grid */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "1.5rem",
                }}
            >
                {tips.map((tip, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                        style={{
                            background: "white",
                            borderRadius: "12px",
                            boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                            padding: "1.2rem",
                            borderTop: `6px solid ${tip.color}`,
                        }}
                    >
                        <h3 style={{ color: tip.color, marginBottom: ".5rem" }}>{tip.title}</h3>
                        <p style={{ color: "#555", fontSize: "0.95rem", lineHeight: 1.6 }}>
                            {tip.desc}
                        </p>
                    </motion.div>
                ))}
            </div>

            {/* 💬 Health Guidelines */}
            <motion.h2
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                style={{
                    textAlign: "center",
                    marginTop: "3rem",
                    color: "#1b5e20",
                    fontSize: "1.8rem",
                }}
            >
                💬 Health Recommendations by AQI Level
            </motion.h2>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "1.5rem",
                    marginTop: "1.5rem",
                }}
            >
                {healthGuidelines.map((level, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                        style={{
                            background: "white",
                            borderLeft: `6px solid ${level.color}`,
                            borderRadius: "10px",
                            padding: "1.2rem",
                            boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                        }}
                    >
                        <h4 style={{ color: level.color, marginBottom: ".5rem" }}>{level.level}</h4>
                        <p style={{ color: "#333", fontSize: "0.9rem" }}>{level.message}</p>
                        <ul style={{ marginTop: "0.5rem", paddingLeft: "1.2rem" }}>
                            {level.advice.map((a, i) => (
                                <li key={i} style={{ fontSize: "0.9rem", color: "#555" }}>
                                    {a}
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                ))}
            </div>

            {/* Footer Note */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                style={{
                    marginTop: "3rem",
                    textAlign: "center",
                    color: "#1b5e20",
                    fontWeight: 500,
                }}
            >
                Together, we can make the air cleaner and the planet greener. 🌿
            </motion.div>
        </div>
    );
};

export default ReduceAirPollution;
