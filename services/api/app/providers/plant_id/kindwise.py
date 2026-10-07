import os
import base64
from typing import Any, Optional
import httpx

from ..base import Provider, RateLimited, BadResponse, ProviderError

class KindwiseProvider(Provider):
    name = "kindwise"

    def __init__(self, api_key: Optional[str] = None, timeout_s: float = 12.0, priority: int = 2):
        self.api_key = api_key or os.getenv("KINDWISE_API_KEY")
        self.timeout_s = timeout_s
        self.priority = priority

    async def call(self, request: Any) -> list[str]:
        if not self.api_key:
            raise ProviderError("KINDWISE_API_KEY is not configured")

        if isinstance(request, dict):
            image_bytes = request["image_bytes"]
            lat = request.get("latitude")
            lon = request.get("longitude")
        else:
            image_bytes = request
            lat, lon = None, None

        # Convert bytes to base64 data URI
        b64_str = base64.b64encode(image_bytes).decode("utf-8")
        data_uri = f"data:image/jpeg;base64,{b64_str}"

        payload: dict[str, Any] = {
            "images": [data_uri],
        }
        if lat is not None and lon is not None:
            payload["latitude"] = lat
            payload["longitude"] = lon

        headers = {
            "Api-Key": self.api_key,
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient(timeout=self.timeout_s) as client:
            try:
                response = await client.post(
                    "https://plant.id/api/v3/identification",
                    json=payload,
                    headers=headers
                )
            except httpx.TimeoutException as e:
                raise TimeoutError("Kindwise request timed out") from e
            except httpx.HTTPError as e:
                raise ProviderError(f"HTTP connection error with Kindwise: {str(e)}") from e

        if response.status_code == 429:
            raise RateLimited(retry_after=60.0, message="Kindwise credit or rate limit exceeded")

        if response.status_code != 200:
            raise BadResponse(f"Kindwise error {response.status_code}: {response.text}")

        res_json = response.json()
        suggestions = (
            res_json.get("result", {})
            .get("classification", {})
            .get("suggestions", [])
        )

        scientific_names: list[str] = []
        for s in suggestions:
            name = s.get("name")
            if name and name not in scientific_names:
                scientific_names.append(name)

        if not scientific_names:
            raise BadResponse("Kindwise could not identify any plant from this image")

        return scientific_names
