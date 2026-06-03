# AQI Prediction ML Service

Time series forecasting service for Air Quality Index prediction using Facebook Prophet.

## Setup

1. **Create virtual environment:**
```bash
python -m venv venv
venv\Scripts\activate  # Windows
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Train models:**
```bash
python train_model.py
```
This will train a Prophet model for each city in the database.

4. **Run the API server:**
```bash
python app.py
```
Server runs on `http://localhost:5000`

## API Endpoints

### GET /api/predict
Predict future AQI for a city.

**Parameters:**
- `city` (required): City name (e.g., "Delhi", "Beijing")
- `days` (optional): Number of days to predict (default: 7, max: 365)

**Example:**
```
GET /api/predict?city=Delhi&days=7
```

**Response:**
```json
{
  "city": "Delhi",
  "predictions": [
    {
      "date": "2025-01-15",
      "predicted_aqi": 156.2,
      "lower_bound": 120.5,
      "upper_bound": 191.9,
      "category": {"level": "Unhealthy", "color": "#ff0000"}
    }
  ],
  "generated_at": "2025-01-14T10:30:00"
}
```

### GET /api/cities
Get list of cities with trained models.

### GET /api/health
Health check endpoint.

## Model Details

- **Algorithm:** Facebook Prophet
- **Features:** Temperature, Humidity, Wind Speed
- **Seasonality:** Yearly + Weekly patterns
- **Training Data:** Historical AQI data from MySQL database
