import os
import yaml
import datetime
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional

from ..providers.agro.open_meteo import OpenMeteoProvider
from ..db.connection import get_db
from sqlalchemy import text

logger = logging.getLogger("phytosense.cultivation")

def trapezoid(x: float, a: float, b: float, c: float, d: float) -> float:
    """
    FAO-ECOCROP trapezoidal membership function:
    a = abs_min, b = opt_min, c = opt_max, d = abs_max
    """
    if x <= a or x >= d:
        return 0.0
    if b <= x <= c:
        return 1.0
    if x < b:
        return (x - a) / (b - a) if (b - a) != 0 else 1.0
    else:
        return (d - x) / (d - c) if (d - c) != 0 else 1.0

class CultivationService:
    def __init__(self):
        self.weather_provider = OpenMeteoProvider()
        self.crop_params = self._load_crop_params()

    def _load_crop_params(self) -> Dict[str, Any]:
        curr = Path(__file__).resolve()
        possible_paths = [
            curr.parents[2] / "config" / "crop_params.yaml",
            curr.parents[4] / "services" / "api" / "config" / "crop_params.yaml",
            Path("services/api/config/crop_params.yaml"),
            Path("config/crop_params.yaml"),
        ]
        for p in possible_paths:
            if p.exists():
                with open(p, "r", encoding="utf-8") as f:
                    return yaml.safe_load(f) or {}
        return {}

    def _find_crop_profile(self, name_or_id: Optional[str] = None) -> Dict[str, Any]:
        crops = self.crop_params.get("crops", {})
        default_profile = self.crop_params.get("default_mediterranean", {})

        if not name_or_id:
            return default_profile

        target = str(name_or_id).lower().strip()

        # 1. Direct key match
        for key, profile in crops.items():
            if key.lower() == target:
                return profile
            for alias in profile.get("names", []):
                if target in alias.lower() or alias.lower() in target:
                    return profile

        return default_profile

    async def evaluate_suitability(
        self,
        lat: float,
        lon: float,
        plant_id: Optional[int] = None,
        scientific_name: Optional[str] = None,
        soil_ph: float = 7.2
    ) -> Dict[str, Any]:
        """
        Calculates agronomic suitability score (0.0 to 1.0) using limiting factor formula:
        suitability = min over v of f_v(x_v)
        """
        crop_profile = self._find_crop_profile(scientific_name or (str(plant_id) if plant_id else None))
        weather = await self.weather_provider.get_agro_weather(lat, lon, days=7)
        summary = weather["summary_7d"]

        # Environmental factors
        t_ranges = crop_profile.get("temp", {})
        rain_ranges = crop_profile.get("rain", {})
        ph_ranges = crop_profile.get("ph", {})

        # Compute factor scores
        score_tmin = trapezoid(
            summary["t_min"],
            t_ranges.get("abs_min", -5.0),
            t_ranges.get("opt_min", 12.0),
            t_ranges.get("opt_max", 30.0),
            t_ranges.get("abs_max", 42.0)
        )

        score_tmean = trapezoid(
            summary["t_mean"],
            t_ranges.get("abs_min", -5.0),
            t_ranges.get("opt_min", 14.0),
            t_ranges.get("opt_max", 28.0),
            t_ranges.get("abs_max", 40.0)
        )

        annual_rain = summary.get("estimated_annual_rain_mm", 450.0)
        score_rain = trapezoid(
            annual_rain,
            rain_ranges.get("abs_min", 200.0),
            rain_ranges.get("opt_min", 400.0),
            rain_ranges.get("opt_max", 800.0),
            rain_ranges.get("abs_max", 1400.0)
        )

        score_ph = trapezoid(
            soil_ph,
            ph_ranges.get("abs_min", 5.5),
            ph_ranges.get("opt_min", 6.5),
            ph_ranges.get("opt_max", 8.2),
            ph_ranges.get("abs_max", 9.0)
        )

        factors = {
            "temperature_min": {
                "score": round(score_tmin, 3),
                "current_val": summary["t_min"],
                "unit": "°C",
                "optimal": f"{t_ranges.get('opt_min')} - {t_ranges.get('opt_max')} °C",
                "risk": "Gel ou froid excessif" if summary["t_min"] < t_ranges.get("opt_min", 10.0) else None,
                "mitigation": "Protéger par paillage ou voile d'hivernage en cas de gel nocturne."
            },
            "temperature_mean": {
                "score": round(score_tmean, 3),
                "current_val": summary["t_mean"],
                "unit": "°C",
                "optimal": f"{t_ranges.get('opt_min')} - {t_ranges.get('opt_max')} °C",
                "risk": "Chaleur excessive" if summary["t_mean"] > t_ranges.get("opt_max", 28.0) else None,
                "mitigation": "Créer un ombrage partiel aux heures les plus chaudes de la journée."
            },
            "precipitation": {
                "score": round(score_rain, 3),
                "current_val": annual_rain,
                "unit": "mm/an",
                "optimal": f"{rain_ranges.get('opt_min')} - {rain_ranges.get('opt_max')} mm/an",
                "risk": "Déficit hydrique" if annual_rain < rain_ranges.get("opt_min", 400.0) else None,
                "mitigation": "Compléter impérativement par une irrigation goutte-à-goutte régulière."
            },
            "soil_ph": {
                "score": round(score_ph, 3),
                "current_val": soil_ph,
                "unit": "pH",
                "optimal": f"{ph_ranges.get('opt_min')} - {ph_ranges.get('opt_max')}",
                "risk": "Sol trop calcaire ou trop acide" if score_ph < 0.5 else None,
                "mitigation": "Amender le sol avec de la matière organique bien décomposée ou du compost."
            }
        }

        # Limiting factor is the minimum score
        limiting_key = min(factors.keys(), key=lambda k: factors[k]["score"])
        limiting_factor = factors[limiting_key]
        suitability_score = limiting_factor["score"]

        # Classification
        if suitability_score >= 0.80:
            category = "excellent"
            category_label = "Excellente adaptation"
            badge_color = "#10b981" # emerald
        elif suitability_score >= 0.50:
            category = "good"
            category_label = "Bonne adaptation"
            badge_color = "#3b82f6" # blue
        elif suitability_score >= 0.25:
            category = "marginal"
            category_label = "Adaptation marginale"
            badge_color = "#f59e0b" # amber
        else:
            category = "not_suitable"
            category_label = "Conditions défavorables"
            badge_color = "#ef4444" # red

        return {
            "suitability_score": round(suitability_score, 2),
            "suitability_percent": int(suitability_score * 100),
            "category": category,
            "category_label": category_label,
            "badge_color": badge_color,
            "limiting_factor": {
                "name": limiting_key,
                "score": limiting_factor["score"],
                "detail": f"{limiting_factor['current_val']} {limiting_factor['unit']} (Optimum: {limiting_factor['optimal']})",
                "mitigation_tip": limiting_factor["mitigation"]
            },
            "factors": factors,
            "weather_snapshot": {
                "location": {"lat": lat, "lon": lon},
                "source": weather["source"],
                "t_min_7d": summary["t_min"],
                "t_max_7d": summary["t_max"],
                "soil_temp_c": weather["current_soil_temp_c"],
                "soil_moisture": weather["current_soil_moisture_m3m3"]
            }
        }

    async def get_planting_calendar(
        self,
        lat: float,
        lon: float,
        plant_id: Optional[int] = None,
        scientific_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Planting and harvest calendar based on thermal time (GDD) and frost probabilities.
        """
        crop_profile = self._find_crop_profile(scientific_name or (str(plant_id) if plant_id else None))
        weather = await self.weather_provider.get_agro_weather(lat, lon, days=7)
        summary = weather["summary_7d"]

        current_month = datetime.date.today().month
        sowing_months = crop_profile.get("sowing_months", [3, 4, 10])
        harvest_months = crop_profile.get("harvest_months", [5, 6, 7])

        is_sowing_season = current_month in sowing_months
        is_harvest_season = current_month in harvest_months

        # Compute 7-day GDD (Growing Degree Days)
        gdd_base = crop_profile.get("gdd_base", 10.0)
        gdd_7d = sum(
            max(0.0, ((day["temp_max"] + day["temp_min"]) / 2.0) - gdd_base)
            for day in weather["forecast"]
        )

        # Weather alerts
        alerts = []
        if summary["t_min"] <= 1.0:
            alerts.append({
                "type": "frost_warning",
                "severity": "high",
                "message": f"Risque de gelée ({summary['t_min']} °C) cette semaine. Protégez les jeunes pousses."
            })
        if summary["t_max"] >= 38.0:
            alerts.append({
                "type": "heatwave_warning",
                "severity": "high",
                "message": f"Pic de canicule prévu ({summary['t_max']} °C). Arroser tôt le matin."
            })
        if is_harvest_season and summary["rain_sum_mm"] > 10.0:
            alerts.append({
                "type": "harvest_rain_warning",
                "severity": "medium",
                "message": "Pluies prévues durant la période de récolte. Reporter la cueillette pour éviter le pourrissement."
            })

        month_names = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"]

        calendar_grid = []
        for m in range(1, 13):
            calendar_grid.append({
                "month_num": m,
                "month_name": month_names[m - 1],
                "is_current": m == current_month,
                "can_sow": m in sowing_months,
                "can_harvest": m in harvest_months
            })

        return {
            "current_month": current_month,
            "is_sowing_season": is_sowing_season,
            "is_harvest_season": is_harvest_season,
            "sowing_months": sowing_months,
            "harvest_months": harvest_months,
            "harvest_advice": crop_profile.get("harvest_advice", "Récolter par matin sec et ensoleillé."),
            "gdd_base_c": gdd_base,
            "gdd_accumulated_7d": round(gdd_7d, 1),
            "alerts": alerts,
            "calendar_grid": calendar_grid
        }

    async def get_irrigation_plan(
        self,
        lat: float,
        lon: float,
        plant_id: Optional[int] = None,
        scientific_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        7-day irrigation plan:
        daily water need (mm) = max(0, Kc * ET0 - effective_rain)
        1 mm = 1 L/m²
        """
        crop_profile = self._find_crop_profile(scientific_name or (str(plant_id) if plant_id else None))
        weather = await self.weather_provider.get_agro_weather(lat, lon, days=7)
        kc = crop_profile.get("kc_mid", 0.70)

        plan = []
        total_water_litres = 0.0

        for day in weather["forecast"]:
            et0 = day["et0_mm"]
            rain = day["rain_mm"]
            # Effective rainfall (approx 80% if > 5mm)
            effective_rain = rain * 0.8 if rain > 5.0 else rain * 0.4
            raw_need = (kc * et0) - effective_rain
            need_mm = max(0.0, round(raw_need, 1))
            litres_per_m2 = need_mm # 1 mm = 1 Litre / m²

            total_water_litres += litres_per_m2

            recommendation = (
                "Aucun arrosage requis (pluie suffisante)" if litres_per_m2 == 0.0
                else f"Arroser {litres_per_m2} L/m²"
            )

            plan.append({
                "date": day["date"],
                "et0_mm": round(et0, 1),
                "rain_mm": round(rain, 1),
                "water_need_litres_per_m2": litres_per_m2,
                "recommendation": recommendation,
                "temp_max": day["temp_max"]
            })

        return {
            "crop_coefficient_kc": kc,
            "soil_moisture_index": weather.get("current_soil_moisture_m3m3", 0.2),
            "weekly_total_litres_m2": round(total_water_litres, 1),
            "daily_plan": plan,
            "practical_tips": [
                "1 mm de besoin correspond à exactement 1 litre d'eau par mètre carré.",
                "En sol sableux (typique de plusieurs régions steppiques), privilégier des arrosages plus fréquents en plus faibles volumes.",
                "Arroser au pied des plantes tôt le matin pour limiter les pertes par évaporation et éviter le développement de mildiou."
            ]
        }

cultivation_service = CultivationService()
