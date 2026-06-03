import WeatherCard from "./WeatherCard.tsx";
import React from "react";

type Props = {
    temp: any;
    humidity: any;
    pressure:any;
    wind:any;
};
const WeatherGrid : React.FC<Props> = ({ temp, humidity, pressure, wind }) => {
    return (
        <div style={{ marginTop: 40 }}>
            <h2>Weather Information</h2>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                    gap: 20,
                    marginTop: 15,
                }}
            >
                <WeatherCard label="Temperature" value={`${temp ?? "-"}°C`} />
                <WeatherCard label="Humidity" value={`${humidity ?? "-"}%`} />
                <WeatherCard label="Pressure" value={`${pressure ?? "-"} hPa`} />
                <WeatherCard label="Wind" value={`${wind ?? "-"} m/s`} />
            </div>
        </div>
    );
}
export default WeatherGrid;

