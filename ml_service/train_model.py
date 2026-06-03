import os
import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor, StackingRegressor, VotingRegressor
from sklearn.linear_model import Ridge, ElasticNet
from xgboost import XGBRegressor
from lightgbm import LGBMRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
import mysql.connector
import joblib
from config import DB_CONFIG, MODEL_DIR
import warnings
warnings.filterwarnings('ignore')

def get_city_data(city):
    """Fetch historical AQI data for a specific city from MySQL."""
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor(dictionary=True)
    query = """
        SELECT a_date, aqi, pm2, pm10, no2, so2, co, o3, 
               temprature, humidity, wind_speed
        FROM tbl_aqi_data 
        WHERE city = %s 
        ORDER BY a_date ASC
    """
    cursor.execute(query, (city,))
    rows = cursor.fetchall()
    conn.close()
    df = pd.DataFrame(rows)
    # Convert date column to datetime
    df['a_date'] = pd.to_datetime(df['a_date'])
    # Convert Decimal to float
    for col in ['aqi', 'pm2', 'pm10', 'no2', 'so2', 'co', 'o3', 'temprature', 'humidity', 'wind_speed']:
        if col in df.columns:
            df[col] = df[col].astype(float)
    return df

def get_all_cities():
    """Get list of all unique cities in the database."""
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()
    cursor.execute("SELECT DISTINCT city FROM tbl_aqi_data")
    cities = [row[0] for row in cursor.fetchall()]
    conn.close()
    return cities

def create_features(df):
    """Create comprehensive time-based and lag features for high accuracy."""
    df = df.copy()
    
    # Time features
    df['day_of_year'] = df['a_date'].dt.dayofyear
    df['month'] = df['a_date'].dt.month
    df['day_of_week'] = df['a_date'].dt.dayofweek
    df['week_of_year'] = df['a_date'].dt.isocalendar().week.astype(int)
    df['quarter'] = df['a_date'].dt.quarter
    df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)
    
    # Seasonal features (cyclical encoding)
    df['month_sin'] = np.sin(2 * np.pi * df['month'] / 12)
    df['month_cos'] = np.cos(2 * np.pi * df['month'] / 12)
    df['day_sin'] = np.sin(2 * np.pi * df['day_of_year'] / 365)
    df['day_cos'] = np.cos(2 * np.pi * df['day_of_year'] / 365)
    
    # Multiple lag features (crucial for time series)
    for lag in [1, 2, 3, 7, 14, 21, 30]:
        df[f'aqi_lag{lag}'] = df['aqi'].shift(lag)
    
    # Rolling statistics
    for window in [3, 7, 14, 30]:
        df[f'aqi_rolling_mean_{window}'] = df['aqi'].rolling(window).mean()
        df[f'aqi_rolling_std_{window}'] = df['aqi'].rolling(window).std()
        df[f'aqi_rolling_min_{window}'] = df['aqi'].rolling(window).min()
        df[f'aqi_rolling_max_{window}'] = df['aqi'].rolling(window).max()
    
    # Pollutant lag features
    for col in ['pm2', 'pm10', 'no2', 'so2', 'co', 'o3']:
        df[f'{col}_lag1'] = df[col].shift(1)
        df[f'{col}_rolling_7'] = df[col].rolling(7).mean()
    
    # Weather lag features
    for col in ['temprature', 'humidity', 'wind_speed']:
        df[f'{col}_lag1'] = df[col].shift(1)
        df[f'{col}_rolling_3'] = df[col].rolling(3).mean()
    
    # Trend features
    df['aqi_diff_1'] = df['aqi'].diff(1)
    df['aqi_diff_7'] = df['aqi'].diff(7)
    df['aqi_pct_change'] = df['aqi'].pct_change()
    
    # Exponential moving averages
    df['aqi_ema_7'] = df['aqi'].ewm(span=7).mean()
    df['aqi_ema_30'] = df['aqi'].ewm(span=30).mean()
    
    df = df.dropna()
    df = df.replace([np.inf, -np.inf], np.nan).dropna()
    return df

