// src/components/AirMapDashboard.tsx
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement,
    Tooltip,
    Legend as ChartLegend,
} from "chart.js";


ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, ChartLegend);

interface AQIStation {
    name: string;
    lat: number;
    lon: number;
    aqi: number;
}

const token = "ea3137a2f00c51d428823556788e96b5a2ca2d40";

const getAQIColor = (aqi: number) => {
    if (aqi <= 50) return "#009966";
    if (aqi <= 100) return "#ffde33";
    if (aqi <= 150) return "#ff9933";
    if (aqi <= 200) return "#cc0033";
    if (aqi <= 300) return "#660099";
    return "#7e0023";
};

const getAQIStatus = (aqi: number) => {
    if (aqi <= 50) return "Good";
    if (aqi <= 100) return "Moderate";
    if (aqi <= 150) return "Unhealthy for Sensitive";
    if (aqi <= 200) return "Unhealthy";
    if (aqi <= 300) return "Very Unhealthy";
    return "Hazardous";
};

const sampleCities = [
    "Delhi",
    "Mumbai",
    "Beijing",
    "Tokyo",
    "New York",
    "London",
    "Paris",
    "Sydney",
    "Dubai",
    "Los Angeles",
    "Seoul",
    "Mexico City",
    "Jakarta",
    "Moscow",
    "Cairo",
];

