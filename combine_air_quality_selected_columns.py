import argparse
from pathlib import Path
from typing import List, Optional

import numpy as np
import pandas as pd

TARGET_COLUMNS = [
    'aqi_id', 'a_date', 'city', 'country', 'aqi', 'pm2', 'pm10',
    'no2', 'so2', 'co', 'o3', 'temprature', 'humidity', 'wind_speed'
]

CATEGORY_TO_AQI = {
    'good': 50,
    'satisfactory': 100,
    'moderate': 200,
    'poor': 300,
    'very poor': 400,
    'severe': 500,
    'hazardous': 500,
    'unhealthy': 400,
}

STANDARDIZE_MAP = {
    'temperature': 'temprature',
    'pm2.5': 'pm2',
    'pm25': 'pm2',
    'rspm': 'pm10',
    'location': 'city',
    'city_name': 'city',
    'country_name': 'country',
    'aqi_value': 'aqi',
    'date': 'a_date',
    'sampling_date': 'a_date',
    'ozone_aqi_value': 'o3',
}


def read_csv_safely(file_path: str) -> pd.DataFrame:
    encodings = ['utf-8', 'latin1', 'cp1252', 'ISO-8859-1']
    last_error: Optional[Exception] = None
    for encoding in encodings:
        try:
            return pd.read_csv(file_path, encoding=encoding, low_memory=False)
        except Exception as exc:
            last_error = exc
    raise RuntimeError(f'Could not read {file_path}: {last_error}')


def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df.columns = [
        str(col).strip().lower().replace('\t', '').replace(' ', '_')
        for col in df.columns
    ]
    return df


def standardize_and_select(df: pd.DataFrame, file_path: str) -> pd.DataFrame:
    df = normalize_columns(df)

    # Handle date columns before bulk rename to avoid duplicate a_date columns.
    if 'date' in df.columns and 'sampling_date' in df.columns:
        combined_date = pd.to_datetime(df['date'], errors='coerce')
        sampling_date = pd.to_datetime(df['sampling_date'], errors='coerce')
        df['a_date'] = combined_date.fillna(sampling_date)
        df = df.drop(columns=['date', 'sampling_date'])
    elif 'date' in df.columns:
        df['a_date'] = pd.to_datetime(df['date'], errors='coerce')
        df = df.drop(columns=['date'])
    elif 'sampling_date' in df.columns:
        df['a_date'] = pd.to_datetime(df['sampling_date'], errors='coerce')
        df = df.drop(columns=['sampling_date'])

    df = df.rename(columns=STANDARDIZE_MAP)
    df = df.loc[:, ~df.columns.duplicated()]

    # Build requested output schema only.
    out = pd.DataFrame(index=df.index)

    # aqi_id
    out['aqi_id'] = np.nan

    # a_date from date / sampling_date
    if 'a_date' in df.columns:
        out['a_date'] = pd.to_datetime(df['a_date'], errors='coerce')
    else:
        out['a_date'] = pd.NaT

    # city
    out['city'] = df['city'] if 'city' in df.columns else 'Unknown'

    # country
    if 'country' in df.columns:
        out['country'] = df['country']
    elif 'state' in df.columns or 'stn_code' in df.columns:
        out['country'] = 'India'
    else:
        out['country'] = 'Unknown'

    # aqi feature engineering / harmonization
    if 'aqi' in df.columns:
        out['aqi'] = pd.to_numeric(df['aqi'], errors='coerce')
    elif 'air_quality' in df.columns:
        out['aqi'] = df['air_quality'].astype(str).str.lower().str.strip().map(CATEGORY_TO_AQI)
    elif 'aqi_category' in df.columns:
        out['aqi'] = df['aqi_category'].astype(str).str.lower().str.strip().map(CATEGORY_TO_AQI)
    else:
        out['aqi'] = np.nan

    # pollutant columns
    for col in ['pm2', 'pm10', 'no2', 'so2', 'co', 'o3', 'temprature', 'humidity']:
        if col in df.columns:
            out[col] = pd.to_numeric(df[col], errors='coerce')
        else:
            out[col] = np.nan

    # wind_speed is not present in the 3 provided files; create it.
    out['wind_speed'] = np.nan

    return out[TARGET_COLUMNS]


