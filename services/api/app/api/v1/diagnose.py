from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ...services.diagnose_service import diagnose_symptoms, DIAGNOSTIC_RULES

router = APIRouter(prefix="/diagnose", tags=["diagnose"])

class DiagnoseRequest(BaseModel):
    symptoms: List[str] = Field(..., description="Observed symptom tags e.g. ['white_spots', 'powdery_coating']")
    plant_name: Optional[str] = None
    language: str = "fr"

@router.get("/symptoms")
def get_symptoms_list():
    symptom_catalog = [
        {"id": "white_spots", "label_fr": "Taches ou feutrage blanc poudreux", "label_en": "White powdery coating", "label_ar": "بقع أو مسحوق أبيض"},
        {"id": "powdery_coating", "label_fr": "Feuilles recouvertes de poussière blanche", "label_en": "White dust on leaves", "label_ar": "غبار أبيض على الأوراق"},
        {"id": "yellow_patches", "label_fr": "Taches d'huile ou jaunâtres sur le dessus", "label_en": "Yellowish oil patches", "label_ar": "بقع صفراء زيتية"},
        {"id": "brown_spots", "label_fr": "Taches brunes nécrotiques", "label_en": "Brown necrotic spots", "label_ar": "بقع بنية جافة"},
        {"id": "white_underside", "label_fr": "Duvet grisâtre/violacé sous les feuilles", "label_en": "Fuzzy growth on underside", "label_ar": "زغب رمادي أسفل الورقة"},
        {"id": "sticky_leaves", "label_fr": "Feuilles collantes (miellat)", "label_en": "Sticky honeydew on leaves", "label_ar": "إفرازات لزجة على الأوراق"},
        {"id": "curled_shoots", "label_fr": "Jeunes pousses déformées / crispées", "label_en": "Curled / twisted shoots", "label_ar": "التواء البراعم الصغيرة"},
        {"id": "tiny_insects", "label_fr": "Petits insectes visibles sous les feuilles", "label_en": "Small visible insects", "label_ar": "حشرات دقيقة مرئية"},
        {"id": "pale_leaves", "label_fr": "Feuilles pâles / jaunissement uniforme", "label_en": "Uniform leaf chlorosis", "label_ar": "شحوب واصفرار شامل للأوراق"},
        {"id": "yellow_lower_leaves", "label_fr": "Jaunissement débutant par les feuilles du bas", "label_en": "Lower leaves turning yellow first", "label_ar": "اصفرار يبدأ من الأوراق السفلية"},
        {"id": "stunted_growth", "label_fr": "Croissance ralentie / tiges grêles", "label_en": "Stunted growth / weak stems", "label_ar": "توقف أو بطء النمو"},
        {"id": "wilting_wet_soil", "label_fr": "Flétrissement alors que la terre est mouillée", "label_en": "Wilting despite wet soil", "label_ar": "ذبول بالرغم من رطوبة التربة"},
        {"id": "blackened_stem", "label_fr": "Noircissement du collet ou de la tige", "label_en": "Blackened stem base / collar", "label_ar": "اسوداد أسفل الساق"},
        {"id": "leaf_drop", "label_fr": "Chute prématurée des feuilles", "label_en": "Premature leaf shedding", "label_ar": "تساقط الأوراق مبكراً"}
    ]
    return {"symptoms": symptom_catalog}

@router.post("")
def diagnose_plant_health(req: DiagnoseRequest):
    try:
        return diagnose_symptoms(symptoms=req.symptoms, plant_name=req.plant_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Diagnostic evaluation failed: {str(e)}")
