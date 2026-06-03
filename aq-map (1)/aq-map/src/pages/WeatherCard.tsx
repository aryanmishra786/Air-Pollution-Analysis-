import React from "react";

type PropsCard = {
    label: any;
    value: any;
};
const WeatherCard : React.FC<PropsCard> = ({ label, value }) => {
    return (
        <div
            style={{
                background: "#fff",
                padding: 20,
                borderRadius: 12,
                boxShadow: "0px 4px 20px rgba(0,0,0,0.08)",
                textAlign: "center",
            }}
        >
            <div style={{ fontSize: 14, color: "#555" }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: "bold" }}>{value}</div>
        </div>
    );
}
export default WeatherCard;