def clean_and_engineer(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    # Remove duplicates.
    df = df.drop_duplicates()

    # Trim text fields.
    for col in ['city', 'country']:
        df[col] = df[col].astype(str).str.strip()
        df[col] = df[col].replace({'': np.nan, 'nan': np.nan, 'none': np.nan, 'None': np.nan})

    numeric_cols = ['aqi', 'pm2', 'pm10', 'no2', 'so2', 'co', 'o3', 'temprature', 'humidity', 'wind_speed']
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors='coerce')

    # Invalid negative values -> NaN.
    non_negative_cols = ['aqi', 'pm2', 'pm10', 'no2', 'so2', 'co', 'o3', 'humidity', 'wind_speed']
    for col in non_negative_cols:
        df.loc[df[col] < 0, col] = np.nan

    # Temperature sanity range.
    df.loc[(df['temprature'] < -50) | (df['temprature'] > 70), 'temprature'] = np.nan

    # Humidity sanity range.
    df.loc[(df['humidity'] < 0) | (df['humidity'] > 100), 'humidity'] = np.nan

    # Drop rows where nearly everything is missing.
    important_cols = ['aqi', 'pm2', 'pm10', 'no2', 'so2', 'co', 'o3', 'temprature', 'humidity']
    df = df.dropna(subset=important_cols, thresh=2)

    # IQR-based clipping for significant outlier cleanup.
    for col in numeric_cols:
        series = df[col].dropna()
        if series.empty:
            continue
        q1 = series.quantile(0.25)
        q3 = series.quantile(0.75)
        iqr = q3 - q1
        if pd.isna(iqr) or iqr == 0:
            continue
        lower = q1 - 1.5 * iqr
        upper = q3 + 1.5 * iqr
        df[col] = df[col].clip(lower, upper)

    # Impute numeric NaNs with median; if a column is completely missing, use 0.
    for col in numeric_cols:
        median = df[col].median()
        if pd.isna(median):
            median = 0
        df[col] = df[col].fillna(median)

    # Impute text NaNs.
    for col in ['city', 'country']:
        mode = df[col].mode(dropna=True)
        fill_value = mode.iloc[0] if not mode.empty else 'Unknown'
        df[col] = df[col].fillna(fill_value)

    # Final date handling.
    df['a_date'] = pd.to_datetime(df['a_date'], errors='coerce')
    if df['a_date'].notna().any():
        fallback_date = df['a_date'].dropna().mode().iloc[0]
        df['a_date'] = df['a_date'].fillna(fallback_date)
    else:
        df['a_date'] = pd.Timestamp('2000-01-01')

    # Feature engineering for missing AQI values when needed.
    pollution_proxy = df[['pm2', 'pm10', 'no2', 'so2', 'co', 'o3']].mean(axis=1)
    df['aqi'] = np.where(df['aqi'] <= 0, pollution_proxy, df['aqi'])

    # Rebuild sequential id after cleaning.
    df = df.reset_index(drop=True)
    df['aqi_id'] = np.arange(1, len(df) + 1)

    # Keep only requested columns in the exact order.
    return df[TARGET_COLUMNS]


def combine_and_process(file_paths: List[str], output_path: str) -> pd.DataFrame:
    frames = []
    for file_path in file_paths:
        df = read_csv_safely(file_path)
        df = standardize_and_select(df, file_path)
        frames.append(df)

    combined = pd.concat(frames, ignore_index=True, sort=False)
    combined = clean_and_engineer(combined)
    combined.to_csv(output_path, index=False)
    return combined


def main() -> None:
    parser = argparse.ArgumentParser(
        description='Combine 3 air-quality CSV files, keep only selected columns, clean data, and apply feature engineering.'
    )
    parser.add_argument(
        '--inputs',
        nargs='+',
        required=True,
        help='Input CSV file paths.'
    )
    parser.add_argument(
        '--output',
        required=True,
        help='Output CSV file path.'
    )
    args = parser.parse_args()

    combined = combine_and_process(args.inputs, args.output)
    print(f'Saved cleaned file to: {args.output}')
    print(f'Final shape: {combined.shape}')
    print('Columns kept:')
    print(TARGET_COLUMNS)


if __name__ == '__main__':
    main()
