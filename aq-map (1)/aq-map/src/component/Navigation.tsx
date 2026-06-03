import { Link } from "react-router-dom";
import { NavLink } from "react-router-dom";
export default function Navigation() {
    return (
            <nav className="navbar navbar-expand-lg navbar-dark bg-success">
                <div className="container">
                    <Link className="navbar-brand" to="/">
                        <h5 className="m-0 p-0" style={{ textAlign: "left" }}>🌍 WORLD AQI</h5>
                    </Link>
                    <button
                        className="navbar-toggler"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#navbarNav"
                    >
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    <div className="collapse navbar-collapse" id="navbarNav">
                        <ul className="navbar-nav ms-auto">
                            <li className="nav-item">
                                <NavLink
                                    to="/"
                                    end
                                    className={({ isActive }) =>
                                        `nav-link ${isActive ? "active-link" : ""}`
                                    }
                                >
                                    Home
                                </NavLink>

                            </li>
                            <li className="nav-item">
                                <NavLink
                                    to="/dashboard"
                                    end
                                    className={({ isActive }) =>
                                        `nav-link ${isActive ? "active-link" : ""}`
                                    }
                                >
                                    Dashboard
                                </NavLink>
                            </li>
                            <li className="nav-item">
                                <NavLink
                                    to="/widgets"
                                    end
                                    className={({ isActive }) =>
                                        `nav-link ${isActive ? "active-link" : ""}`
                                    }
                                >
                                    Widgets
                                </NavLink>
                            </li>

                            {/*<li className="nav-item">*/}
                            {/*    <NavLink*/}
                            {/*        to="/map"*/}
                            {/*        className={({ isActive }) =>*/}
                            {/*            `nav-link ${isActive ? "active-link" : ""}`*/}
                            {/*        }*/}
                            {/*    >*/}
                            {/*        Air Quality Map*/}
                            {/*    </NavLink>*/}
                            {/*</li>*/}
                            <li className="nav-item">
                                <NavLink
                                    to="/reduce"
                                    className={({ isActive }) =>
                                        `nav-link ${isActive ? "active-link" : ""}`
                                    }
                                >
                                    How to Prevent
                                </NavLink>
                            </li>
                            <li className="nav-item">
                                <NavLink
                                    to="/predict"
                                    className={({ isActive }) =>
                                        `nav-link ${isActive ? "active-link" : ""}`
                                    }
                                >
                                    AQI Calculator
                                </NavLink>
                            </li>
                            <li className="nav-item">
                                <NavLink
                                    to="/history"
                                    className={({ isActive }) =>
                                        `nav-link ${isActive ? "active-link" : ""}`
                                    }
                                >
                                    AQI History
                                </NavLink>
                            </li>
                            <li className="nav-item">
                                <NavLink
                                    to="/analytics"
                                    className={({ isActive }) =>
                                        `nav-link ${isActive ? "active-link" : ""}`
                                    }
                                >
                                    Analysis
                                </NavLink>
                            </li>
                            <li className="nav-item">
                                <NavLink
                                    to="/forecast"
                                    className={({ isActive }) =>
                                        `nav-link ${isActive ? "active-link" : ""}`
                                    }
                                >
                                    🔮 Future Forecast
                                </NavLink>
                            </li>
                        </ul>
                    </div>
                    {/*<div className="collapse navbar-collapse" id="navbarNav">*/}
                    {/*    <ul className="navbar-nav ms-auto">*/}
                    {/*        <li className="nav-item">*/}
                    {/*            <Link className="nav-link" to="/">Home</Link>*/}
                    {/*        </li>*/}
                    {/*        <li className="nav-item">*/}
                    {/*            <Link className="nav-link" to="/map">Air Quality Map</Link>*/}
                    {/*        </li>*/}
                    {/*    </ul>*/}
                    {/*</div>*/}
                </div>
            </nav>
    );
}
