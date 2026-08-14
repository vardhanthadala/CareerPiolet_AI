from fastapi import APIRouter, UploadFile, File
from pydantic import BaseModel


router = APIRouter(prefix="/ai", tags=["AI"])


class ParseResumeResponse(BaseModel):
    """Response model for resume parsing."""

    name: str | None = None
    email: str | None = None
    phone: str | None = None
    skills: list[str] = []
    experience: list[dict] = []
    education: list[dict] = []
    projects: list[dict] = []
    certifications: list[str] = []
    summary: str | None = None


@router.post("/parse-resume", response_model=ParseResumeResponse)
async def parse_resume(file: UploadFile = File(...)):
    """
    Parse a resume PDF and extract structured data.
    (Placeholder — full implementation in Phase 4)
    """
    return ParseResumeResponse(
        name="Placeholder",
        email="placeholder@example.com",
        skills=["Python", "JavaScript", "React"],
        experience=[],
        education=[],
        projects=[],
        certifications=[],
        summary="Resume parsing will be implemented in Phase 4.",
    )
