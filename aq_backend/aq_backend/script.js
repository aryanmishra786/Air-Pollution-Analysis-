// generate_synthetic_aqi.js
const fs = require('fs');

const cities = [
  { city: 'London', country: 'UK', profile: 'moderate' },
  { city: 'Delhi', country: 'India', profile: 'high' },
  { city: 'Beijing', country: 'China', profile: 'high' },
  { city: 'New York', country: 'USA', profile: 'moderate' },
  { city: 'Helsinki', country: 'Finland', profile: 'low' },
  { city: 'Sydney', country: 'Australia', profile: 'low' },
  { city: 'Mumbai', country: 'India', profile: 'high' },
  { city: 'Kolkata', country: 'India', profile: 'high' },
  { city: 'Chennai', country: 'India', profile: 'moderate' },
  { city: 'Bangalore', country: 'India', profile: 'moderate' },
  { city: 'Shanghai', country: 'China', profile: 'high' },
  { city: 'Guangzhou', country: 'China', profile: 'high' },
  { city: 'Shenzhen', country: 'China', profile: 'moderate' },
  { city: 'Los Angeles', country: 'USA', profile: 'moderate' },
  { city: 'Chicago', country: 'USA', profile: 'moderate' },
  { city: 'Houston', country: 'USA', profile: 'moderate' },
  { city: 'Paris', country: 'France', profile: 'moderate' },
  { city: 'Berlin', country: 'Germany', profile: 'moderate' },
  { city: 'Madrid', country: 'Spain', profile: 'moderate' },
  { city: 'Rome', country: 'Italy', profile: 'moderate' },
  { city: 'Tokyo', country: 'Japan', profile: 'moderate' },
  { city: 'Osaka', country: 'Japan', profile: 'moderate' },
  { city: 'Moscow', country: 'Russia', profile: 'moderate' },
  { city: 'Saint Petersburg', country: 'Russia', profile: 'moderate' },
  { city: 'Cairo', country: 'Egypt', profile: 'high' },
  { city: 'Johannesburg', country: 'South Africa', profile: 'moderate' },
  { city: 'Nairobi', country: 'Kenya', profile: 'low' },
  { city: 'Santiago', country: 'Chile', profile: 'moderate' },
  { city: 'Buenos Aires', country: 'Argentina', profile: 'moderate' },
  { city: 'São Paulo', country: 'Brazil', profile: 'high' },
  { city: 'Rio de Janeiro', country: 'Brazil', profile: 'moderate' },
  { city: 'Toronto', country: 'Canada', profile: 'low' },
  { city: 'Vancouver', country: 'Canada', profile: 'low' },
  { city: 'Singapore', country: 'Singapore', profile: 'moderate' },
  { city: 'Bangkok', country: 'Thailand', profile: 'high' },
  { city: 'Jakarta', country: 'Indonesia', profile: 'high' },
  { city: 'Manila', country: 'Philippines', profile: 'high' },
  { city: 'Zurich', country: 'Switzerland', profile: 'low' },
  { city: 'Oslo', country: 'Norway', profile: 'low' },
  { city: 'Wellington', country: 'New Zealand', profile: 'low' }
];

function randomInRange(min, max) {
  return min + Math.random() * (max - min);
}

function seasonalTemp(base, month) {
  const seasonal = Math.cos(((month - 6) / 6) * Math.PI) * 10;
  return base + seasonal + randomInRange(-3, 3);
}

function genPollutants(profile) {
  let pm25Base, pm10Base;

  if (profile === 'high') {
    pm25Base = randomInRange(80, 200);
    pm10Base = randomInRange(100, 300);
  } else if (profile === 'moderate') {
    pm25Base = randomInRange(30, 120);
    pm10Base = randomInRange(40, 200);
  } else {
    pm25Base = randomInRange(5, 60);
    pm10Base = randomInRange(10, 100);
  }

  const NO2 = randomInRange(10, 80);
  const SO2 = randomInRange(5, 40);
  const CO = randomInRange(0.1, 3.5);
  const O3 = randomInRange(10, 150);

  return { pm25: pm25Base, pm10: pm10Base, NO2, SO2, CO, O3 };
}

function calcAQI(pm25, pm10, wind) {
  let aqi = pm25 * 0.6 + pm10 * 0.3;
  aqi -= wind * 0.3;
  if (aqi < 5) aqi = 5;
  if (aqi > 500) aqi = 500;
  return Math.round(aqi);
}

function* dateRange(start, end) {
  const current = new Date(start);
  const last = new Date(end);
  while (current <= last) {
    yield new Date(current);
    current.setDate(current.getDate() + 1);
  }
}

async function main() {
  const out = fs.createWriteStream('data/data_aqi_2015_2025.json', { flags: 'w' });

  const startDate = '2020-01-01';
  const endDate = '2025-12-31'; // keep small while testing

  out.write('['); // start JSON array
  let first = true;

  for (const d of dateRange(startDate, endDate)) {
    const excelSerial = Math.floor((d - new Date('1899-12-30')) / (1000 * 60 * 60 * 24));
    const month = d.getMonth();

    for (const c of cities) {
      const temp = seasonalTemp(
        c.profile === 'high' ? 20 : c.profile === 'moderate' ? 15 : 10,
        month
      );
      const humidity = Math.round(randomInRange(30, 95));
      const wind = randomInRange(0.1, 15);

      const { pm25, pm10, NO2, SO2, CO, O3 } = genPollutants(c.profile);
      const aqi = calcAQI(pm25, pm10, wind);

      const record = {
        Date: excelSerial,
        City: c.city,
        Country: c.country,
        AQI: aqi,
        PM2_5: Number(pm25.toFixed(1)),
        PM10: Number(pm10.toFixed(1)),
        NO2: Number(NO2.toFixed(1)),
        SO2: Number(SO2.toFixed(1)),
        CO: Number(CO.toFixed(2)),
        O3: Number(O3.toFixed(1)),
        Temperature: Math.round(temp),
        Humidity: humidity,
        WindSpeed: Number(wind.toFixed(1))
      };

      if (!first) {
        out.write(',\n');
      } else {
        first = false;
      }
      out.write(JSON.stringify(record));
    }
  }

  out.write(']\n'); // end JSON array
  out.end();
  out.on('finish', () => {
    console.log('Synthetic AQI JSON array generated.');
  });
}

main().catch(console.error);