def train_model_for_city(city):
    """Train a Gradient Boosting model for a specific city."""
    print(f"Training model for {city}...")
    
    df = get_city_data(city)
    
    if len(df) < 60:
        print(f"  Skipping {city}: Not enough data ({len(df)} records)")
        return None
    
    df = create_features(df)
    
    # Use all numeric features except target and date
    exclude_cols = ['a_date', 'aqi', 'city']
    feature_cols = [col for col in df.columns if col not in exclude_cols and df[col].dtype in ['int64', 'float64']]
    
    X = df[feature_cols].values
    y = df['aqi'].values
    
    # Split data for evaluation
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Define multiple models to try
    models = {
        'XGBoost': XGBRegressor(
            n_estimators=500,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            min_child_weight=3,
            reg_alpha=0.1,
            reg_lambda=1.0,
            random_state=42,
            n_jobs=-1,
            verbosity=0
        ),
        'LightGBM': LGBMRegressor(
            n_estimators=500,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            min_child_samples=10,
            reg_alpha=0.1,
            reg_lambda=1.0,
            random_state=42,
            n_jobs=-1,
            verbose=-1
        ),
        'RandomForest': RandomForestRegressor(
            n_estimators=300,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1
        ),
        'GradientBoosting': GradientBoostingRegressor(
            n_estimators=300,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.8,
            min_samples_split=5,
            random_state=42
        )
    }
    
    # Try each model and select the best
    best_model = None
    best_name = None
    best_r2 = -np.inf
    
    for name, m in models.items():
        m.fit(X_train_scaled, y_train)
        pred = m.predict(X_test_scaled)
        score = r2_score(y_test, pred)
        if score > best_r2:
            best_r2 = score
            best_model = m
            best_name = name
    
    # If best single model < 0.85, try ensemble
    if best_r2 < 0.85:
        # Create stacking ensemble
        estimators = [
            ('xgb', models['XGBoost']),
            ('lgbm', models['LightGBM']),
            ('rf', models['RandomForest'])
        ]
        ensemble = StackingRegressor(
            estimators=estimators,
            final_estimator=Ridge(alpha=1.0),
            cv=3,
            n_jobs=-1
        )
        ensemble.fit(X_train_scaled, y_train)
        ensemble_pred = ensemble.predict(X_test_scaled)
        ensemble_r2 = r2_score(y_test, ensemble_pred)
        
        if ensemble_r2 > best_r2:
            best_model = ensemble
            best_name = 'Ensemble'
            best_r2 = ensemble_r2
    
    model = best_model
    
    # Calculate scores
    y_pred = model.predict(X_test_scaled)
    r2 = r2_score(y_test, y_pred)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    
    # Retrain on full data for deployment
    X_scaled = scaler.fit_transform(X)
    model.fit(X_scaled, y)
    
    os.makedirs(MODEL_DIR, exist_ok=True)
    model_path = os.path.join(MODEL_DIR, f'{city.replace(" ", "_")}_model.pkl')
    
    # Save model with metadata
    last_row = df.iloc[-1]
    # Store all feature values from last row
    last_values = {'last_date': last_row['a_date'].strftime('%Y-%m-%d')}
    for col in feature_cols:
        if col in last_row.index:
            last_values[col] = float(last_row[col])
    
    joblib.dump({
        'model': model,
        'scaler': scaler,
        'feature_cols': feature_cols,
        'algorithm': best_name,
        'last_values': last_values,
        'stats': {
            'mean_aqi': float(df['aqi'].mean()),
            'std_aqi': float(df['aqi'].std()),
            'records': len(df)
        },
        'scores': {
            'r2': round(r2, 4),
            'mae': round(mae, 2),
            'rmse': round(rmse, 2)
        }
    }, model_path)
    
    print(f"  ✓ Model saved: {model_path} ({best_name})")
    print(f"    Records: {len(df)} | R²: {r2:.4f} | MAE: {mae:.2f} | RMSE: {rmse:.2f}")
    return model, {'r2': r2, 'mae': mae, 'rmse': rmse, 'algorithm': best_name}

def train_all_models():
    """Train models for all cities."""
    cities = get_all_cities()
    print(f"Found {len(cities)} cities\n")
    
    success = 0
    all_scores = []
    for city in cities:
        try:
            result = train_model_for_city(city)
            if result:
                success += 1
                model, scores = result
                all_scores.append({'city': city, **scores})
        except Exception as e:
            print(f"  ✗ Error training {city}: {e}")
    
    # Print summary
    print(f"\n{'='*60}")
    print(f"TRAINING SUMMARY")
    print(f"{'='*60}")
    print(f"Models trained: {success}/{len(cities)}")
    if all_scores:
        avg_r2 = np.mean([s['r2'] for s in all_scores])
        avg_mae = np.mean([s['mae'] for s in all_scores])
        avg_rmse = np.mean([s['rmse'] for s in all_scores])
        print(f"\nAverage Scores:")
        print(f"  R² Score:  {avg_r2:.4f}")
        print(f"  MAE:       {avg_mae:.2f}")
        print(f"  RMSE:      {avg_rmse:.2f}")
        print(f"\nBest Models (by R²):")
        top3 = sorted(all_scores, key=lambda x: x['r2'], reverse=True)[:3]
        for i, s in enumerate(top3, 1):
            print(f"  {i}. {s['city']}: R²={s['r2']:.4f} ({s.get('algorithm', 'N/A')})")
        
        # Algorithm usage stats
        algos = {}
        for s in all_scores:
            algo = s.get('algorithm', 'Unknown')
            algos[algo] = algos.get(algo, 0) + 1
        print(f"\nAlgorithm Usage:")
        for algo, count in sorted(algos.items(), key=lambda x: -x[1]):
            print(f"  {algo}: {count} cities")
    print(f"{'='*60}")

if __name__ == '__main__':
    train_all_models()
