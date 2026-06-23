import os
from dotenv import load_dotenv

load_dotenv()

from app.services.ai_service import predict_therapeutic_properties

try:
    print("Testing AI Prediction...")
    res = predict_therapeutic_properties("alcaloïde, flavonoïde", "Some flavonoids and alkaloids.")
    print("SUCCESS!")
    print(res)
except Exception as e:
    import traceback
    traceback.print_exc()
