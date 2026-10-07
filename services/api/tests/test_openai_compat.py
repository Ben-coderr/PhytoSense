import asyncio
import json
import pytest
import httpx
from unittest.mock import AsyncMock, patch

from app.providers.llm.openai_compat import OpenAICompatLLM, clean_json_text
from app.providers.base import RateLimited, BadResponse, ProviderError
from app.domain.schemas import AIPredictionResponse

def test_clean_json_text():
    raw_markdown = "```json\n{\"predicted_activities\": [\"Antioxidant\"], \"reasoning\": \"High phenols\"}\n```"
    cleaned = clean_json_text(raw_markdown)
    data = json.loads(cleaned)
    assert data["predicted_activities"] == ["Antioxidant"]

    plain_json = "{\"predicted_activities\": [\"Antibacterial\"], \"reasoning\": \"Essential oils\"}"
    cleaned_plain = clean_json_text(plain_json)
    data_plain = json.loads(cleaned_plain)
    assert data_plain["predicted_activities"] == ["Antibacterial"]

def test_openai_compat_success():
    async def run_test():
        provider = OpenAICompatLLM(
            name="groq",
            base_url="https://api.groq.com/openai/v1",
            api_key="mock_key",
            model="llama-3.3-70b-versatile"
        )

        mock_response = httpx.Response(
            status_code=200,
            json={
                "choices": [{
                    "message": {
                        "content": json.dumps({
                            "predicted_activities": ["Anti-inflammatoire", "Antioxydant"],
                            "reasoning": "Présence significative de thymoquinone."
                        })
                    }
                }]
            }
        )

        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_response
            res = await provider.call({
                "task": "predict",
                "composition_tags": "thymoquinone",
                "composition_text": "Graines riches en thymoquinone"
            })

            assert isinstance(res, AIPredictionResponse)
            assert "Anti-inflammatoire" in res.predicted_activities
            assert "thymoquinone" in res.reasoning

    asyncio.run(run_test())

def test_openai_compat_rate_limited():
    async def run_test():
        provider = OpenAICompatLLM(
            name="groq",
            base_url="https://api.groq.com/openai/v1",
            api_key="mock_key"
        )

        mock_response = httpx.Response(
            status_code=429,
            headers={"retry-after": "45"}
        )

        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_response
            with pytest.raises(RateLimited) as exc_info:
                await provider.call({"task": "predict"})
            assert exc_info.value.retry_after == 45.0

    asyncio.run(run_test())

def test_openai_compat_malformed_json():
    async def run_test():
        provider = OpenAICompatLLM(
            name="groq",
            base_url="https://api.groq.com/openai/v1",
            api_key="mock_key"
        )

        mock_response = httpx.Response(
            status_code=200,
            json={
                "choices": [{
                    "message": {
                        "content": "This is plain text with no JSON brackets at all!"
                    }
                }]
            }
        )

        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_response
            with pytest.raises(BadResponse):
                await provider.call({"task": "predict"})

    asyncio.run(run_test())
