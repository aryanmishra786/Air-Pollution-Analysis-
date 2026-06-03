import pandas as pd

# Load datasets from CSV files
global_pollution = pd.read_csv('../global_air_pollution_data.csv')
pollution_assessment = pd.read_csv('../air_quality_pollution_assement.csv')
# india_air_quality has encoding issues, skip it
# india_air_quality = pd.read_csv('../india_air_quality.csv')

# Standardize column names
global_pollution.columns = global_pollution.columns.str.lower().str.replace(' ', '_')
pollution_assessment.columns = pollution_assessment.columns.str.lower().str.replace(' ', '_')

# Merge datasets
combined_df = pd.concat([global_pollution, pollution_assessment],
                        ignore_index=True)

print(f"Total Records: {len(combined_df)}")
print(f"Columns: {list(combined_df.columns)}")
print("\nGlobal Pollution shape:", global_pollution.shape)
print("Pollution Assessment shape:", pollution_assessment.shape)

# Export to CSV for MySQL import
combined_df.to_csv('master_aqi_data.csv', index=False)
print("Data exported to master_aqi_data.csv")
