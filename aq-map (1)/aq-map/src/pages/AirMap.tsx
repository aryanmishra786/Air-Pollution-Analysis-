// src/components/AirMap.tsx
// import { useEffect, useRef } from "react";
// import maplibregl, {Marker} from "maplibre-gl";
// import "maplibre-gl/dist/maplibre-gl.css";
//
// const AirMap = () => {
//     const mapContainer = useRef<HTMLDivElement | null>(null);
//     const map = useRef<maplibregl.Map | null>(null);
//
//     useEffect(() => {
//         if (!mapContainer.current) return;
//
//         // Initialize map
//         map.current = new maplibregl.Map({
//             container: mapContainer.current,
//             style: "https://api.maptiler.com/maps/basic-v2/style.json?key=WEw9RspHHowuuGmmq11m", // free MapLibre tiles
//             center: [77.5946, 12.9716], // Bengaluru [lng, lat]
//             zoom: 1,
//         });
//
//         // Optional: Add navigation controls
//         map.current.addControl(new maplibregl.NavigationControl(), "top-right");
//
//         // Example marker (you can replace with AQI data later)
//         const marker:Marker = new maplibregl.Marker({ color: "red" })
//             .setLngLat([77.5946, 12.9716])
//             .setPopup(new maplibregl.Popup().setHTML("<b>Bengaluru</b><br>AQI: 84"))
//             .addTo(map.current);
//
//         return () => {
//             map.current?.remove();
//         };
//     }, []);
//
//     return (
//         <div
//             ref={mapContainer}
//             style={{ width: "100%", height: "100vh", borderRadius: "8px" }}
//         />
//     );
// };
//
// export default AirMap;

//v2
// import { useEffect, useRef, useState } from "react";
// import maplibregl from "maplibre-gl";
// import axios from "axios";
// import "maplibre-gl/dist/maplibre-gl.css";
//
// interface AQIStation {
//     name: string;
//     lat: number;
//     lon: number;
//     aqi: number;
// }
//
// const AQ_TOKEN = "ea3137a2f00c51d428823556788e96b5a2ca2d40"; // 🔑 get from https://aqicn.org/api/
//
// const AirMap = () => {
//     const mapContainer = useRef<HTMLDivElement | null>(null);
//     const map = useRef<maplibregl.Map | null>(null);
//     const [stations, setStations] = useState<AQIStation[]>([]);
//
//     // Helper: AQI → color
//     const getAQIColor = (aqi: number) => {
//         if (aqi <= 50) return "#009966"; // Good
//         if (aqi <= 100) return "#ffde33"; // Moderate
//         if (aqi <= 150) return "#ff9933"; // Unhealthy for Sensitive
//         if (aqi <= 200) return "#cc0033"; // Unhealthy
//         if (aqi <= 300) return "#660099"; // Very Unhealthy
//         return "#7e0023"; // Hazardous
//     };
//
//     useEffect(() => {
//         if (!mapContainer.current) return;
//
//         map.current = new maplibregl.Map({
//             container: mapContainer.current,
//             // style: "https://demotiles.maplibre.org/style.json",
//             style:"https://api.maptiler.com/maps/basic-v2/style.json?key=WEw9RspHHowuuGmmq11m",
//             center: [77.5946, 12.9716], // Bengaluru
//             zoom: 4,
//
//         });
//
//         map.current.addControl(new maplibregl.NavigationControl(), "top-right");
//
//         // Fetch AQI data for major cities
//         const cities = ["Delhi", "Mumbai", "Bengaluru", "Chennai", "Kolkata", "Pune"];
//
//         const fetchAQI = async () => {
//             const results: AQIStation[] = [];
//             for (const city of cities) {
//                 try {
//                     const res = await axios.get(
//                         `https://api.waqi.info/feed/${city}/?token=${AQ_TOKEN}`
//                     );
//                     const d = res.data.data;
//                     if (d && d.city?.geo) {
//                         results.push({
//                             name: city,
//                             lat: d.city.geo[0],
//                             lon: d.city.geo[1],
//                             aqi: d.aqi,
//                         });
//                     }
//                 } catch (err) {
//                     console.error("Error fetching AQI for", city, err);
//                 }
//             }
//             setStations(results);
//         };
//
//         fetchAQI();
//
//         return () => map.current?.remove();
//     }, []);
//
//     // Add markers when stations change
//     useEffect(() => {
//         if (!map.current || stations.length === 0) return;
//
//         stations.forEach((s) => {
//             const color = getAQIColor(s.aqi);
//
//             const el = document.createElement("div");
//             el.style.backgroundColor = color;
//             el.style.width = "18px";
//             el.style.height = "18px";
//             el.style.borderRadius = "50%";
//             el.style.border = "2px solid white";
//             el.style.boxShadow = "0 0 5px rgba(0,0,0,0.3)";
//
//             new maplibregl.Marker(el)
//                 .setLngLat([s.lon, s.lat])
//                 .setPopup(
//                     new maplibregl.Popup().setHTML(
//                         `<b>${s.name}</b><br>AQI: ${s.aqi}<br><small>${s.aqi <= 50 ? "Good" : s.aqi <= 100 ? "Moderate" : "Poor"}</small>`
//                     )
//                 )
//                 .addTo(map.current!);
//         });
//     }, [stations]);
//
//     return (
//         <div style={{ position: "relative" }}>
//             <div
//                 ref={mapContainer}
//                 style={{
//                     position: "fixed",
//                     top: 0,
//                     left: 0,
//                     right: 0,
//                     bottom: 0,
//                     width: "100vw",
//                     height: "100vh",
//                 }}
//             />
//             {/* Legend */}
//             <div
//                 style={{
//                     position: "absolute",
//                     bottom: 10,
//                     right: 10,
//                     background: "rgba(255,255,255,0.9)",
//                     borderRadius: 8,
//                     padding: "8px 12px",
//                     fontSize: 12,
//                     boxShadow: "0 0 4px rgba(0,0,0,0.2)",
//                 }}
//             >
//                 <b>AQI Legend</b>
//                 <div style={{ display: "grid", gap: 4, marginTop: 4 }}>
//                     {[
//                         { color: "#009966", label: "Good (0–50)" },
//                         { color: "#ffde33", label: "Moderate (51–100)" },
//                         { color: "#ff9933", label: "Unhealthy for Sensitive (101–150)" },
//                         { color: "#cc0033", label: "Unhealthy (151–200)" },
//                         { color: "#660099", label: "Very Unhealthy (201–300)" },
//                         { color: "#7e0023", label: "Hazardous (301+)" },
//                     ].map((item) => (
//                         <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
//                             <div
//                                 style={{
//                                     background: item.color,
//                                     width: 14,
//                                     height: 14,
//                                     borderRadius: "50%",
//                                     border: "1px solid #666",
//                                 }}
//                             />
//                             {item.label}
//                         </div>
//                     ))}
//                 </div>
//             </div>
//         </div>
//     );
// };
//
// export default AirMap;

