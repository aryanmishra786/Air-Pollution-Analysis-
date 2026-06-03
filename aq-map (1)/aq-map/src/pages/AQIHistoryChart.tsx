import { useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Title,
  ArcElement,
} from "chart.js";
import { Line, Bar, Scatter, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title,
);

// ---------- Color Palette (Bold & Colorful)
const brightColors = [
  "#ff3b30", // red
  "#ff9500", // orange
  "#ffcc00", // yellow
  "#34c759", // green
  "#5ac8fa", // light blue
  "#007aff", // blue
  "#5856d6", // purple
  "#af52de", // violet
];

// ---------- Gradient helper
const createGradient = (ctx: CanvasRenderingContext2D, color: string) => {
  const gradient = ctx.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, color + "55");
  gradient.addColorStop(1, color + "05");
  return gradient;
};

// ---------- Types
type ApiResponse = { data: RawRecord[] } | any;
type RawRecord = {
  Date: string | number; // backend may return ISO string or number
  City: string;
  Country?: string;
  AQI: string | number;
  PM2_5?: string | number;
  PM10?: string | number;
  NO2?: string | number;
  SO2?: string | number;
  CO?: string | number;
  O3?: string | number;
  Temperature?: string | number;
  Humidity?: string | number;
  WindSpeed?: string | number;
};

type Normalized = {
  dateISO: string; // YYYY-MM-DD
  city: string;
  country?: string;
  aqi: number;
  pm25: number;
  pm10: number;
  no2: number;
  so2: number;
  co: number;
  o3: number;
  temperature: number;
  humidity: number;
  windSpeed: number;
};

// ---------- Helpers
const isoDateOnly = (v: string | number) => {
  // accepts ISO string or timestamp; returns YYYY-MM-DD
  try {
    const d = new Date(v);
    return d.toISOString().split("T")[0];
  } catch {
    return String(v);
  }
};

const toNum = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const unique = <T,>(arr: T[]) => Array.from(new Set(arr));
const percentChange = (oldVal: number, newVal: number) =>
  oldVal === 0
    ? newVal === 0
      ? 0
      : Infinity
    : ((newVal - oldVal) / Math.abs(oldVal)) * 100;

