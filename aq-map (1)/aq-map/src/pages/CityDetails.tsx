import axios from "axios";
import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AQICard from "./AQICard";
import PollutantChart from "./PollutantChart";
import WeatherGrid from "./WeatherGrid";

interface IAQIItem {
    v: number;
}

interface ForecastRecord {
    day: string;
    avg: number;
    min: number;
    max: number;
}

interface ForecastDaily {
    [key: string]: ForecastRecord[];
}

interface AQIData {
    aqi: number;
    city: {
        name: string;
    };
    time: {
        s: string;
    };
    iaqi: {
        t?: IAQIItem;
        h?: IAQIItem;
        p?: IAQIItem;
        w?: IAQIItem;
        [key: string]: IAQIItem | undefined;
    };
    forecast: {
        daily: ForecastDaily;
    };
}



const CityDetails : React.FC =  ()=> {
    const { cityName,latitude, longitude} = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState<AQIData | null>(null);

    useEffect(() => {
        const loadAQI = async () => {
            const res = await axios.get(`https://api.waqi.info/feed/geo:${latitude};${longitude}/?token=ea3137a2f00c51d428823556788e96b5a2ca2d40`);
            setData(res.data.data);
        };
        loadAQI();
    }, [cityName]);

    if (!data) return <h3 style={{ padding: 20 }}>Loading...</h3>;

    return (
        <div style={{ padding: 10, maxWidth: 900, margin: "0 auto" }}>
            <button
                onClick={() => navigate("/dashboard")}
                style={{
                    padding: "8px 16px",
                    background: "#198754",
                    border: "none",
                    borderRadius: "6px",
                    color: "#fff",
                    cursor: "pointer",
                    marginBottom: "20px",
                    marginLeft: "0px",      // 👈 ensures it's aligned left
                }}
            >
                ← Back to Dashboard
            </button>
            <AQICard
                aqi={data.aqi}
                city={data.city.name}
                updated={data.time.s}
                temp={data.iaqi.t?.v.toFixed(2)}
            />

            {/* POLLUTANTS */}
            <h2 style={{ marginTop: 40 }}>Air Pollutants</h2>

            {Object.keys(data.forecast.daily).map((key) => {
                const item = data.forecast.daily[key];
                return (
                    <PollutantChart
                        key={key}
                        title={key.toUpperCase()}
                        records={item}
                    />
                );
            })}

            <WeatherGrid
                temp={data.iaqi.t?.v.toFixed(2)}
                humidity={data.iaqi.h?.v.toFixed(2)}
                pressure={data.iaqi.p?.v.toFixed(2)}
                wind={data.iaqi.w?.v.toFixed(2)}
            />
            {/*<AQIDashboard rawData={rawData} />*/}

        </div>
    );
}

export default CityDetails;