//v3
// import { useEffect, useRef, useState } from "react";
// import maplibregl from "maplibre-gl";
// import axios from "axios";
// import "maplibre-gl/dist/maplibre-gl.css";
//
// interface AQIStation {
//     name: string;
//     lat: number;
//     lon: number;
//     aqi: number;
// }
//
// const AirMap = () => {
//     const mapContainer = useRef<HTMLDivElement | null>(null);
//     const map = useRef<maplibregl.Map | null>(null);
//     const [stations, setStations] = useState<AQIStation[]>([]);
//     const markers = useRef<maplibregl.Marker[]>([]);
//     const token = "ea3137a2f00c51d428823556788e96b5a2ca2d40";
//
//     const getAQIColor = (aqi: number) => {
//         if (aqi <= 50) return "#009966";
//         if (aqi <= 100) return "#ffde33";
//         if (aqi <= 150) return "#ff9933";
//         if (aqi <= 200) return "#cc0033";
//         if (aqi <= 300) return "#660099";
//         return "#7e0023";
//     };
//
//     const fetchAQI = async () => {
//         const cities = [
//             "Delhi",
//             "Mumbai",
//             "Bengaluru",
//             "Chennai",
//             "Kolkata",
//             "Hyderabad",
//             "Ahmedabad",
//             "Pune",
//             "Jaipur",
//         ];
//
//         const results: AQIStation[] = [];
//
//         for (const city of cities) {
//             try {
//                 const res = await axios.get(
//                     `https://api.waqi.info/feed/${city}/?token=${token}`
//                 );
//                 const d = res.data.data;
//                 if (d && d.city?.geo) {
//                     results.push({
//                         name: city,
//                         lat: d.city.geo[0],
//                         lon: d.city.geo[1],
//                         aqi: d.aqi,
//                     });
//                 }
//             } catch (err) {
//                 console.error("Error fetching AQI for", city, err);
//             }
//         }
//
//         setStations(results);
//     };
//
//     useEffect(() => {
//         if (!mapContainer.current) return;
//
//         map.current = new maplibregl.Map({
//             container: mapContainer.current,
//             style: "https://demotiles.maplibre.org/style.json",
//             center: [78.9629, 20.5937], // India
//             zoom: 4.3,
//         });
//
//         map.current.addControl(new maplibregl.NavigationControl(), "top-right");
//
//         fetchAQI();
//
//         return () => {
//             map.current?.remove();
//         };
//     }, []);
//
//     useEffect(() => {
//         if (!map.current) return;
//
//         markers.current.forEach((m) => m.remove());
//         markers.current = [];
//
//         stations.forEach((s) => {
//             const color = getAQIColor(s.aqi);
//             const el = document.createElement("div");
//             el.style.backgroundColor = color;
//             el.style.width = "16px";
//             el.style.height = "16px";
//             el.style.borderRadius = "50%";
//             el.style.border = "2px solid white";
//
//             const marker = new maplibregl.Marker(el)
//                 .setLngLat([s.lon, s.lat])
//                 .setPopup(
//                     new maplibregl.Popup().setHTML(
//                         `<strong>${s.name}</strong><br/>AQI: <b>${s.aqi}</b>`
//                     )
//                 )
//                 .addTo(map.current!);
//
//             markers.current.push(marker);
//         });
//     }, [stations]);
//
//     return (
//         <div style={{ position: "relative" }}>
//             <div
//                 ref={mapContainer}
//                 style={{
//                     position: "fixed",
//                     top: 0,
//                     left: 0,
//                     right: 0,
//                     bottom: 0,
//                     width: "100vw",
//                     height: "100vh",
//                 }}
//             />
//             <div
//                 style={{
//                     position: "absolute",
//                     bottom: 10,
//                     right: 10,
//                     background: "rgba(255,255,255,0.9)",
//                     borderRadius: 8,
//                     padding: "8px 12px",
//                     fontSize: 12,
//                     boxShadow: "0 0 4px rgba(0,0,0,0.2)",
//                 }}
//             >
//                 <b>AQI Legend</b>
//                 <div style={{ marginTop: 4 }}>
//                     <div style={{ color: "#009966" }}>● Good (0–50)</div>
//                     <div style={{ color: "#ffde33" }}>● Moderate (51–100)</div>
//                     <div style={{ color: "#ff9933" }}>● Unhealthy-Sensitive (101–150)</div>
//                     <div style={{ color: "#cc0033" }}>● Unhealthy (151–200)</div>
//                     <div style={{ color: "#660099" }}>● Very Unhealthy (201–300)</div>
//                     <div style={{ color: "#7e0023" }}>● Hazardous (301+)</div>
//                 </div>
//             </div>
//         </div>
//     );
// };
//
// export default AirMap;

