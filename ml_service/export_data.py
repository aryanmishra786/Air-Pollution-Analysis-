import pandas as pd
import mysql.connector
from config import DB_CONFIG

# Connect to MySQL
conn = mysql.connector.connect(**DB_CONFIG)

# Export all data to CSV
query = """
    SELECT a_date as date, city, aqi, pm2, pm10, no2, so2, co, o3, 
           temprature, humidity, wind_speed
    FROM tbl_aqi_data 
    ORDER BY a_date ASC
"""

df = pd.read_sql(query, conn)
conn.close()

# Convert columns to float
for col in ['aqi', 'pm2', 'pm10', 'no2', 'so2', 'co', 'o3', 'temprature', 'humidity', 'wind_speed']:
    if col in df.columns:
        df[col] = df[col].astype(float)

print(f"Total Records: {len(df)}")
print(f"Cities Covered: {df['city'].nunique()}")
print(f"Date Range: {df['date'].min()} to {df['date'].max()}")

# Export to CSV
df.to_csv('master_aqi_data.csv', index=False)
print("\nExported to master_aqi_data.csv")