const AirMapDashboard = () => {
    const mapContainer = useRef<HTMLDivElement | null>(null);
    const map = useRef<maplibregl.Map | null>(null);
    const markers = useRef<maplibregl.Marker[]>([]);
    const userMarkerRef = useRef<maplibregl.Marker | null>(null);

    const [stations, setStations] = useState<AQIStation[]>([]);
    const [searchCity, setSearchCity] = useState("");
    const [selectedCity, setSelectedCity] = useState<AQIStation | null>(null);
    const [, setCurrentCity] = useState<AQIStation | null>(null);
    const [chartData, _setChartData] = useState<any | null>(null);
    const navigate = useNavigate();
    // Init map
    useEffect(() => {
        if (!mapContainer.current) return;

        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: "https://api.maptiler.com/maps/basic-v2/style.json?key=WEw9RspHHowuuGmmq11m",
            center: [78.9629, 20.5937],
            zoom: 3,
        });

        map.current.addControl(new maplibregl.NavigationControl(), "top-right");

        // fetch sample cities and markers
        fetchGlobalData(sampleCities);

        // ask for location and show user
        showCurrentLocation();

        return () => {
            // cleanup markers & map
            markers.current.forEach((m) => m.remove());
            userMarkerRef.current?.remove();
            map.current?.remove();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Fetch global data (sample)
    const fetchGlobalData = async (cities: string[]) => {
        try {
            const responses = await Promise.all(
                cities.map((c) => axios.get(`https://api.waqi.info/feed/${c}/?token=${token}`).catch(() => null))
            );

            const results: AQIStation[] = [];
            for (const res of responses) {
                if (!res || res.data?.status !== "ok") continue;
                const d = res.data.data;
                if (d && d.city?.geo) {
                    results.push({
                        name: d.city.name,
                        lat: d.city.geo[0],
                        lon: d.city.geo[1],
                        aqi: Number(d.aqi),
                    });
                }
            }
            setStations(results);
            renderMarkers(results);
        } catch (err) {
            console.error("fetchGlobalData error", err);
        }
    };

    // Show / fetch the current location's AQI and place user marker
    const showCurrentLocation = () => {
        if (!("geolocation" in navigator)) return console.warn("Geolocation unsupported");
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;

                // get WAQI feed by coordinates
                try {
                    const res = await axios.get(`https://api.waqi.info/feed/geo:${lat};${lon}/?token=${token}`);
                    if (res.data?.status === "ok") {
                        const d = res.data.data;
                        const city: AQIStation = {
                            name: d.city?.name || "Current Location",
                            aqi: Number(d.aqi),
                            lat: Number(d.city.geo[0]),
                            lon: Number(d.city.geo[1]),
                        };
                        setCurrentCity(city);
                        setSelectedCity(city);
                        // add user marker (special style)
                        placeUserMarker(lat, lon, city);
                        // fetch history for chart (non-blocking)
                        //fetchCityHistory(city.name);
                        // pan map to user
                        map.current?.flyTo({ center: [lon, lat], zoom: 9 });
                    } else {
                        // still place a user marker even if WAQI has no data
                        placeUserMarker(lat, lon, null);
                        map.current?.flyTo({ center: [lon, lat], zoom: 9 });
                    }
                } catch (err) {
                    console.warn("Error fetching WAQI for coordinates", err);
                    placeUserMarker(lat, lon, null);
                }
            },
            (err) => console.warn("Geolocation error:", err),
            { enableHighAccuracy: true }
        );
    };

    // place user marker (blue pulsing)
    const placeUserMarker = (lat: number, lon: number, city: AQIStation | null) => {
        // remove old user marker
        userMarkerRef.current?.remove();

        const el = document.createElement("div");
        el.style.position = "relative";
        el.style.width = "18px";
        el.style.height = "18px";
        el.style.borderRadius = "50%";
        el.style.background = "rgba(10,102,255,0.95)";
        el.style.border = "2px solid #fff";
        el.style.boxShadow = "0 0 8px rgba(10,102,255,0.6)";

        // pulse
        // const pulse = document.createElement("div");
        // pulse.style.position = "absolute";
        // pulse.style.left = "-9px";
        // pulse.style.top = "-9px";
        // pulse.style.width = "36px";
        // pulse.style.height = "36px";
        // pulse.style.borderRadius = "50%";
        // pulse.style.background = "rgba(10,102,255,0.18)";
        // pulse.style.animation = "waqi-pulse 2s infinite";
        // el.appendChild(pulse);

        // add small label popup content if city provided
        const popupHtml = city
            ? `<div style="font-family:sans-serif;">
           <b>${city.name}</b><br> AQI: <b style="color:${getAQIColor(city.aqi)}">${city.aqi}</b>
         </div>`
            : `<div style="font-family:sans-serif;"><b>{city.name}</b></div>`;

        const marker = new maplibregl.Marker({ element: el })
            .setLngLat([lon, lat])
            .setPopup(new maplibregl.Popup({ offset: 12 }).setHTML(popupHtml))
            .addTo(map.current!);

        userMarkerRef.current = marker;
    };

    // Render markers for stations (colored markers)
    const renderMarkers = (data: AQIStation[]) => {
        if (!map.current) return;
        // remove old markers
        markers.current.forEach((m) => m.remove());
        markers.current = [];

        data.forEach((s) => {
            const el = document.createElement("div");
            el.style.width = "18px";
            el.style.height = "18px";
            el.style.borderRadius = "50%";
            el.style.background = getAQIColor(Number(s.aqi));
            el.style.border = "2px solid white";
            el.style.boxShadow = "0 0 8px rgba(0,0,0,0.25)";
            el.style.cursor = "pointer";

            // popup
            const popupHtml = `
        <div style="font-family:'Titillium Web',sans-serif; width:220px;">
          <div style="background:${getAQIColor(s.aqi)}; color:#fff; padding:8px 10px; font-weight:600;">
            ${s.name}
          </div>
          <div style="padding:10px; color:#222;">
            AQI: <b style="color:${getAQIColor(s.aqi)}">${s.aqi}</b><br/>
            Status: ${getAQIStatus(s.aqi)}
          </div>
        </div>`;

            const marker = new maplibregl.Marker({ element: el })
                .setLngLat([s.lon, s.lat])
                .setPopup(new maplibregl.Popup({ offset: 12 }).setHTML(popupHtml))
                .addTo(map.current!);

            // clicking marker selects it
            el.addEventListener("click", () => {
                setSelectedCity(s);
                //fetchCityHistory(s.name);
            });

            markers.current.push(marker);
        });
    };

    // Fetch historical or forecasted data for chart (uses WAQI forecast.daily.pm25 if present)
    // const fetchCityHistory = async (cityName: string) => {
    //     try {
    //         const res = await axios.get(`https://api.waqi.info/feed/${encodeURIComponent(cityName)}/?token=${token}`);
    //         if (res.data?.status === "ok") {
    //             const history = res.data.data.forecast?.daily?.pm25 || [];
    //             // if no daily pm25 fallback to empty
    //             const labels = history.map((d: any) => d.day);
    //             const values = history.map((d: any) => d.avg);
    //             if (labels.length && values.length) {
    //                 setChartData({
    //                     labels,
    //                     datasets: [
    //                         {
    //                             label: `PM2.5 (daily avg) - ${cityName}`,
    //                             data: values,
    //                             borderColor: getAQIColor(values[values.length - 1] ?? 0),
    //                             backgroundColor: "rgba(0,0,0,0)",
    //                             tension: 0.3,
    //                         },
    //                     ],
    //                 });
    //             } else {
    //                 // no history -> clear chart
    //                 setChartData(null);
    //             }
    //         } else {
    //             setChartData(null);
    //         }
    //     } catch (err) {
    //         console.warn("fetchCityHistory error", err);
    //         setChartData(null);
    //     }
    // };

    // Search handler (city)
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchCity.trim()) return;
        try {
            const res = await axios.get(`https://api.waqi.info/feed/${encodeURIComponent(searchCity)}/?token=${token}`);
            if (res.data?.status === "ok") {
                const d = res.data.data;
                const city: AQIStation = {
                    name: d.city.name,
                    aqi: Number(d.aqi),
                    lat: Number(d.city.geo[0]),
                    lon: Number(d.city.geo[1]),
                };
                setSelectedCity(city);
                setStations((p) => {
                    // keep existing markers but add this searched city as single-focus
                    // optionally we could push into stations list; here we show single result
                    return [city, ...p.filter((s) => s.name !== city.name)];
                });
                map.current?.flyTo({ center: [city.lon, city.lat], zoom: 8 });
                //fetchCityHistory(city.name);
            } else {
                alert("City not found or no data available.");
            }
        } catch {
            alert("Error fetching AQI for " + searchCity);
        }
    };

    // derive top lists
    const sortedStations = [...stations].filter((s) => Number.isFinite(s.aqi)).sort((a, b) => a.aqi - b.aqi);
    const topCleanest = sortedStations.slice(0, 5);
    const topPolluted = [...sortedStations].slice(-5).reverse();

    return (
        <div  style={{
            position: "relative",
            width: "100%",
            height: "calc(100vh - 160px)",
            fontFamily: "'Titillium Web', sans-serif",
            overflow: "hidden",
        }}>
            {/* Map */}
            <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />

            {/* Search bar (top center) */}
            <form
                onSubmit={handleSearch}
                style={{
                    position: "absolute",
                    top: 14,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "rgba(255,255,255,0.95)",
                    padding: "8px 12px",
                    borderRadius: 10,
                    display: "flex",
                    gap: 8,
                    zIndex: 2200,
                    boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
                    width: "min(92vw, 640px)",
                }}
            >
                <input
                    type="text"
                    placeholder="Search city..."
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                    style={{
                        flex: 1,
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: "1px solid #ddd",
                        outline: "none",
                        textTransform: "capitalize",
                        fontSize: 14,
                    }}
                />
                <button
                    type="submit"
                    style={{
                        borderRadius: 8,
                        border: "none",
                        background: "#009966",
                        color: "#fff",
                        padding: "8px 12px",
                        cursor: "pointer",
                        fontWeight: 600,
                    }}
                >
                    Search
                </button>
            </form>

            {/* Selected City Panel (bottom-left) */}
            <AnimatePresence>
                {selectedCity && (
                    <motion.div
                        key="selected"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={()=>{
                            navigate("/city/"+selectedCity?.name+"/"+selectedCity?.lat+"/"+selectedCity?.lon);
                        }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.3 }}
                        style={{
                            position: "absolute",
                            bottom: 14,
                            cursor: "pointer",
                            left: 14,
                            zIndex: 2100,
                            background: "rgba(255,255,255,0.96)",
                            padding: "12px 14px",
                            borderRadius: 10,
                            minWidth: 200,
                            boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
                            borderLeft: `6px solid ${getAQIColor(selectedCity.aqi)}`,
                        }}
                    >
                        <div style={{ fontWeight: 700 }}>{selectedCity.name}</div>
                        <div style={{ marginTop: 6 }}>
                            AQI: <b style={{ color: getAQIColor(selectedCity.aqi) }}>{selectedCity.aqi}</b>
                        </div>
                        <div style={{ marginTop: 4, color: "#444" }}>{getAQIStatus(selectedCity.aqi)}</div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Legend (bottom-right) */}
            {/* Legend (bottom-right) */}
            <div
                style={{
                    position: "absolute",
                    bottom: 14,
                    right: 14,
                    zIndex: 2100,
                    background: "rgba(255,255,255,0.96)",
                    padding: "12px",
                    borderRadius: 10,
                    boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
                    minWidth: 160,
                }}
            >
                <div style={{ fontWeight: 700, marginBottom: 8 }}>AQI Legend</div>
                {[
                    { color: "#009966", label: "Good (0–50)" },
                    { color: "#ffde33", label: "Moderate (51–100)" },
                    { color: "#ff9933", label: "Unhealthy Sensitive (101–150)" },
                    { color: "#cc0033", label: "Unhealthy (151–200)" },
                    { color: "#660099", label: "Very Unhealthy (201–300)" },
                    { color: "#7e0023", label: "Hazardous (301+)" },
                ].map((it) => (
                    <div key={it.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <div style={{ width: 14, height: 14, borderRadius: 3, background: it.color, border: "1px solid #ccc" }} />
                        <div style={{ fontSize: 13 }}>{it.label}</div>
                    </div>
                ))}
            </div>




            {/* Top 5 Cleanest & Polluted (fixed left-aligned) */}
            <div
                style={{
                    position: "absolute",
                    top: 80,
                    left: 12, // stay at left
                    zIndex: 2100,
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: 20,
                }}
            >
                {/* Cleanest Box */}
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{
                        background: "rgba(255,255,255,0.97)",
                        padding: 12,
                        borderRadius: 10,
                        width: 260,
                        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                    }}
                >
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>🌿 Top 5 Cleanest</div>
                    {topCleanest.length ? (
                        topCleanest.map((c) => (
                            <div
                                key={c.name}
                                onClick={() => {
                                    map.current?.flyTo({ center: [c.lon, c.lat], zoom: 7 });
                                    setSelectedCity(c);
                                    navigate("/city/"+c?.name+"/"+c?.lat+"/"+c?.lon);
                                }}
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: "8px",
                                    marginBottom: 6,
                                    borderRadius: 6,
                                    background: "#fafafa",
                                    cursor: "pointer",
                                    borderLeft: `6px solid ${getAQIColor(c.aqi)}`,
                                }}
                            >
                                <div style={{ fontWeight: 600 }}>{c.name}</div>
                                <div style={{ color: getAQIColor(c.aqi), fontWeight: 700 }}>
                                    {c.aqi}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ color: "#666" }}>Loading...</div>
                    )}
                </motion.div>

                {/* Polluted Box */}
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    style={{
                        background: "rgba(255,255,255,0.97)",
                        padding: 12,
                        borderRadius: 10,
                        width: 260,
                        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                    }}
                >
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>🔥 Top 5 Polluted</div>
                    {topPolluted.length ? (
                        topPolluted.map((c) => (
                            <div
                                key={c.name}
                                onClick={() => {
                                    map.current?.flyTo({ center: [c.lon, c.lat], zoom: 7 });
                                    setSelectedCity(c);
                                    navigate("/city/"+c?.name+"/"+c?.lat+"/"+c?.lon);
                                }}
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: "8px",
                                    marginBottom: 6,
                                    borderRadius: 6,
                                    background: "#fafafa",
                                    cursor: "pointer",
                                    borderLeft: `6px solid ${getAQIColor(c.aqi)}`,
                                }}
                            >
                                <div style={{ fontWeight: 600 }}>{c.name}</div>
                                <div style={{ color: getAQIColor(c.aqi), fontWeight: 700 }}>
                                    {c.aqi}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ color: "#666" }}>Loading...</div>
                    )}
                </motion.div>
            </div>


            {/* Chart panel (floating above map, center bottom) */}
            {chartData && (
                <div
                    style={{
                        position: "absolute",
                        left: "50%",
                        transform: "translateX(-50%)",
                        bottom: 120,
                        zIndex: 2100,
                        width: "min(92vw, 900px)",
                        background: "rgba(255,255,255,0.98)",
                        padding: 12,
                        borderRadius: 10,
                        boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
                    }}
                >
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>{chartData.datasets[0].label}</div>
                    <Line data={chartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
                </div>
            )}

            {/* small CSS for pulse animation */}
            <style>{`
        @keyframes waqi-pulse {
          0% { transform: scale(0.6); opacity: 0.6; }
          50% { transform: scale(1); opacity: 0.2; }
          100% { transform: scale(1.4); opacity: 0; }
        }
      `}</style>
        </div>
    );
};

export default AirMapDashboard;