//v4

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import "maplibre-gl/dist/maplibre-gl.css";

interface AQIStation {
    name: string;
    lat: number;
    lon: number;
    aqi: number;
}

const AirMap = () => {
    const mapContainer = useRef<HTMLDivElement | null>(null);
    const map = useRef<maplibregl.Map | null>(null);
    const [stations, setStations] = useState<AQIStation[]>([]);
    const markers = useRef<maplibregl.Marker[]>([]);
    const [searchCity, setSearchCity] = useState("");
    const [selectedCity, setSelectedCity] = useState<AQIStation | null>(null);
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

    // const fetchAQI = async (cities: string[]) => {
    //     const results: AQIStation[] = [];
    //     for (const city of cities) {
    //         try {
    //             const res = await axios.get(`https://api.waqi.info/feed/${city}/?token=${token}`);
    //             const d = res.data.data;
    //             if (d && d.city?.geo) {
    //                 results.push({
    //                     name: city,
    //                     lat: d.city.geo[0],
    //                     lon: d.city.geo[1],
    //                     aqi: d.aqi,
    //                 });
    //             }
    //         } catch (err) {
    //             console.error("Error fetching AQI for", city, err);
    //         }
    //     }
    //     setStations(results);
    // };

    // Initialize Map
    useEffect(() => {
        if (!mapContainer.current) return;

        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style:
                "https://api.maptiler.com/maps/basic-v2/style.json?key=WEw9RspHHowuuGmmq11m",
            center: [78.9629, 20.5937],
            zoom: 4.3,
        });

        map.current.addControl(new maplibregl.NavigationControl(), "top-right");

        //fetchAQI(["Delhi", "Mumbai", "Bengaluru", "Chennai", "Kolkata", "Hyderabad", "Ahmedabad", "Pune", "Jaipur"]);

        return () => map.current?.remove();
    }, []);

    // Show user’s location
    useEffect(() => {
        if (!map.current) return;
        let userMarker: maplibregl.Marker | null = null;

        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    map.current!.flyTo({ center: [longitude, latitude], zoom: 10 });
                    fetchAQIByCoords(latitude, longitude);

                    const el = document.createElement("div");
                    el.style.width = "18px";
                    el.style.height = "18px";
                    el.style.borderRadius = "50%";
                    el.style.background = "rgba(0,120,255,0.9)";
                    el.style.boxShadow = "0 0 10px rgba(0,120,255,0.5)";
                    el.style.border = "2px solid white";

                    const pulse = document.createElement("div");
                    pulse.style.position = "absolute";
                    pulse.style.width = "30px";
                    pulse.style.height = "30px";
                    pulse.style.borderRadius = "50%";
                    pulse.style.background = "rgba(0,120,255,0.3)";
                    pulse.style.left = "-6px";
                    pulse.style.top = "-6px";
                    pulse.style.animation = "pulse 2s infinite";
                    el.appendChild(pulse);

                    userMarker = new maplibregl.Marker({ color: "#007bff" })
                        .setLngLat([longitude, latitude])
                        .setPopup(
                            new maplibregl.Popup({ offset: 15 }).setHTML(
                                `<b>Your Location</b><br>Lat: ${latitude.toFixed(
                                    4
                                )}, Lon: ${longitude.toFixed(4)}`
                            )
                        )
                        .addTo(map.current!);
                },
                (error) => console.warn("Geolocation error:", error),
                { enableHighAccuracy: true }
            );
        }

        // ✅ Safe cleanup
        return () => {
            if (userMarker) {
                userMarker.remove();
            }
        };
    }, [map]);

    // Update Markers
    useEffect(() => {
        if (!map.current) return;

        markers.current.forEach((m) => m.remove());
        markers.current = [];

        stations.forEach((s) => {
            const color = getAQIColor(Number(s.aqi));
            const el = document.createElement("div");
            el.style.width = "20px";
            el.style.height = "20px";
            el.style.borderRadius = "50%";
            el.style.border = "2px solid white";
            el.style.backgroundColor = color;
            el.style.boxShadow = "0 0 8px rgba(0,0,0,0.3)";
            el.style.cursor = "pointer";

            const popupHtml = `
        <div style="font-family: 'Titillium Web', sans-serif; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.2);">
          <div style="background:${color}; color:white; padding:6px 10px; font-weight:600;">
            ${s.name}
          </div>
          <div style="padding:8px 10px; color:#333; font-size:13px;">
            AQI: <b style="color:${color}">${s.aqi}</b><br/>
            Status: ${getAQIStatus(s.aqi)}
          </div>
        </div>`;

            const marker = new maplibregl.Marker({ color: getAQIColor(Number(s.aqi))})
                .setLngLat([s.lon, s.lat])
                .setPopup(new maplibregl.Popup({ offset: 20 }).setHTML(popupHtml))
                .addTo(map.current!);

            el.addEventListener("click", () => setSelectedCity(s));
            markers.current.push(marker);
        });
    }, [stations]);


    // Fetch AQI by coordinates
    const fetchAQIByCoords = async (lat: number, lon: number) => {
        try {
            const res = await axios.get(`https://api.waqi.info/feed/geo:${lat};${lon}/?token=${token}`);
           console.log(`https://api.waqi.info/feed/geo:${lat};${lon}/?token=${token}`)
            const data = await res.data;
            console.log(data)


            if (data.status == "ok") {
                setStations([{
                    name: data.data.city.name,
                    aqi:  data.data.aqi,
                    lat:  data.data.city.geo[0],
                    lon:  data.data.city.geo[1],
                }]);
                setSelectedCity({
                    name:  data.data.city.name,
                    aqi:  data.data.aqi,
                    lat:  data.data.city.geo[0],
                    lon:  data.data.city.geo[1],
                });
            } else {
                setSelectedCity({ name: "Unknown Location", aqi: -1,lat: 0,
                    lon:  0, });
            }
        } catch (err) {
            console.error("AQI fetch failed:", err);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchCity.trim()) return;
        try {
            const res = await axios.get(
                `https://api.waqi.info/feed/${searchCity}/?token=${token}`
            );
            const d = res.data.data;
            if (d && d.city?.geo) {
                const cityData = {
                    name: searchCity,
                    lat: d.city.geo[0],
                    lon: d.city.geo[1],
                    aqi: d.aqi,
                };
                setStations([cityData]);
                setSelectedCity(cityData);
                map.current?.flyTo({ center: [cityData.lon, cityData.lat], zoom: 8 });
            } else alert("City not found or no data available.");
        } catch {
            alert("Error fetching AQI for " + searchCity);
        }
    };

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "calc(100vh - 160px)",
                fontFamily: "'Titillium Web', sans-serif",
                overflow: "hidden",
            }}
        >
            {/* 🗺️ Map */}
            <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />

            {/* 🔍 Search Box */}
            <form
                onSubmit={handleSearch}
                style={{
                    position: "absolute",
                    top: "15px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "rgba(255,255,255,0.95)",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "6px",
                    justifyContent: "center",
                    width: "min(90vw, 600px)",
                    zIndex: 2000,
                }}
            >
                <input
                    type="text"
                    placeholder="Search city..."
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                    style={{
                        flex: "1 1 200px",
                        minWidth: "180px",
                        padding: "6px 10px",
                        textTransform: "capitalize",
                        borderRadius: "4px",
                        border: "1px solid #ccc",
                        outline: "none",
                        fontSize: "clamp(12px, 2vw, 14px)",
                    }}
                />
                <button
                    className={"bg-success text-white text-center"}
                    type="submit"
                    style={{
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        padding: "6px 12px",
                        cursor: "pointer",
                        fontSize: "clamp(12px, 2vw, 14px)",
                    }}
                >
                    Search
                </button>
            </form>

            {/* 🏙️ Selected City Info */}
            <AnimatePresence>
                {selectedCity && (
                    <motion.div
                        key="city-info"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.4 }}
                        style={{
                            position: "absolute",
                            bottom: "10px",
                            left: "10px",
                            background: "rgba(255,255,255,0.95)",
                            borderRadius: "8px",
                            padding: "10px",
                            fontSize: "clamp(12px, 2vw, 14px)",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                            zIndex: 2000,
                            borderLeft: `5px solid ${getAQIColor(selectedCity.aqi)}`,
                        }}
                    >
                        <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                            {selectedCity.name}
                        </div>
                        <div>
                            AQI:{" "}
                            <b style={{ color: getAQIColor(selectedCity.aqi) }}>
                                {selectedCity.aqi}
                            </b>
                        </div>
                        <div>Status: {getAQIStatus(selectedCity.aqi)}</div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 📊 AQI Legend */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                style={{
                    position: "absolute",
                    bottom: "10px",
                    right: "10px",
                    background: "rgba(255,255,255,0.95)",
                    borderRadius: "8px",
                    padding: "10px 14px",
                    fontSize: "clamp(11px, 2vw, 13px)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                    zIndex: 2000,
                    width: "max-content",
                }}
            >
                <div style={{ fontWeight: "bold", marginBottom: "6px" }}>AQI Levels</div>
                {[
                    { color: "#009966", label: "Good (0–50)" },
                    { color: "#ffde33", label: "Moderate (51–100)" },
                    { color: "#ff9933", label: "Unhealthy Sensitive (101–150)" },
                    { color: "#cc0033", label: "Unhealthy (151–200)" },
                    { color: "#660099", label: "Very Unhealthy (201–300)" },
                    { color: "#7e0023", label: "Hazardous (301+)" },
                ].map((item) => (
                    <div
                        key={item.label}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            marginBottom: "4px",
                        }}
                    >
                        <div
                            style={{
                                width: "14px",
                                height: "14px",
                                borderRadius: "3px",
                                background: item.color,
                                marginRight: "8px",
                                border: "1px solid #ccc",
                            }}
                        ></div>
                        {item.label}
                    </div>
                ))}
            </motion.div>
        </div>
    );
};

export default AirMap;









