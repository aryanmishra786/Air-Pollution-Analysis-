import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navigation from "./component/Navigation";
import Footer from "./component/Footer";
import PageOne from "./pages/Home";
import AirMap from "./pages/AirMap";
import Header from "./component/Header.tsx";
import ReduceAirPollution from "./pages/ReduceAirPollution.tsx";
import AirMapDashboard from "./pages/Dashboard.tsx";
import Widgets from "./pages/Widgets.tsx";
import AQIComparisonDashboard from "./pages/AQIPredict.tsx";
import CityDetails from "./pages/CityDetails.tsx";
import AQIDashboard from "./pages/AQIHistoryChart.tsx";
import CityAqiTrendChart from "./pages/CityAqiTrendChart.tsx";
import AQIForecast from "./pages/AQIForecast.tsx";
function App() {
    return (
        <Router>
            <div className="d-flex flex-column">
                <Header/>
                <Navigation />
                <main >
                    <div className="flex-fill">
                        <Routes>
                            <Route path="/" element={<PageOne />} />
                            <Route path="/dashboard" element={<AirMapDashboard />} />
                            <Route path="/city/:cityName/:latitude/:longitude" element={<CityDetails  />} />
                            <Route path="/map" element={<AirMap />} />
                            <Route path="/predict" element={<AQIComparisonDashboard />} />

                            <Route path="/widgets" element={<Widgets />} />
                            <Route path="/reduce" element={<ReduceAirPollution />} />
                            <Route path="/history" element={<AQIDashboard />} />
                            <Route path="/analytics" element={<CityAqiTrendChart />} />
                            <Route path="/forecast" element={<AQIForecast />} />

                        </Routes>
                    </div>
                </main>

                <Footer />
            </div>
        </Router>
    );
}

export default App;

