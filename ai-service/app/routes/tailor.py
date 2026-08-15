from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import json
import asyncio
from google import genai
from app.core.config import get_settings

router = APIRouter(prefix="/ai", tags=["AI Tailor"])
settings = get_settings()


class TailorRequest(BaseModel):
    """Request body for tailoring resume to a job."""
    jobTitle: str
    jobCompany: str = ""
    jobDescription: str  # Full JD text (HTML stripped)
    jobLocation: str = ""

    # Candidate profile data
    candidateName: str = ""
    candidateHeadline: str = ""
    candidateSummary: str = ""
    candidateSkills: list[str] = []
    candidateExperience: list[dict] = []  # [{title, company, startDate, endDate, description}]
    candidateProjects: list[dict] = []    # [{name, description, technologies}]
    candidateEducation: list[dict] = []   # [{institution, degree, field}]


class TailorResponse(BaseModel):
    """AI-generated tailored content."""
    professionalSummary: str
    experienceBullets: list[str]
    projectBullets: list[str]
    coverLetter: str
    matchScore: int  # 0-100 rough match score
    keySkillMatches: list[str]  # Skills from profile that match JD
    missingSkills: list[str]  # Skills from JD not in profile


@router.post("/tailor-application", response_model=TailorResponse)
async def tailor_application(req: TailorRequest):
    """
    Takes a job description + candidate profile, uses Gemini AI to generate
    a tailored professional summary, experience bullets, project bullets,
    cover letter, and match analysis.
    """
    if not settings.gemini_api_key:
        raise HTTPException(status_code=503, detail="Gemini API key not configured.")

    # Build the candidate context
    skills_str = ", ".join(req.candidateSkills) if req.candidateSkills else "Not provided"
    
    exp_str = ""
    if req.candidateExperience:
        for exp in req.candidateExperience[:5]:
            exp_str += f"  - {exp.get('title', 'Role')} at {exp.get('company', 'Company')}"
            if exp.get('description'):
                exp_str += f": {exp['description'][:200]}"
            exp_str += "\n"
    else:
        exp_str = "  Not provided\n"
    
    proj_str = ""
    if req.candidateProjects:
        for proj in req.candidateProjects[:5]:
            proj_str += f"  - {proj.get('name', 'Project')}"
            if proj.get('technologies'):
                techs = proj['technologies'] if isinstance(proj['technologies'], list) else [proj['technologies']]
                proj_str += f" ({', '.join(techs)})"
            if proj.get('description'):
                proj_str += f": {proj['description'][:200]}"
            proj_str += "\n"
    else:
        proj_str = "  Not provided\n"

    prompt = f"""You are a senior career coach and resume expert. A job seeker wants to tailor their resume for a specific job.

=== JOB DETAILS ===
Title: {req.jobTitle}
Company: {req.jobCompany}
Location: {req.jobLocation}
Job Description:
{req.jobDescription[:6000]}

=== CANDIDATE PROFILE ===
Name: {req.candidateName}
Headline: {req.candidateHeadline}
Summary: {req.candidateSummary}
Skills: {skills_str}
Experience:
{exp_str}
Projects:
{proj_str}

=== YOUR TASK ===
Generate a JSON response with these fields:

1. "professionalSummary": A 2-3 sentence professional summary tailored to this specific job. Highlight the candidate's most relevant skills and experience that match the JD. Use strong action-oriented language.

2. "experienceBullets": An array of 4-6 tailored resume bullet points drawn from the candidate's experience. Each bullet should:
   - Start with a strong action verb (Engineered, Architected, Optimized, Led, Built, etc.)
   - Include specific metrics or outcomes where possible
   - Directly map to requirements mentioned in the JD
   - Be 1-2 lines max

3. "projectBullets": An array of 3-4 tailored project highlights drawn from the candidate's projects. Each should:
   - Emphasize technologies/skills matching the JD
   - Show impact and technical depth
   - Be concise (1-2 lines)

4. "coverLetter": A professional 3-paragraph cover letter (150-200 words) addressed to "{req.jobCompany or 'the hiring team'}". It should:
   - Open with enthusiasm for the specific role
   - Highlight 2-3 most relevant qualifications matching JD
   - Close with a confident call to action

5. "matchScore": An integer 0-100 representing how well the candidate matches this JD

6. "keySkillMatches": Array of skills from the candidate that directly match JD requirements

7. "missingSkills": Array of skills mentioned in the JD that the candidate does NOT have

Return ONLY valid JSON. No markdown, no code fences, no explanation."""

    try:
        client = genai.Client(api_key=settings.gemini_api_key)
        try:
            response = await asyncio.wait_for(
                asyncio.to_thread(
                    client.models.generate_content,
                    model="gemini-3.5-flash",
                    contents=prompt,
                    config=genai.types.GenerateContentConfig(
                        response_mime_type="application/json"
                    )
                ),
                timeout=45.0
            )
        except Exception as e:
            print(f"Tailor primary model error: {e}, attempting gemini-flash-latest...")
            response = await asyncio.wait_for(
                asyncio.to_thread(
                    client.models.generate_content,
                    model="gemini-flash-latest",
                    contents=prompt,
                    config=genai.types.GenerateContentConfig(
                        response_mime_type="application/json"
                    )
                ),
                timeout=30.0
            )
        
        text_resp = response.text.strip()
        # Clean markdown fences
        if text_resp.startswith("```json"):
            text_resp = text_resp[7:]
        if text_resp.startswith("```"):
            text_resp = text_resp[3:]
        if text_resp.endswith("```"):
            text_resp = text_resp[:-3]
        
        parsed = json.loads(text_resp.strip())
        
        return TailorResponse(
            professionalSummary=parsed.get("professionalSummary", ""),
            experienceBullets=parsed.get("experienceBullets", []),
            projectBullets=parsed.get("projectBullets", []),
            coverLetter=parsed.get("coverLetter", ""),
            matchScore=parsed.get("matchScore", 75),
            keySkillMatches=parsed.get("keySkillMatches", []),
            missingSkills=parsed.get("missingSkills", []),
        )

    except Exception as e:
        print(f"Gemini tailoring error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate tailored content: {str(e)}")
