from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import numpy as np
import joblib
from datetime import datetime, timedelta
from config import MODEL_DIR

app = Flask(__name__)
CORS(app)

def load_model(city):
    """Load trained model for a city."""
    model_path = os.path.join(MODEL_DIR, f'{city.replace(" ", "_")}_model.pkl')
    if not os.path.exists(model_path):
        return None
    
    return joblib.load(model_path)

@app.route('/api/predict', methods=['GET'])
def predict():
    """Predict future AQI for a city."""
    city = request.args.get('city')
    days = int(request.args.get('days', 7))
    
    if not city:
        return jsonify({'error': 'City parameter required'}), 400
    
    if days > 365:
        days = 365
    
    model_data = load_model(city)
    
    if model_data is None:
        return jsonify({'error': f'No model found for {city}'}), 404
    
    model = model_data['model']
    scaler = model_data['scaler']
    last_values = model_data['last_values']
    stats = model_data['stats']
    feature_cols = model_data.get('feature_cols', None)
    
    # Start from last known date
    last_date = datetime.strptime(last_values['last_date'], '%Y-%m-%d')
    
    # Determine model type based on feature count
    is_advanced_model = feature_cols is not None and len(feature_cols) > 15
    
    # Initialize AQI values
    current_aqi = last_values.get('aqi', last_values.get('aqi_lag1', 100))
    
    result = []
    recent_predictions = [current_aqi]
    
    for i in range(1, days + 1):
        future_date = last_date + timedelta(days=i)
        
        if is_advanced_model:
            # Advanced model: use all feature columns from last_values
            features = []
            for col in feature_cols:
                if col in last_values:
                    features.append(float(last_values[col]))
                elif 'month_sin' in col:
                    features.append(np.sin(2 * np.pi * future_date.month / 12))
                elif 'month_cos' in col:
                    features.append(np.cos(2 * np.pi * future_date.month / 12))
                elif 'day_sin' in col:
                    features.append(np.sin(2 * np.pi * future_date.timetuple().tm_yday / 365))
                elif 'day_cos' in col:
                    features.append(np.cos(2 * np.pi * future_date.timetuple().tm_yday / 365))
                else:
                    features.append(0.0)
            features = np.array([features])
        else:
            # Simple model: use basic features
            aqi_lag1 = last_values.get('aqi_lag1', current_aqi)
            aqi_lag7 = last_values.get('aqi_lag7', current_aqi)
            aqi_rolling_7 = last_values.get('aqi_rolling_7', current_aqi)
            aqi_rolling_30 = last_values.get('aqi_rolling_30', current_aqi)
            
            features = np.array([[
                future_date.timetuple().tm_yday,
                future_date.month,
                future_date.weekday(),
                last_values.get('temprature', 25),
                last_values.get('humidity', 50),
                last_values.get('wind_speed', 5),
                aqi_lag1,
                aqi_lag7,
                aqi_rolling_7,
                aqi_rolling_30
            ]])
        
        # Scale and predict
        features_scaled = scaler.transform(features)
        predicted_aqi = float(model.predict(features_scaled)[0])
        predicted_aqi = max(0, predicted_aqi)
        
        # Calculate bounds
        std = stats.get('std_aqi', 20) * 0.3
        lower_bound = max(0, predicted_aqi - std)
        upper_bound = predicted_aqi + std
        
        result.append({
            'date': future_date.strftime('%Y-%m-%d'),
            'predicted_aqi': round(predicted_aqi, 1),
            'lower_bound': round(lower_bound, 1),
            'upper_bound': round(upper_bound, 1),
            'category': get_aqi_category(predicted_aqi)
        })
        
        recent_predictions.append(predicted_aqi)
    
    return jsonify({
        'city': city,
        'predictions': result,
        'generated_at': datetime.now().isoformat()
    })

@app.route('/api/cities', methods=['GET'])
def get_available_cities():
    """Get list of cities with trained models."""
    if not os.path.exists(MODEL_DIR):
        return jsonify({'cities': []})
    
    cities = []
    for f in os.listdir(MODEL_DIR):
        if f.endswith('_model.pkl'):
            city = f.replace('_model.pkl', '').replace('_', ' ')
            cities.append(city)
    
    return jsonify({'cities': sorted(cities)})

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({'status': 'ok', 'service': 'AQI Prediction ML Service'})

def get_aqi_category(aqi):
    """Return AQI category based on value."""
    if aqi <= 50:
        return {'level': 'Good', 'color': '#00e400'}
    elif aqi <= 100:
        return {'level': 'Moderate', 'color': '#ffff00'}
    elif aqi <= 150:
        return {'level': 'Unhealthy for Sensitive Groups', 'color': '#ff7e00'}
    elif aqi <= 200:
        return {'level': 'Unhealthy', 'color': '#ff0000'}
    elif aqi <= 300:
        return {'level': 'Very Unhealthy', 'color': '#8f3f97'}
    else:
        return {'level': 'Hazardous', 'color': '#7e0023'}

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
