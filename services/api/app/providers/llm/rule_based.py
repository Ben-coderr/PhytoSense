from typing import Any
from ..base import Provider
from ...domain.schemas import AIPredictionResponse, ResearchResponse, SimilarPlant

class RuleBasedLLMProvider(Provider):
    """
    Zero-network deterministic rule-based fallback.
    Constructs therapeutic predictions and research dossiers based directly
    on botanical chemistry rules and database activity tags.
    """
    name = "rule_based"
    priority = 99
    timeout_s = 1.0

    async def call(self, request: Any) -> Any:
        task = request.get("task")

        if task == "predict":
            tags_str = request.get("composition_tags", "")
            tags = [t.strip().lower() for t in tags_str.split(",") if t.strip()]

            activities: list[str] = []
            reasons: list[str] = []

            # Deterministic phytochemical rules
            if any("flavon" in t or "polyph" in t for t in tags):
                activities.append("Antioxydant majeur")
                reasons.append("Présence documentée de flavonoïdes et polyphénols inhibant la peroxydation lipidique.")

            if any("terp" in t or "huile" in t for t in tags):
                activities.append("Antibactérien et antimicrobien")
                reasons.append("Les composés monoterpéniques et huiles volatiles perturbent les membranes cellulaires bactériennes.")

            if any("alcal" in t for t in tags):
                activities.append("Analgésique et antispasmodique")
                reasons.append("Les alcaloïdes naturels exercent une action régulatrice sur les récepteurs nociceptifs.")

            if any("tanin" in t for t in tags):
                activities.append("Astringent et cicatrisant")
                reasons.append("Les tanins précipitent les protéines tissulaires favorisant la cicatrisation cutanée.")

            if not activities:
                activities = ["Tonique général", "Protecteur cellulaire"]
                reasons = ["Métabolites secondaires végétaux participant aux défenses naturelles de la plante."]

            return AIPredictionResponse(
                predicted_activities=activities,
                reasoning=" (Mode Hors-Ligne Dégradé) " + " ".join(reasons)
            )

        elif task == "research_compounds":
            # Baseline primary metabolite classes
            return ["polyphénols", "flavonoïdes", "terpènes", "acides phénoliques"]

        elif task == "research_synthesis":
            sci_name = request.get("scientific_name", "Specimen")
            return ResearchResponse(
                scientific_name=sci_name,
                region="Région Méditerranéenne / Nord-Africaine",
                researched_compounds=["polyphénols", "terpènes", "huiles essentielles"],
                similar_local_plants=[
                    SimilarPlant(
                        name="Thymus vulgaris L.",
                        shared_compounds=["terpènes", "polyphénols"],
                        match_reason="Partage des fractions terpéniques aromatiques antibactériennes."
                    )
                ],
                predicted_activities=["Antimicrobien", "Antioxydant", "Anti-inflammatoire"]
            )

        return AIPredictionResponse(
            predicted_activities=["Activité biologique protectrice"],
            reasoning="Généré par le moteur de règles déterministe."
        )
