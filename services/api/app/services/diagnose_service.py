import logging
from typing import List, Optional, Dict, Any

logger = logging.getLogger("phytosense.diagnose")

# Controlled diagnostic database for plant diseases, deficiencies, and pests
DIAGNOSTIC_RULES = [
    {
        "id": "powdery_mildew",
        "name_fr": "Oïdium (Maladie du blanc)",
        "name_en": "Powdery Mildew",
        "name_ar": "مرض البياض الدقيقي",
        "category": "fungal",
        "triggers": ["white_spots", "powdery_coating", "leaf_curl"],
        "description": "Feutrage blanc farineux sur les faces supérieures des feuilles, déformation foliaire.",
        "organic_treatment": [
            "Pulvériser du bicarbonate de soude (5 g/L d'eau) mélangé à 1 cuillère à café de savon noir.",
            "Appliquer du purin de prêle riche en silice pour renforcer la cuticule des feuilles.",
            "Décoction d'ail ou solution aqueuse à 0.1% d'huile essentielle de Thym à thymol."
        ],
        "prevention": "Éviter de mouiller le feuillage lors des arrosages et aérer la plantation."
    },
    {
        "id": "downy_mildew",
        "name_fr": "Mildiou",
        "name_en": "Downy Mildew",
        "name_ar": "مرض البياض الزغبي (الميلديو)",
        "category": "fungal",
        "triggers": ["yellow_patches", "brown_spots", "white_underside"],
        "description": "Taches d'huile jaunâtres sur la face supérieure, duvet grisâtre/violacé au revers.",
        "organic_treatment": [
            "Bouillie bordelaise (sulfate de cuivre) à dose raisonnée avant la propagation.",
            "Décoction de prêle en pulvérisation foliaire tous les 10 jours.",
            "Éliminer et brûler immédiatement les feuilles lourdement infectées."
        ],
        "prevention": "Favoriser une excellente circulation d'air et espacer les plants."
    },
    {
        "id": "aphids",
        "name_fr": "Pucerons",
        "name_en": "Aphids",
        "name_ar": "حشرات المن",
        "category": "pest",
        "triggers": ["sticky_leaves", "curled_shoots", "tiny_insects"],
        "description": "Enroulement des jeunes pousses, présence de miellat collant et petites colonies d'insectes.",
        "organic_treatment": [
            "Savon noir liquide (20 ml/L d'eau tiède) pulvérisé directement sur les colonies le matin.",
            "Purin d'ortie dilué à 10% en répulsif foliaire.",
            "Introduire des prédateurs naturels (larves de coccinelles ou chrysopes)."
        ],
        "prevention": "Planter des aromatiques répulsives à proximité (Lavande, Romarin, Rue)."
    },
    {
        "id": "nitrogen_deficiency",
        "name_fr": "Carence en azote (Chlorose générale)",
        "name_en": "Nitrogen Deficiency",
        "name_ar": "نقص النيتروجين (ازرقاق واصفرار الأوراق)",
        "category": "deficiency",
        "triggers": ["pale_leaves", "yellow_lower_leaves", "stunted_growth"],
        "description": "Jaunissement uniforme débutant par les feuilles les plus âgées à la base, tige grêle.",
        "organic_treatment": [
            "Apport de purin d'ortie pur ou peu dilué (très riche en azote assimilable).",
            "Griffage superficiel de corne broyée ou de tourteau végétal au pied.",
            "Paillage de compost mûr ou fumier décomposé."
        ],
        "prevention": "Maintenir un bon taux d'humus et associer des légumineuses (Fabacées) fixatrices d'azote."
    },
    {
        "id": "root_rot",
        "name_fr": "Pourriture des racines / Asphyxie",
        "name_en": "Root Rot / Overwatering",
        "name_ar": "تعفن الجذور والاختناق المائي",
        "category": "physiological",
        "triggers": ["wilting_wet_soil", "blackened_stem", "leaf_drop"],
        "description": "Flétrissement de la plante malgré un sol constamment humide, noircissement du collet.",
        "organic_treatment": [
            "Cesser immédiatement les arrosages et aérer la terre autour de la motte.",
            "Supprimer les racines ramollies ou brunes et rempoter dans un substrat drainant.",
            "Arroser avec une infusion de camomille ou de thym pour assainir le sol."
        ],
        "prevention": "Assurer un drainage sans faille (graviers au fond, sable de rivière mélangé à la terre)."
    }
]

def diagnose_symptoms(symptoms: List[str], plant_name: Optional[str] = None) -> Dict[str, Any]:
    """
    Evaluates observed symptoms against the agronomic diagnostic rulebase.
    """
    matches = []
    normalized_symptoms = [s.lower().strip() for s in symptoms]

    for rule in DIAGNOSTIC_RULES:
        trigger_matches = [t for t in rule["triggers"] if t in normalized_symptoms]
        if trigger_matches:
            match_confidence = len(trigger_matches) / len(rule["triggers"])
            matches.append({
                "disease_id": rule["id"],
                "name_fr": rule["name_fr"],
                "name_en": rule["name_en"],
                "name_ar": rule["name_ar"],
                "category": rule["category"],
                "confidence_score": round(match_confidence, 2),
                "matched_symptoms": trigger_matches,
                "description": rule["description"],
                "organic_treatment": rule["organic_treatment"],
                "prevention": rule["prevention"]
            })

    # Sort by confidence score
    matches.sort(key=lambda x: x["confidence_score"], reverse=True)

    return {
        "plant_name": plant_name or "Plante hôte",
        "diagnoses_count": len(matches),
        "results": matches,
        "disclaimer": "Diagnostic agronomique préventif basé sur les symptômes observés. Pour les vergers professionnels, confirmer par une analyse en laboratoire."
    }