// ---------- Component
export default function AQIDashboard() {
  const [rawApi, setRawApi] = useState<RawRecord[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI controls state
  const [selectedStart, setSelectedStart] = useState<string>("");
  const [selectedEnd, setSelectedEnd] = useState<string>("");
  const [selectedCities, setSelectedCities] = useState<string[]>([]);

  // Fetch API (expects { data: [ ... ] } )
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("http://localhost:3000/api/chart/get_all_city");
        const json: ApiResponse = await res.json();
        const payload = Array.isArray(json)
          ? json
          : (json?.data ?? json?.result ?? null);
        if (!mounted) return;
        if (Array.isArray(payload)) {
          setRawApi(payload);
        } else if (payload && typeof payload === "object") {
          // single object -> wrap in array (defensive)
          setRawApi([payload]);
        } else {
          setRawApi([]);
        }
      } catch (err: any) {
        console.error("API Load Error:", err);
        setError(err?.message ?? "Failed to load API");
        setRawApi([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Normalize API response to typed & cleaned data
  const data = useMemo<Normalized[]>(() => {
    if (!rawApi) return [];
    return rawApi.map((r) => ({
      dateISO: isoDateOnly(r.Date),
      city: r.City,
      country: r.Country ?? "",
      aqi: toNum(r.AQI),
      pm25: toNum(r.PM2_5),
      pm10: toNum(r.PM10),
      no2: toNum(r.NO2),
      so2: toNum(r.SO2),
      co: toNum(r.CO),
      o3: toNum(r.O3),
      temperature: toNum(r.Temperature),
      humidity: toNum(r.Humidity),
      windSpeed: toNum(r.WindSpeed),
    }));
  }, [rawApi]);

  // Derived lists
  const allDates = useMemo(
    () => unique(data.map((d) => d.dateISO)).sort(),
    [data],
  );
  const allCities = useMemo(
    () => unique(data.map((d) => d.city)).sort(),
    [data],
  );

  // initialize controls when data loads
  useEffect(() => {
    if (allDates.length && !selectedStart) {
      setSelectedStart(allDates[0]);
    }
    if (allDates.length && !selectedEnd) {
      setSelectedEnd(allDates[allDates.length - 1]);
    }
    if (allCities.length && selectedCities.length === 0) {
      // default to first city selected
      setSelectedCities([allCities[0]]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDates, allCities]);

  // Filtered range data
  const filtered = useMemo(() => {
    if (!selectedStart || !selectedEnd) return [];
    const s = new Date(selectedStart);
    const e = new Date(selectedEnd);
    // include end date (time 00:00 vs stored iso -> safe)
    return data.filter((d) => {
      const dt = new Date(d.dateISO);
      return (
        dt >= s &&
        dt <= e &&
        (selectedCities.length ? selectedCities.includes(d.city) : true)
      );
    });
  }, [data, selectedStart, selectedEnd, selectedCities]);

  // AQI Trend datasets (per city) with multi-colors & gradient fill
  const aqiTrend = useMemo(() => {
    const dates = unique(filtered.map((d) => d.dateISO)).sort();
    const datasets = selectedCities.map((city, index) => {
      const color = brightColors[index % brightColors.length];
      const points = dates.map((date) => {
        const rec = filtered.find((r) => r.city === city && r.dateISO === date);
        return rec ? rec.aqi : null;
      });
      return {
        label: city,
        data: points,
        borderColor: color,
        // react-chartjs-2 passes ctx wrapper; use function to create gradient per chart instance
        backgroundColor: (ctx: any) =>
          createGradient(ctx.chart.ctx as CanvasRenderingContext2D, color),
        borderWidth: 3,
        tension: 0.35,
        pointRadius: 4,
        pointHoverRadius: 7,
        pointBackgroundColor: color,
        pointBorderColor: "#fff",
      } as any;
    });
    return { labels: unique(filtered.map((d) => d.dateISO)).sort(), datasets };
  }, [filtered, selectedCities]);

  // Pollutant averages per city
  const pollutantData = useMemo(() => {
    const cities = unique(filtered.map((d) => d.city));
    if (!cities.length) return { labels: [], datasets: [] };
    const avg = (arr: number[]) =>
      arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    return {
      labels: cities,
      datasets: [
        {
          label: "PM2.5",
          data: cities.map((c) =>
            avg(filtered.filter((r) => r.city === c).map((x) => x.pm25)),
          ),
          backgroundColor: "#ff3b30aa",
        },
        {
          label: "PM10",
          data: cities.map((c) =>
            avg(filtered.filter((r) => r.city === c).map((x) => x.pm10)),
          ),
          backgroundColor: "#ff9500aa",
        },
        {
          label: "NO₂",
          data: cities.map((c) =>
            avg(filtered.filter((r) => r.city === c).map((x) => x.no2)),
          ),
          backgroundColor: "#ffcc00aa",
        },
        {
          label: "SO₂",
          data: cities.map((c) =>
            avg(filtered.filter((r) => r.city === c).map((x) => x.so2)),
          ),
          backgroundColor: "#34c759aa",
        },
        {
          label: "CO",
          data: cities.map((c) =>
            avg(filtered.filter((r) => r.city === c).map((x) => x.co)),
          ),
          backgroundColor: "#007affaa",
        },
        {
          label: "O₃",
          data: cities.map((c) =>
            avg(filtered.filter((r) => r.city === c).map((x) => x.o3)),
          ),
          backgroundColor: "#5856d6aa",
        },
      ],
    } as any;
  }, [filtered]);

  // Correlation scatter data
  const correlation = useMemo(() => {
    const rows = filtered;
    const base = {
      pointRadius: 5,
      pointHoverRadius: 8,
      backgroundColor: "#007affaa",
      borderColor: "#007aff",
      borderWidth: 2,
    };
    return {
      temp: {
        datasets: [
          {
            label: "Temp vs AQI",
            data: rows.map((r) => ({ x: r.temperature, y: r.aqi })),
            ...base,
          },
        ],
      },
      hum: {
        datasets: [
          {
            label: "Humidity vs AQI",
            data: rows.map((r) => ({ x: r.humidity, y: r.aqi })),
            ...base,
          },
        ],
      },
      wind: {
        datasets: [
          {
            label: "Wind vs AQI",
            data: rows.map((r) => ({ x: r.windSpeed, y: r.aqi })),
            ...base,
          },
        ],
      },
    };
  }, [filtered]);

  // AQI Category Distribution (Doughnut)
  const aqiCategoryData = useMemo(() => {
    const categories = [
      { label: "Good (0-50)", min: 0, max: 50, color: "#00e400" },
      { label: "Moderate (51-100)", min: 51, max: 100, color: "#ffff00" },
      { label: "Unhealthy SG (101-150)", min: 101, max: 150, color: "#ff7e00" },
      { label: "Unhealthy (151-200)", min: 151, max: 200, color: "#ff0000" },
      {
        label: "Very Unhealthy (201-300)",
        min: 201,
        max: 300,
        color: "#8f3f97",
      },
      { label: "Hazardous (300+)", min: 301, max: 999, color: "#7e0023" },
    ];
    const counts = categories.map(
      (cat) =>
        filtered.filter((r) => r.aqi >= cat.min && r.aqi <= cat.max).length,
    );
    return {
      labels: categories.map((c) => c.label),
      datasets: [
        {
          data: counts,
          backgroundColor: categories.map((c) => c.color),
          borderWidth: 2,
          borderColor: "#fff",
        },
      ],
    };
  }, [filtered]);

  // Monthly Average AQI
  const monthlyAvgData = useMemo(() => {
    const monthMap: { [key: string]: number[] } = {};
    filtered.forEach((r) => {
      const month = r.dateISO.substring(0, 7); // YYYY-MM
      if (!monthMap[month]) monthMap[month] = [];
      monthMap[month].push(r.aqi);
    });
    const months = Object.keys(monthMap).sort();
    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    return {
      labels: months,
      datasets: [
        {
          label: "Monthly Avg AQI",
          data: months.map((m) => avg(monthMap[m])),
          backgroundColor: "#5856d622",
          borderColor: "#5856d6",
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 4,
        },
      ],
    };
  }, [filtered]);

  // Pollutant Contribution by Month (Stacked Bar)
  const pollutantContributionData = useMemo(() => {
    const monthMap: {
      [key: string]: {
        pm25: number[];
        pm10: number[];
        no2: number[];
        so2: number[];
        co: number[];
        o3: number[];
      };
    } = {};
    filtered.forEach((r) => {
      const month = r.dateISO.substring(0, 7);
      if (!monthMap[month])
        monthMap[month] = {
          pm25: [],
          pm10: [],
          no2: [],
          so2: [],
          co: [],
          o3: [],
        };
      monthMap[month].pm25.push(r.pm25);
      monthMap[month].pm10.push(r.pm10);
      monthMap[month].no2.push(r.no2);
      monthMap[month].so2.push(r.so2);
      monthMap[month].co.push(r.co);
      monthMap[month].o3.push(r.o3);
    });
    const months = Object.keys(monthMap).sort();
    const avg = (arr: number[]) =>
      arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    return {
      labels: months,
      datasets: [
        {
          label: "PM2.5",
          data: months.map((m) => avg(monthMap[m].pm25)),
          backgroundColor: "#ff3b30",
          stack: "stack1",
        },
        {
          label: "PM10",
          data: months.map((m) => avg(monthMap[m].pm10)),
          backgroundColor: "#ff9500",
          stack: "stack1",
        },
        {
          label: "NO2",
          data: months.map((m) => avg(monthMap[m].no2)),
          backgroundColor: "#ffcc00",
          stack: "stack1",
        },
        {
          label: "SO2",
          data: months.map((m) => avg(monthMap[m].so2)),
          backgroundColor: "#34c759",
          stack: "stack1",
        },
        {
          label: "CO",
          data: months.map((m) => avg(monthMap[m].co)),
          backgroundColor: "#007aff",
          stack: "stack1",
        },
        {
          label: "O3",
          data: months.map((m) => avg(monthMap[m].o3)),
          backgroundColor: "#5856d6",
          stack: "stack1",
        },
      ],
    };
  }, [filtered]);

  // Max/Min AQI per Month
  const maxMinMonthlyData = useMemo(() => {
    const monthMap: { [key: string]: number[] } = {};
    filtered.forEach((r) => {
      const month = r.dateISO.substring(0, 7);
      if (!monthMap[month]) monthMap[month] = [];
      monthMap[month].push(r.aqi);
    });
    const months = Object.keys(monthMap).sort();
    return {
      labels: months,
      datasets: [
        {
          label: "Max AQI",
          data: months.map((m) => Math.max(...monthMap[m])),
          backgroundColor: "#ff3b3022",
          borderColor: "#ff3b30",
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 3,
        },
        {
          label: "Min AQI",
          data: months.map((m) => Math.min(...monthMap[m])),
          backgroundColor: "#34c75922",
          borderColor: "#34c759",
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 3,
        },
        {
          label: "Avg AQI",
          data: months.map(
            (m) => monthMap[m].reduce((a, b) => a + b, 0) / monthMap[m].length,
          ),
          backgroundColor: "transparent",
          borderColor: "#007aff",
          borderWidth: 3,
          fill: false,
          tension: 0.3,
          pointRadius: 4,
          borderDash: [5, 5],
        },
      ],
    };
  }, [filtered]);

  // Year-over-Year Comparison
  const yearCompareData = useMemo(() => {
    const yearMap: { [key: string]: number[] } = {};
    filtered.forEach((r) => {
      const year = r.dateISO.substring(0, 4);
      if (!yearMap[year]) yearMap[year] = [];
      yearMap[year].push(r.aqi);
    });
    const years = Object.keys(yearMap).sort();
    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    return {
      labels: years,
      datasets: [
        {
          label: "Yearly Avg AQI",
          data: years.map((y) => avg(yearMap[y])),
          backgroundColor: "#ff950022",
          borderColor: "#ff9500",
          borderWidth: 3,
          fill: true,
          tension: 0.3,
          pointRadius: 6,
          pointBackgroundColor: "#ff9500",
        },
      ],
    };
  }, [filtered]);

  // Trend summary cards (first vs last in range)
  const trendSummary = useMemo(() => {
    return selectedCities.map((city) => {
      const rows = data
        .filter(
          (r) =>
            r.city === city &&
            r.dateISO >= selectedStart &&
            r.dateISO <= selectedEnd,
        )
        .sort((a, b) => (a.dateISO < b.dateISO ? -1 : 1));
      const first = rows[0];
      const last = rows[rows.length - 1];
      const change = first && last ? percentChange(first.aqi, last.aqi) : 0;
      return {
        city,
        first: first?.aqi ?? null,
        last: last?.aqi ?? null,
        change,
        direction:
          change > 0 ? "increase" : change < 0 ? "decrease" : "no-change",
      };
    });
  }, [data, selectedCities, selectedStart, selectedEnd]);

  // Loading / error UI
  if (loading) {
    return (
      <div className="p-6 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-2" />
          <div className="text-sm text-gray-600">Loading AQI data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-red-600">
          Error loading data: {error}
        </div>
      </div>
    );
  }

  // Render
  return (
    <div className="p-4 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <header className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">AQI Analytics Dashboard</h1>
            <p className="text-sm text-gray-600">
              Range, multi-city comparison, pollutant analysis & correlations
            </p>
          </div>

          <div className="flex gap-2 items-center">
            <label className="text-sm">Start</label>
            <input
              type="date"
              className="p-2 border rounded"
              value={selectedStart}
              onChange={(e) => setSelectedStart(e.target.value)}
            />

            <label className="text-sm">End</label>
            <input
              type="date"
              className="p-2 border rounded"
              value={selectedEnd}
              onChange={(e) => setSelectedEnd(e.target.value)}
            />

            <label className="text-sm">Cities</label>
            <select
              multiple
              className="p-2 border rounded h-32"
              value={selectedCities}
              onChange={(e) => {
                const opts = Array.from(e.target.selectedOptions).map(
                  (o) => o.value,
                );
                setSelectedCities(opts);
              }}
            >
              {allCities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </header>

        {/* Summary cards */}
        <section className="grid grid-cols-3 gap-3 mb-3">
          {trendSummary.map((s) => (
            <div
              key={s.city}
              className="bg-white p-3 rounded-lg shadow border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500 font-medium">
                    {s.city}
                  </div>
                  <div className="text-3xl font-bold mt-1">{s.last ?? "—"}</div>
                  <div className="text-xs text-gray-400 -mt-1">AQI</div>
                </div>

                <div className="text-right">
                  <div
                    className={
                      "text-sm font-semibold " +
                      (s.direction === "increase"
                        ? "text-red-600"
                        : s.direction === "decrease"
                          ? "text-green-600"
                          : "text-gray-600")
                    }
                  >
                    {s.direction === "increase" && "▲ Increasing"}
                    {s.direction === "decrease" && "▼ Decreasing"}
                    {s.direction === "no-change" && "— Stable"}
                  </div>
                  <div className="mt-1 text-xs font-medium text-gray-500">
                    {s.change === Infinity ? "N/A" : `${s.change.toFixed(1)}%`}
                  </div>
                </div>
              </div>

              <div className="mt-4 w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                <div
                  className={
                    "h-full " +
                    (s.direction === "increase"
                      ? "bg-red-500"
                      : s.direction === "decrease"
                        ? "bg-green-500"
                        : "bg-gray-400")
                  }
                  style={{ width: `${Math.min(Math.abs(s.change), 100)}%` }}
                />
              </div>
            </div>
          ))}
        </section>

        {/* Charts - 2x2 uniform square grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "20px" }}>
          <div style={{ background: "#fff", padding: "16px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
            <h4 style={{ marginBottom: "10px", fontWeight: 600, fontSize: "14px" }}>AQI Trend</h4>
            <Line data={aqiTrend} options={{ responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } } }} />
          </div>

          <div style={{ background: "#fff", padding: "16px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
            <h4 style={{ marginBottom: "10px", fontWeight: 600, fontSize: "14px" }}>Pollutant Averages</h4>
            <Bar data={pollutantData} options={{ responsive: true, maintainAspectRatio: true, plugins: { legend: { display: true, position: "bottom" } }, scales: { y: { beginAtZero: true } } }} />
          </div>

          <div style={{ background: "#fff", padding: "16px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
            <h4 style={{ marginBottom: "10px", fontWeight: 600, fontSize: "14px" }}>Temperature vs AQI</h4>
            <Scatter data={correlation.temp} options={{ responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } } }} />
          </div>

          <div style={{ background: "#fff", padding: "16px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
            <h4 style={{ marginBottom: "10px", fontWeight: 600, fontSize: "14px" }}>AQI Category Distribution</h4>
            <Doughnut data={aqiCategoryData} options={{ responsive: true, maintainAspectRatio: true, plugins: { legend: { display: true, position: "right" } } }} />
          </div>

          <div style={{ background: "#fff", padding: "16px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
            <h4 style={{ marginBottom: "10px", fontWeight: 600, fontSize: "14px" }}>Monthly Average AQI</h4>
            <Line data={monthlyAvgData} options={{ responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } }, elements: { line: { tension: 0.3 }, point: { radius: 3 } } }} />
          </div>

          <div style={{ background: "#fff", padding: "16px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
            <h4 style={{ marginBottom: "10px", fontWeight: 600, fontSize: "14px" }}>Year-over-Year Comparison</h4>
            <Line data={yearCompareData} options={{ responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } }, elements: { line: { tension: 0.3 }, point: { radius: 4 } } }} />
          </div>

          <div style={{ background: "#fff", padding: "16px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
            <h4 style={{ marginBottom: "10px", fontWeight: 600, fontSize: "14px" }}>Pollutant Contribution by Month</h4>
            <Bar data={pollutantContributionData} options={{ responsive: true, maintainAspectRatio: true, plugins: { legend: { display: true, position: "top" } }, scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } } }} />
          </div>

          <div style={{ background: "#fff", padding: "16px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
            <h4 style={{ marginBottom: "10px", fontWeight: 600, fontSize: "14px" }}>Monthly Max/Min/Avg AQI</h4>
            <Line data={maxMinMonthlyData} options={{ responsive: true, maintainAspectRatio: true, plugins: { legend: { display: true, position: "top" } }, scales: { y: { beginAtZero: true } }, elements: { line: { tension: 0.3 }, point: { radius: 2 } } }} />
          </div>
        </div>

        <footer className="mt-6 text-sm text-gray-600">
          <p>
            Notes: Multi-city support enabled. Bright color scheme active. AQI
            change calculation based on first vs last in date range.
          </p>
        </footer>
      </div>
    </div>
  );
}
