import os
import httpx

async def identify_plant(image_bytes: bytes) -> list[str]:
    """
    Calls Pl@ntNet API to identify a plant from an image.
    Returns a list of predicted scientific names.
    """
    api_key = os.getenv("PLANTNET_API_KEY")
    if not api_key:
        raise ValueError("PLANTNET_API_KEY environment variable is not set.")
        
    url = f"https://my-api.plantnet.org/v2/identify/all?api-key={api_key}"
    
    files = {
        'images': ('plant.jpg', image_bytes, 'image/jpeg')
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, files=files)
        
    if response.status_code != 200:
        raise RuntimeError(f"Pl@ntNet API returned {response.status_code}: {response.text}")
        
    data = response.json()
    
    # Extract scientific names from the top results
    scientific_names = []
    for result in data.get("results", []):
        name = result.get("species", {}).get("scientificNameWithoutAuthor")
        if name and name not in scientific_names:
            scientific_names.append(name)
            
    return scientific_names
