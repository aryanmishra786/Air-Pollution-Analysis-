import React from "react";

type Props = {
    aqi: number;
    city: string;
    updated?: string;
    temp:any;// 🔹 Optional: auto-refresh interval
};
const AQICard : React.FC<Props>  = ({ aqi, city, updated, temp })=> {
    const getLevel = (aqi:number) => {
        if (aqi <= 50) return "Good";
        if (aqi <= 100) return "Moderate";
        if (aqi <= 150) return "Unhealthy for Sensitive Groups";
        if (aqi <= 200) return "Unhealthy";
        if (aqi <= 300) return "Very Unhealthy";
        return "Hazardous";
    };

    return (
        <div
            style={{
                background: "#fff",
                padding: 25,
                borderRadius: 15,
                boxShadow: "0px 4px 20px rgba(0,0,0,0.08)",
            }}
        >
            <h2>{city}</h2>

            <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
                <div style={{ fontSize: 90, fontWeight: "bold", color: "#222" }}>
                    {aqi}
                </div>

                <div>
                    <div style={{ fontSize: 32, fontWeight: 600, color: "#e7a400" }}>
                        {getLevel(aqi)}
                    </div>
                    <div>Updated: {updated}</div>
                    <div>Temp: {temp ?? "-"}°C</div>
                </div>
            </div>
        </div>
    );
}
export default AQICard;
