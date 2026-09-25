import json
import logging
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from beanie import PydanticObjectId

from app.core.config import settings
from app.models.interview import MockInterviewDocument, InterviewQuestionItem, AnswerEvaluationItem
from app.models.profile import ProfileDocument
from app.models.resume import ResumeDocument, ResumeVersionDocument
from app.models.job import JobDocument
from app.schemas.interview import (
    GenerateInterviewRequest,
    SubmitAnswerRequest,
    AnswerEvaluationSchema,
    InterviewQuestionSchema,
    MockInterviewResponse,
    SubmitAnswerResponse,
)

logger = logging.getLogger("app.interview")


class InterviewService:
    def __init__(self):
        self.groq_client = None
        if settings.GROQ_API_KEY:
            try:
                from groq import Groq
                self.groq_client = Groq(api_key=settings.GROQ_API_KEY)
            except Exception as e:
                logger.warning(f"Groq client initialization failed: {e}")

    async def generate_mock_interview(
        self,
        user_id: str,
        request: GenerateInterviewRequest,
    ) -> MockInterviewDocument:
        """
        Generates a tailored 5-question mock interview session strictly grounded
        in candidate verified skills, actual projects, and target job description.
        """
        p_user_id = PydanticObjectId(user_id)
        
        # 1. Fetch Candidate Profile & Resume Context
        profile = await ProfileDocument.find_one(ProfileDocument.user_id == p_user_id)
        profile_data = profile.model_dump() if profile else {}
        
        verified_skills = [
            s.get("name") if isinstance(s, dict) else getattr(s, "name", str(s))
            for s in profile_data.get("skills", [])
        ]
        
        candidate_projects = []
        for p in profile_data.get("projects", []):
            if isinstance(p, dict):
                candidate_projects.append({
                    "name": p.get("name", "Project"),
                    "tech": p.get("technologies", []),
                    "desc": p.get("description", "")
                })

        # 2. Fetch Target Job Details if job_id provided
        job_title = request.role or profile_data.get("headline") or "Software Engineer"
        job_context = ""
        if request.job_id:
            try:
                job = await JobDocument.get(PydanticObjectId(request.job_id))
                if job:
                    job_title = job.title
                    job_context = f"Company: {job.company}\nJob Description:\n{job.description}\nRequired Skills: {', '.join(job.skills)}"
            except Exception as err:
                logger.debug("Could not fetch job context for interview generation: %s", err)

        # 3. Formulate Question Generation Prompt
        questions_data = await self._generate_questions_with_llm(
            role=job_title,
            experience_level=request.experience_level or "0-1 years",
            verified_skills=verified_skills,
            candidate_projects=candidate_projects,
            job_context=job_context,
            num_questions=request.num_questions,
        )

        # 4. Construct MockInterviewDocument
        question_items: List[InterviewQuestionItem] = []
        for idx, q in enumerate(questions_data):
            question_items.append(
                InterviewQuestionItem(
                    order_num=idx + 1,
                    category=q.get("category", "TECHNICAL"),
                    difficulty=q.get("difficulty", "MEDIUM"),
                    question=q.get("question", ""),
                    context_or_scenario=q.get("context_or_scenario"),
                    expected_concepts=q.get("expected_concepts", []),
                )
            )

        interview_doc = MockInterviewDocument(
            user_id=p_user_id,
            job_id=request.job_id,
            title=f"Mock Interview: {job_title}",
            target_role=job_title,
            experience_level=request.experience_level or "0-1 years",
            status="IN_PROGRESS",
            current_question_index=0,
            total_questions=len(question_items),
            questions=question_items,
        )

        await interview_doc.insert()
        logger.info("Generated mock interview session %s for user %s", interview_doc.id, user_id)
        return interview_doc

    async def _generate_questions_with_llm(
        self,
        role: str,
        experience_level: str,
        verified_skills: List[str],
        candidate_projects: List[Dict[str, Any]],
        job_context: str,
        num_questions: int,
    ) -> List[Dict[str, Any]]:
        """Invokes Groq LLM or deterministic high-quality fallback generator."""
        if not self.groq_client:
            return self._fallback_questions(role, verified_skills, candidate_projects, num_questions)

        prompt = f"""You are an expert Technical Interviewer for entry-level / early-career software engineering roles.
Generate a high-quality {num_questions}-question mock interview session.

TARGET ROLE: {role}
EXPERIENCE LEVEL: {experience_level}
CANDIDATE SKILLS: {', '.join(verified_skills) if verified_skills else 'General Full-Stack / Backend'}
CANDIDATE REAL PROJECTS (Zero-hallucination: ONLY reference these exact projects):
{json.dumps(candidate_projects, indent=2) if candidate_projects else 'None provided'}

JOB CONTEXT:
{job_context if job_context else 'Standard Industry Software Engineering Role'}

QUESTION COMPOSITION RULES:
1. Include 2 Core Technical questions on fundamentals, frameworks, or database mechanics.
2. Include 1 Project Deep-Dive question referencing one of the candidate's real projects above. (If no projects, ask a practical engineering task).
3. Include 1 System Design or API Architecture scenario at entry-level scale.
4. Include 1 Behavioral question evaluated via the STAR method.

Return ONLY valid JSON matching this schema:
{{
  "questions": [
    {{
      "category": "TECHNICAL" | "PROJECT_DEEP_DIVE" | "SYSTEM_DESIGN" | "BEHAVIORAL_STAR",
      "difficulty": "EASY" | "MEDIUM" | "HARD",
      "question": "Clear, specific, realistic interview question prompt",
      "context_or_scenario": "Brief setup or architectural constraint for the question",
      "expected_concepts": ["Concept 1", "Concept 2", "Concept 3"]
    }}
  ]
}}
"""
        try:
            chat_completion = self.groq_client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are a senior hiring manager. Return valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                model=settings.GROQ_MODEL,
                temperature=0.2,
                response_format={"type": "json_object"}
            )
            raw_content = chat_completion.choices[0].message.content
            parsed = json.loads(raw_content)
            questions = parsed.get("questions") or []
            if len(questions) >= 3:
                return questions[:num_questions]
        except Exception as e:
            logger.warning("LLM question generation failed (%s), using fallback.", e)

        return self._fallback_questions(role, verified_skills, candidate_projects, num_questions)

    def _fallback_questions(
        self,
        role: str,
        verified_skills: List[str],
        candidate_projects: List[Dict[str, Any]],
        num_questions: int,
    ) -> List[Dict[str, Any]]:
        """Reliable fallback question bank tailored to candidate technologies."""
        primary_skill = verified_skills[0] if verified_skills else "Python"
        project_name = candidate_projects[0].get("name", "your recent application") if candidate_projects else "your primary web application"

        fallback_bank = [
            {
                "category": "TECHNICAL",
                "difficulty": "MEDIUM",
                "question": f"How do async event loops and asynchronous I/O operate in {primary_skill}, and when would synchronous execution block the server?",
                "context_or_scenario": "A high-concurrency microservice handling 5,000 HTTP requests per second.",
                "expected_concepts": ["Event loop non-blocking I/O", "Coroutine execution", "GIL or Thread pooling", "CPU-bound vs I/O-bound bottlenecks"],
            },
            {
                "category": "PROJECT_DEEP_DIVE",
                "difficulty": "MEDIUM",
                "question": f"In {project_name}, what was the most challenging engineering trade-off you made regarding database modeling and API latency?",
                "context_or_scenario": f"Architecture review of {project_name}.",
                "expected_concepts": ["Database schema design", "Indexing & query optimization", "Caching strategy", "Error handling"],
            },
            {
                "category": "SYSTEM_DESIGN",
                "difficulty": "MEDIUM",
                "question": "How would you design a rate-limiting middleware for a RESTful API to prevent abusive requests while preserving fairness?",
                "context_or_scenario": "API Gateway needing to enforce 100 requests per minute per IP or JWT token.",
                "expected_concepts": ["Token Bucket / Leaky Bucket algorithm", "Redis atomic operations", "HTTP 429 status code with Retry-After header", "Distributed concurrency"],
            },
            {
                "category": "TECHNICAL",
                "difficulty": "EASY",
                "question": "What is the difference between relational database transactions (ACID) and eventual consistency in distributed data stores?",
                "context_or_scenario": "Financial ledger vs distributed analytics pipeline.",
                "expected_concepts": ["Atomicity, Consistency, Isolation, Durability", "CAP Theorem", "Two-Phase Commit vs Eventual Consistency"],
            },
            {
                "category": "BEHAVIORAL_STAR",
                "difficulty": "MEDIUM",
                "question": "Describe a situation where a technical project fell behind schedule or encountered an unexpected bug right before a deadline. How did you resolve it?",
                "context_or_scenario": "STAR Format: Situation, Task, Action, Result.",
                "expected_concepts": ["Clear STAR structure", "Root-cause debugging", "Stakeholder communication", "Post-mortem learning"],
            },
        ]
        return fallback_bank[:num_questions]

    async def evaluate_answer(
        self,
        user_id: str,
        interview_id: str,
        request: SubmitAnswerRequest,
    ) -> SubmitAnswerResponse:
        """
        Evaluates a candidate's submitted answer in real-time using a 3-pillar rubric.
        """
        p_user_id = PydanticObjectId(user_id)
        p_interview_id = PydanticObjectId(interview_id)

        interview = await MockInterviewDocument.find_one(
            MockInterviewDocument.id == p_interview_id,
            MockInterviewDocument.user_id == p_user_id,
        )
        if not interview:
            raise ValueError("Interview session not found.")

        # Find target question
        target_q = None
        for q in interview.questions:
            if q.question_id == request.question_id:
                target_q = q
                break

        if not target_q:
            raise ValueError(f"Question with ID {request.question_id} not found in this session.")

        # Run 3-pillar rubric evaluation
        eval_result = await self._evaluate_with_llm(
            question=target_q.question,
            category=target_q.category,
            expected_concepts=target_q.expected_concepts,
            candidate_answer=request.candidate_answer,
        )

        # Save evaluation on question
        target_q.candidate_answer = request.candidate_answer
        target_q.evaluation = AnswerEvaluationItem(**eval_result)
        target_q.answered_at = datetime.now(timezone.utc)

        # Advance current question index
        next_index = min(interview.current_question_index + 1, interview.total_questions)
        interview.current_question_index = next_index

        # Check if all questions have been answered
        all_answered = all(q.candidate_answer is not None for q in interview.questions)
        if all_answered:
            await self._finalize_interview(interview)
        else:
            await interview.save()

        return SubmitAnswerResponse(
            interview_id=str(interview.id),
            question_id=request.question_id,
            evaluation=AnswerEvaluationSchema(**eval_result),
            current_question_index=next_index,
            total_questions=interview.total_questions,
            is_completed=interview.status == "COMPLETED",
        )

    async def _evaluate_with_llm(
        self,
        question: str,
        category: str,
        expected_concepts: List[str],
        candidate_answer: str,
    ) -> Dict[str, Any]:
        """Evaluates answer using Groq LLM or deterministic rubric fallback."""
        if not self.groq_client:
            return self._fallback_evaluation(question, expected_concepts, candidate_answer)

        prompt = f"""You are a strict, constructive Technical Interview Evaluator.
Evaluate the candidate's answer using this rigorous 3-pillar rubric:

QUESTION: {question}
CATEGORY: {category}
EXPECTED KEY CONCEPTS: {', '.join(expected_concepts)}

CANDIDATE ANSWER:
\"\"\"{candidate_answer}\"\"\"

EVALUATION RUBRIC:
1. Technical Correctness (0.0 - 10.0): Accuracy of terminology, underlying mechanics, and technical validity.
2. Depth & Completeness (0.0 - 10.0): Addressing edge cases, trade-offs, and conceptual depth.
3. Communication & Structure (0.0 - 10.0): Conciseness, clarity, logical reasoning (and STAR method if behavioral).

Return ONLY valid JSON matching this schema:
{{
  "technical_score": float (0-10),
  "depth_score": float (0-10),
  "communication_score": float (0-10),
  "key_strengths": ["Clear strength 1", "Clear strength 2"],
  "missing_concepts": ["Omitted detail 1", "Trade-off not mentioned"],
  "actionable_feedback": "Constructive 2-3 sentence coaching feedback.",
  "ideal_sample_response": "High-impact, concise model response demonstrating mastery."
}}
"""
        try:
            chat_completion = self.groq_client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are a senior technical interviewer. Return valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                model=settings.GROQ_MODEL,
                temperature=0.1,
                response_format={"type": "json_object"}
            )
            raw_content = chat_completion.choices[0].message.content
            parsed = json.loads(raw_content)
            return {
                "technical_score": min(max(float(parsed.get("technical_score", 7.0)), 0.0), 10.0),
                "depth_score": min(max(float(parsed.get("depth_score", 7.0)), 0.0), 10.0),
                "communication_score": min(max(float(parsed.get("communication_score", 7.5)), 0.0), 10.0),
                "key_strengths": parsed.get("key_strengths", ["Solid conceptual foundation."]),
                "missing_concepts": parsed.get("missing_concepts", []),
                "actionable_feedback": parsed.get("actionable_feedback", "Good explanation. Consider discussing production scalability and edge cases."),
                "ideal_sample_response": parsed.get("ideal_sample_response", "A comprehensive answer directly addresses the trade-offs and underlying architecture."),
            }
        except Exception as e:
            logger.warning("LLM evaluation failed (%s), using fallback rubric.", e)

        return self._fallback_evaluation(question, expected_concepts, candidate_answer)

    def _fallback_evaluation(
        self,
        question: str,
        expected_concepts: List[str],
        candidate_answer: str,
    ) -> Dict[str, Any]:
        """Calculates deterministic rubric score based on keyword coverage and answer structure."""
        words = candidate_answer.lower().split()
        word_count = len(words)

        matched_concepts = []
        missing_concepts = []
        for c in expected_concepts:
            c_terms = [t.lower() for t in c.split() if len(t) > 3]
            if any(term in candidate_answer.lower() for term in c_terms):
                matched_concepts.append(c)
            else:
                missing_concepts.append(c)

        concept_ratio = len(matched_concepts) / max(len(expected_concepts), 1)
        length_multiplier = min(max(word_count / 40.0, 0.5), 1.0)

        tech_score = round(min(max(4.0 + (concept_ratio * 5.0) * length_multiplier, 1.0), 9.5), 1)
        depth_score = round(min(max(3.5 + (concept_ratio * 4.5) * length_multiplier, 1.0), 9.0), 1)
        comm_score = round(min(max(5.0 + (1.0 if word_count >= 30 else -1.0), 1.0), 9.5), 1)

        return {
            "technical_score": tech_score,
            "depth_score": depth_score,
            "communication_score": comm_score,
            "key_strengths": [
                f"Demonstrated familiarity with {', '.join(matched_concepts[:2]) if matched_concepts else 'core problem statement'}."
            ],
            "missing_concepts": missing_concepts[:3] if missing_concepts else ["Elaborate further on failure modes."],
            "actionable_feedback": "Structure your response with clear architectural examples and mention measurable performance metrics.",
            "ideal_sample_response": f"In production systems, addressing {question} requires explaining the trade-offs, concurrency handling, and failover mechanisms.",
        }

    async def _finalize_interview(self, interview: MockInterviewDocument):
        """Computes aggregate scores and final diagnostic report for the session."""
        evaluated_questions = [q for q in interview.questions if q.evaluation is not None]
        if not evaluated_questions:
            return

        tech_scores = [q.evaluation.technical_score for q in evaluated_questions]
        comm_scores = [q.evaluation.communication_score for q in evaluated_questions]
        depth_scores = [q.evaluation.depth_score for q in evaluated_questions]

        avg_tech = round(sum(tech_scores) / len(tech_scores), 1)
        avg_comm = round(sum(comm_scores) / len(comm_scores), 1)
        avg_depth = round(sum(depth_scores) / len(depth_scores), 1)

        # Composite score on 0 - 100 scale: 40% Tech + 30% Depth + 30% Comm
        overall_composite = round(((avg_tech * 0.4) + (avg_depth * 0.3) + (avg_comm * 0.3)) * 10, 1)

        # Aggregate unique strengths & improvement areas
        all_strengths = []
        all_missing = []
        for q in evaluated_questions:
            all_strengths.extend(q.evaluation.key_strengths)
            all_missing.extend(q.evaluation.missing_concepts)

        unique_strengths = list(dict.fromkeys(all_strengths))[:4]
        unique_improvement = list(dict.fromkeys(all_missing))[:4]

        interview.status = "COMPLETED"
        interview.overall_score = overall_composite
        interview.technical_score_avg = avg_tech
        interview.communication_score_avg = avg_comm
        interview.strengths = unique_strengths
        interview.improvement_areas = unique_improvement
        interview.completed_at = datetime.now(timezone.utc)
        interview.summary_feedback = (
            f"Candidate demonstrated a solid technical score of {avg_tech}/10 with strong communication ({avg_comm}/10). "
            f"Recommended focus: deep dive into {', '.join(unique_improvement[:2]) if unique_improvement else 'advanced scalability'}."
        )

        await interview.save()
        logger.info("Finalized mock interview %s with overall score %s", interview.id, overall_composite)

    async def get_user_interviews(self, user_id: str) -> List[MockInterviewDocument]:
        """Lists past mock interview sessions for the candidate."""
        p_user_id = PydanticObjectId(user_id)
        return await MockInterviewDocument.find(
            MockInterviewDocument.user_id == p_user_id
        ).sort(-MockInterviewDocument.created_at).to_list()

    async def get_interview_by_id(self, user_id: str, interview_id: str) -> Optional[MockInterviewDocument]:
        """Retrieves a specific mock interview session."""
        p_user_id = PydanticObjectId(user_id)
        p_interview_id = PydanticObjectId(interview_id)
        return await MockInterviewDocument.find_one(
            MockInterviewDocument.id == p_interview_id,
            MockInterviewDocument.user_id == p_user_id,
        )

    async def delete_interview(self, user_id: str, interview_id: str) -> bool:
        """Deletes a mock interview record."""
        p_user_id = PydanticObjectId(user_id)
        p_interview_id = PydanticObjectId(interview_id)
        interview = await MockInterviewDocument.find_one(
            MockInterviewDocument.id == p_interview_id,
            MockInterviewDocument.user_id == p_user_id,
        )
        if interview:
            await interview.delete()
            return True
        return False


interview_service = InterviewService()
