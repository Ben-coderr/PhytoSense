import logging
from typing import Dict, Any, List
import httpx

logger = logging.getLogger("phytosense.agro.open_meteo")

class OpenMeteoProvider:
    """
    Open-Meteo Free Agro-Meteorological Provider.
    Queries daily FAO-56 reference evapotranspiration (ET0),
    temperatures (min, max, mean), precipitation, and soil conditions.
    """

    BASE_URL = "https://api.open-meteo.com/v1/forecast"

    async def get_agro_weather(self, lat: float, lon: float, days: int = 7) -> Dict[str, Any]:
        params = {
            "latitude": lat,
            "longitude": lon,
            "daily": [
                "temperature_2m_max",
                "temperature_2m_min",
                "temperature_2m_mean",
                "precipitation_sum",
                "et0_fao_evapotranspiration"
            ],
            "hourly": [
                "soil_temperature_0cm",
                "soil_moisture_0_to_1cm"
            ],
            "timezone": "auto",
            "forecast_days": min(max(days, 1), 14)
        }

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(self.BASE_URL, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    return self._parse_response(data, lat, lon)
                else:
                    logger.warning(f"Open-Meteo returned status {resp.status_code}, falling back to climate normal.")
                    return self._fallback_agro_weather(lat, lon, days)
        except Exception as e:
            logger.warning(f"Open-Meteo request failed ({str(e)}), falling back to climate normal.")
            return self._fallback_agro_weather(lat, lon, days)

    def _parse_response(self, data: Dict[str, Any], lat: float, lon: float) -> Dict[str, Any]:
        daily = data.get("daily", {})
        dates = daily.get("time", [])
        t_max = daily.get("temperature_2m_max", [])
        t_min = daily.get("temperature_2m_min", [])
        t_mean = daily.get("temperature_2m_mean", [])
        rain = daily.get("precipitation_sum", [])
        et0 = daily.get("et0_fao_evapotranspiration", [])

        # Hourly soil averages
        hourly = data.get("hourly", {})
        soil_temps = hourly.get("soil_temperature_0cm", [])
        soil_moistures = hourly.get("soil_moisture_0_to_1cm", [])

        avg_soil_temp = (
            sum(soil_temps) / len(soil_temps) if soil_temps else (sum(t_mean) / len(t_mean) if t_mean else 18.0)
        )
        avg_soil_moisture = (
            sum(soil_moistures) / len(soil_moistures) if soil_moistures else 0.22
        )

        days_list = []
        for i in range(len(dates)):
            days_list.append({
                "date": dates[i],
                "temp_max": t_max[i] if i < len(t_max) else 22.0,
                "temp_min": t_min[i] if i < len(t_min) else 12.0,
                "temp_mean": t_mean[i] if i < len(t_mean) else 17.0,
                "rain_mm": rain[i] if i < len(rain) else 0.0,
                "et0_mm": et0[i] if i < len(et0) else 3.5
            })

        overall_min = min(t_min) if t_min else 10.0
        overall_max = max(t_max) if t_max else 25.0
        overall_mean = sum(t_mean) / len(t_mean) if t_mean else 17.5
        total_rain = sum(rain) if rain else 0.0
        total_et0 = sum(et0) if et0 else 24.5

        return {
            "source": "open-meteo",
            "lat": lat,
            "lon": lon,
            "elevation": data.get("elevation", 0),
            "current_soil_temp_c": round(avg_soil_temp, 1),
            "current_soil_moisture_m3m3": round(avg_soil_moisture, 3),
            "forecast": days_list,
            "summary_7d": {
                "t_min": round(overall_min, 1),
                "t_max": round(overall_max, 1),
                "t_mean": round(overall_mean, 1),
                "rain_sum_mm": round(total_rain, 1),
                "et0_sum_mm": round(total_et0, 1),
                # Annual rain projection proxy for suitability formula
                "estimated_annual_rain_mm": max(200.0, round(total_rain * 52.0 * 0.4 + 350.0, 1))
            }
        }

    def _fallback_agro_weather(self, lat: float, lon: float, days: int) -> Dict[str, Any]:
        """
        Graceful zero-network offline climate fallback based on Mediterranean / Steppic Algerian averages.
        """
        import datetime
        today = datetime.date.today()
        # North Algeria (lat > 35) is Mediterranean; South is Saharan/Arid
        is_arid = lat < 34.0
        base_t_mean = 24.0 if is_arid else 18.0
        base_rain = 0.0 if is_arid else 2.5
        base_et0 = 5.2 if is_arid else 3.8

        days_list = []
        for i in range(days):
            d = today + datetime.timedelta(days=i)
            days_list.append({
                "date": d.isoformat(),
                "temp_max": base_t_mean + 6.0,
                "temp_min": max(2.0, base_t_mean - 6.0),
                "temp_mean": base_t_mean,
                "rain_mm": base_rain if i % 4 == 1 else 0.0,
                "et0_mm": base_et0
            })

        return {
            "source": "climate-normals-fallback",
            "lat": lat,
            "lon": lon,
            "elevation": 150.0,
            "current_soil_temp_c": round(base_t_mean - 1.0, 1),
            "current_soil_moisture_m3m3": 0.15 if is_arid else 0.28,
            "forecast": days_list,
            "summary_7d": {
                "t_min": round(base_t_mean - 6.0, 1),
                "t_max": round(base_t_mean + 6.0, 1),
                "t_mean": round(base_t_mean, 1),
                "rain_sum_mm": round(base_rain, 1),
                "et0_sum_mm": round(base_et0 * days, 1),
                "estimated_annual_rain_mm": 150.0 if is_arid else 550.0
            }
        }
