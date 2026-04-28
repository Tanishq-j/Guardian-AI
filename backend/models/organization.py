from pydantic import BaseModel
from typing import List

class OrganizationCreate(BaseModel):
    name: str
    email: str
    sport: str

class OrganizationResponse(BaseModel):
    orgId: str
    name: str
    email: str
    sport: str
    whitelist: List[str]
    createdAt: str

class WhitelistUpdate(BaseModel):
    entries: List[str]
