import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class CandidateChunk(BaseModel):
    chunk_id: str = Field(default_factory=lambda: f"chk_{uuid.uuid4().hex[:12]}")
    user_id: str
    doc_type: str  # "profile_project", "profile_experience", "resume", "skills", "candidate_note", "interview_qa", "education", "certifications"
    title: str
    content: str
    section: str  # "PROJECTS", "EXPERIENCE", "SKILLS", "EDUCATION", "SUMMARY", "NOTES", "CERTIFICATIONS"
    skills: List[str] = Field(default_factory=list)
    source_id: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def to_payload(self) -> Dict[str, Any]:
        return {
            "chunk_id": self.chunk_id,
            "user_id": self.user_id,
            "doc_type": self.doc_type,
            "title": self.title,
            "content": self.content,
            "section": self.section,
            "skills": self.skills,
            "source_id": self.source_id or "",
            "created_at": self.created_at,
        }


class SectionAwareChunker:
    """
    Splits candidate documents into section-aware, semantically rich chunks
    preserving hierarchical headings, bullet points, skills, and contextual metadata.
    """

    @classmethod
    def chunk_profile(cls, profile_dict: Dict[str, Any], user_id: str) -> List[CandidateChunk]:
        chunks: List[CandidateChunk] = []
        user_id_str = str(user_id)

        # 1. Headline & Bio / Summary
        headline = profile_dict.get("headline") or profile_dict.get("full_name") or ""
        target_roles = profile_dict.get("target_roles") or []
        pref_locs = profile_dict.get("preferred_locations") or []
        exp_lvl = profile_dict.get("experience_level") or "Fresher / 0-1 years"
        work_pref = profile_dict.get("work_preference") or "Flexible"

        summary_content = (
            f"[CANDIDATE PROFILE SUMMARY]\n"
            f"Candidate: {headline}\n"
            f"Target Roles: {', '.join(target_roles) if target_roles else 'Software Engineer'}\n"
            f"Preferred Locations: {', '.join(pref_locs) if pref_locs else 'Any'}\n"
            f"Experience Level: {exp_lvl}\n"
            f"Work Preference: {work_pref}"
        )
        chunks.append(
            CandidateChunk(
                user_id=user_id_str,
                doc_type="profile_summary",
                title=f"Summary: {headline or 'Candidate Profile'}",
                content=summary_content.strip(),
                section="SUMMARY",
                skills=[],
                source_id="profile",
            )
        )

        # 2. Skills Taxonomy
        raw_skills = profile_dict.get("skills") or []
        skill_names: List[str] = []
        for s in raw_skills:
            if isinstance(s, dict):
                s_name = s.get("name", "")
                cat = s.get("category", "")
                prof = s.get("proficiency", "")
                if s_name:
                    skill_names.append(f"{s_name} ({cat} - {prof})")
            elif isinstance(s, str):
                skill_names.append(s)

        if skill_names:
            skills_content = (
                f"[TECHNICAL & SOFT SKILLS]\n"
                f"Candidate Competencies:\n" + "\n".join(f"- {s}" for s in skill_names)
            )
            pure_skill_names = [s.get("name", "") if isinstance(s, dict) else s for s in raw_skills if s]
            chunks.append(
                CandidateChunk(
                    user_id=user_id_str,
                    doc_type="skills",
                    title="Candidate Skill Profile & Competencies",
                    content=skills_content.strip(),
                    section="SKILLS",
                    skills=[s for s in pure_skill_names if s],
                    source_id="profile",
                )
            )

        # 3. Technical Projects
        projects = profile_dict.get("projects") or []
        for proj in projects:
            p_name = proj.get("name") or proj.get("title") or "Technical Project"
            p_desc = proj.get("description", "")
            p_skills = proj.get("technologies") or []
            p_gh = proj.get("github_url") or ""
            p_live = proj.get("live_url") or ""
            p_role = proj.get("role") or "Developer"

            proj_content = (
                f"[TECHNICAL PROJECT: {p_name}]\n"
                f"Role: {p_role}\n"
                f"Technologies: {', '.join(p_skills)}\n"
                f"Repository / Live: {p_gh} {p_live}\n"
                f"Architecture & Accomplishments:\n{p_desc}"
            )
            chunks.append(
                CandidateChunk(
                    user_id=user_id_str,
                    doc_type="profile_project",
                    title=f"Project: {p_name}",
                    content=proj_content.strip(),
                    section="PROJECTS",
                    skills=p_skills,
                    source_id="profile",
                )
            )

        # 4. Work Experiences
        experiences = profile_dict.get("experiences") or profile_dict.get("work_experience") or []
        for exp in experiences:
            company = exp.get("company", "Company")
            role = exp.get("role") or exp.get("title") or "Software Engineer"
            start = exp.get("start_date", "")
            end = exp.get("end_date") or ("Present" if exp.get("is_current") else "")
            desc = exp.get("description", "")
            exp_skills = exp.get("skills_used") or exp.get("technologies_used") or []

            exp_content = (
                f"[WORK EXPERIENCE: {role} at {company}]\n"
                f"Company: {company}\n"
                f"Role: {role}\n"
                f"Tenure: {start} to {end}\n"
                f"Technologies: {', '.join(exp_skills)}\n"
                f"Impact & Contributions:\n{desc}"
            )
            chunks.append(
                CandidateChunk(
                    user_id=user_id_str,
                    doc_type="profile_experience",
                    title=f"Experience: {role} at {company}",
                    content=exp_content.strip(),
                    section="EXPERIENCE",
                    skills=exp_skills,
                    source_id="profile",
                )
            )

        # 5. Education
        educations = profile_dict.get("education") or []
        for edu in educations:
            inst = edu.get("college") or edu.get("institution") or "University"
            degree = edu.get("degree", "Degree")
            branch = edu.get("branch") or edu.get("field_of_study") or ""
            year = edu.get("graduation_year", "")
            cgpa = edu.get("cgpa") or edu.get("grade") or ""

            edu_content = (
                f"[EDUCATION]\n"
                f"Degree: {degree} ({branch})\n"
                f"Institution: {inst}\n"
                f"Graduation: {year}\n"
                f"CGPA/Grade: {cgpa}"
            )
            chunks.append(
                CandidateChunk(
                    user_id=user_id_str,
                    doc_type="education",
                    title=f"Education: {degree} - {inst}",
                    content=edu_content.strip(),
                    section="EDUCATION",
                    skills=[],
                    source_id="profile",
                )
            )

        # 6. Certifications
        certifications = profile_dict.get("certifications") or []
        for cert in certifications:
            c_name = cert.get("name", "Certification")
            issuer = cert.get("issuer", "")
            issue_date = cert.get("issue_date", "")
            cred_url = cert.get("credential_url", "")

            cert_content = (
                f"[CERTIFICATION: {c_name}]\n"
                f"Issuer: {issuer}\n"
                f"Date: {issue_date}\n"
                f"Credential URL: {cred_url}"
            )
            chunks.append(
                CandidateChunk(
                    user_id=user_id_str,
                    doc_type="certifications",
                    title=f"Certification: {c_name} by {issuer}",
                    content=cert_content.strip(),
                    section="CERTIFICATIONS",
                    skills=[],
                    source_id="profile",
                )
            )

        return chunks

    @classmethod
    def chunk_resume(cls, resume_dict: Dict[str, Any], user_id: str) -> List[CandidateChunk]:
        chunks: List[CandidateChunk] = []
        user_id_str = str(user_id)
        resume_id = str(resume_dict.get("id") or resume_dict.get("_id") or "")
        parsed_data = resume_dict.get("parsed_data") or {}
        if isinstance(parsed_data, BaseModel):
            parsed_data = parsed_data.model_dump()

        # 1. Summary
        summary = parsed_data.get("summary")
        if summary:
            chunks.append(
                CandidateChunk(
                    user_id=user_id_str,
                    doc_type="resume",
                    title="Resume Summary",
                    content=f"[RESUME SUMMARY]\n{summary}",
                    section="SUMMARY",
                    skills=parsed_data.get("skills", []),
                    source_id=resume_id,
                )
            )

        # 2. Parsed Projects
        for proj in parsed_data.get("projects") or []:
            name = proj.get("name") or proj.get("title") or "Project"
            tech = proj.get("technologies") or []
            desc = proj.get("description") or ""
            chunks.append(
                CandidateChunk(
                    user_id=user_id_str,
                    doc_type="resume",
                    title=f"Resume Project: {name}",
                    content=f"[RESUME PROJECT: {name}]\nTechnologies: {', '.join(tech)}\nDetails: {desc}",
                    section="PROJECTS",
                    skills=tech,
                    source_id=resume_id,
                )
            )

        # 3. Parsed Work Experience
        for exp in parsed_data.get("work_experience") or []:
            company = exp.get("company") or "Company"
            role = exp.get("role") or exp.get("title") or "Role"
            desc = exp.get("description") or ""
            tech = exp.get("technologies_used") or []
            chunks.append(
                CandidateChunk(
                    user_id=user_id_str,
                    doc_type="resume",
                    title=f"Resume Experience: {role} at {company}",
                    content=f"[RESUME EXPERIENCE: {role} at {company}]\nTech: {', '.join(tech)}\n{desc}",
                    section="EXPERIENCE",
                    skills=tech,
                    source_id=resume_id,
                )
            )

        # 4. Fallback on raw text
        raw_text = resume_dict.get("raw_text") or ""
        if raw_text and len(chunks) <= 1:
            paragraphs = [p.strip() for p in raw_text.split("\n\n") if p.strip()]
            for idx, p in enumerate(paragraphs[:10]):
                if len(p) > 40:
                    chunks.append(
                        CandidateChunk(
                            user_id=user_id_str,
                            doc_type="resume",
                            title=f"Resume Section {idx + 1}",
                            content=f"[RESUME TEXT]\n{p}",
                            section="RESUME",
                            skills=parsed_data.get("skills", []),
                            source_id=resume_id,
                        )
                    )

        return chunks

    @classmethod
    def chunk_note(cls, note_data: Dict[str, Any], user_id: str) -> CandidateChunk:
        return CandidateChunk(
            user_id=str(user_id),
            doc_type="candidate_note",
            title=note_data.get("title", "Technical Note"),
            content=f"[CANDIDATE NOTE: {note_data.get('title', '')}]\n{note_data.get('content', '')}",
            section="NOTES",
            skills=note_data.get("tags", []),
            source_id=note_data.get("note_id"),
        )
