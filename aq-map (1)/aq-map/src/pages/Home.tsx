export default function Home() {
    return (
        <div
            className="d-flex flex-column justify-content-center align-items-center text-center text-light w-100"
            style={{
                minHeight: "calc(100vh - 160px)", // adjust for header/footer
                width: "100vw",
                background: "linear-gradient(135deg, #a8e063, #56ab2f)", // 🌿 Light green gradient
                fontFamily: "'Titillium Web', sans-serif",
                padding: "3rem 1rem",
                margin: 0,
                overflowX: "hidden",
            }}
        >
            <div className="container-fluid px-4">
                {/* Hero Section */}
                <h1 className="display-5 fw-bold mb-3">
                    🌍 Environmental — Air Quality Insights
                </h1>
                <p className="lead mb-4">
                    Welcome to the World AQI Dashboard, your trusted platform to monitor real-time air pollution levels across the globe.
                    We collect and visualize live Air Quality Index (AQI) data from verified sources and public APIs, helping you stay informed about the air you breathe — anywhere in the world.
                    Our interactive map displays the latest AQI readings for major cities, color-coded by health category for easy understanding. Click any marker to view live AQI, pollutant levels (PM2.5, PM10, NO₂, CO, SO₂, O₃), and health advice.
                </p>

                {/* Call to Action */}
                <a
                    href="/map"
                    className="btn btn-light btn-lg rounded-pill shadow-sm px-4 py-2"
                >
                    View Live AQI Map
                </a>

                {/* Info Cards */}
                <div className="row mt-5 g-4 justify-content-center">
                    <div className="col-sm-6 col-md-4 col-lg-3">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-body">
                                <h5 className="card-title text-success fw-bold">
                                    📡 Real-Time Data
                                </h5>
                                <p className="card-text text-muted">
                                    Fetches the latest AQI readings directly from the World Air
                                    Quality Index API for multiple cities.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="col-sm-6 col-md-4 col-lg-3">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-body">
                                <h5 className="card-title text-success fw-bold">
                                    🗺️ Interactive Map
                                </h5>
                                <p className="card-text text-muted">
                                    Visualize pollution levels across India on an interactive map
                                    powered by MapLibre and React.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="col-sm-6 col-md-4 col-lg-3">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-body">
                                <h5 className="card-title text-success fw-bold">
                                    🌆 City Insights
                                </h5>
                                <p className="card-text text-muted">
                                    Compare and explore AQI trends for major metropolitan cities in
                                    India.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
