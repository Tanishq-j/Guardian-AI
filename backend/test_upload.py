import httpx
import asyncio

async def test():
    async with httpx.AsyncClient() as client:
        with open(r"C:\Users\123ta\.gemini\antigravity\brain\44c5cd59-a642-492e-91ee-92144b8ccce5\sports_photo_1777384614145.png", "rb") as f:
            files = {"file": ("sports.png", f, "image/png")}
            data = {"orgId": "demo-org"}
            response = await client.post("http://localhost:8000/api/assets/register", data=data, files=files, timeout=30.0)
            print("STATUS CODE:", response.status_code)
            print("RESPONSE TEXT:", response.text)

asyncio.run(test())
