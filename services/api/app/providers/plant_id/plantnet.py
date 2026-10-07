import os
from typing import Any, Optional
import httpx

from ..base import Provider, RateLimited, BadResponse, ProviderError

class PlantNetProvider(Provider):
    name = "plantnet"

    def __init__(self, api_key: Optional[str] = None, timeout_s: float = 12.0, priority: int = 1):
        self.api_key = api_key or os.getenv("PLANTNET_API_KEY")
        self.timeout_s = timeout_s
        self.priority = priority

    async def call(self, request: Any) -> list[str]:
        """
        request should be a dict: {"image_bytes": bytes, "organ": Optional[str]}
        or simply image bytes.
        """
        if not self.api_key:
            raise ProviderError("PLANTNET_API_KEY is not configured")

        if isinstance(request, dict):
            image_bytes = request["image_bytes"]
            organ = request.get("organ", "auto")
        else:
            image_bytes = request
            organ = "auto"

        url = f"https://my-api.plantnet.org/v2/identify/all?api-key={self.api_key}"
        files = {
            'images': ('plant.jpg', image_bytes, 'image/jpeg')
        }
        data = {}
        if organ and organ != "auto":
            data['organs'] = organ

        async with httpx.AsyncClient(timeout=self.timeout_s) as client:
            try:
                response = await client.post(url, files=files, data=data)
            except httpx.TimeoutException as e:
                raise TimeoutError("Pl@ntNet request timed out") from e
            except httpx.HTTPError as e:
                raise ProviderError(f"HTTP connection error: {str(e)}") from e

        if response.status_code == 429:
            retry_after = response.headers.get("retry-after")
            raise RateLimited(float(retry_after) if retry_after and retry_after.isdigit() else 60.0)

        if response.status_code >= 500:
            raise ProviderError(f"Pl@ntNet server error {response.status_code}")

        if response.status_code != 200:
            raise BadResponse(f"Pl@ntNet error status {response.status_code}: {response.text}")

        res_json = response.json()
        scientific_names: list[str] = []
        for result in res_json.get("results", []):
            species = result.get("species", {})
            name = species.get("scientificNameWithoutAuthor")
            if name and name not in scientific_names:
                scientific_names.append(name)

        if not scientific_names:
            raise BadResponse("Pl@ntNet could not identify any plant from this image")

        return scientific_names
