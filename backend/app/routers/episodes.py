"""
Episode detail endpoints for STAR/5W1H deep-dive functionality
"""

from uuid import UUID

from app import models, schemas
from app.database import get_db
from app.routers.auth import get_current_user
from app.services.embedding import get_embedding
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

router = APIRouter(prefix="/episodes", tags=["episodes"])


def _build_episode_content(episode: models.EpisodeDetail) -> str:
    """Build content string from episode detail for embedding"""
    parts = []

    if episode.method_type == "STAR":
        if episode.situation:
            parts.append(f"状況: {episode.situation.strip()}")
        if episode.task:
            parts.append(f"課題: {episode.task.strip()}")
        if episode.action:
            parts.append(f"行動: {episode.action.strip()}")
        if episode.result:
            parts.append(f"結果: {episode.result.strip()}")
    else:  # 5W1H
        if episode.what:
            parts.append(f"何を: {episode.what.strip()}")
        if episode.why:
            parts.append(f"なぜ: {episode.why.strip()}")
        if episode.when_detail:
            parts.append(f"いつ: {episode.when_detail.strip()}")
        if episode.where_detail:
            parts.append(f"どこで: {episode.where_detail.strip()}")
        if episode.who_detail:
            parts.append(f"誰と: {episode.who_detail.strip()}")
        if episode.how_detail:
            parts.append(f"どのように: {episode.how_detail.strip()}")

    if episode.summary:
        parts.append(f"まとめ: {episode.summary.strip()}")

    return "\n".join(parts) if parts else ""


def _upsert_episode_embedding(
    db: Session,
    user_id: UUID,
    episode: models.EpisodeDetail,
    question_id: UUID,
    weight: float,
) -> None:
    """Create or update RAG embedding for episode detail"""
    content = _build_episode_content(episode)
    if not content:
        return

    try:
        embedding_vector = get_embedding(content)
    except Exception as e:
        import logging

        logger = logging.getLogger(__name__)
        logger.error(f"Failed to generate embedding for episode {episode.id}: {e}")
        return  # Skip embedding but don't fail the entire operation

    # Find and update existing embedding or create new one
    rag_embedding = (
        db.query(models.RagEmbedding)
        .filter(
            models.RagEmbedding.user_id == user_id,
            models.RagEmbedding.source_type == "episode_detail",
            models.RagEmbedding.source_id == episode.id,
        )
        .first()
    )

    if rag_embedding:
        rag_embedding.content = content
        rag_embedding.embedding = embedding_vector
        rag_embedding.weight = weight
    else:
        rag_embedding = models.RagEmbedding(
            user_id=user_id,
            source_type="episode_detail",
            source_id=episode.id,
            embedding=embedding_vector,
            content=content,
            question_id=question_id,
            weight=weight,
        )
        db.add(rag_embedding)


@router.post("/{question_id}", response_model=schemas.EpisodeDetailResponse)
def create_episode_detail(
    question_id: UUID,
    episode_data: schemas.EpisodeDetailCreate,
    current_user: models.User = Depends(get_current_user),  # noqa: B008
    db: Session = Depends(get_db),  # noqa: B008
):
    """Create or update episode detail for a question"""
    # Check if question exists and has deep_dive enabled
    question = db.get(models.Question, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    if not question.has_deep_dive:
        raise HTTPException(
            status_code=400,
            detail="This question does not support deep-dive functionality",
        )

    # Check if episode detail already exists
    existing = (
        db.query(models.EpisodeDetail)
        .filter(
            models.EpisodeDetail.user_id == current_user.id,
            models.EpisodeDetail.question_id == question_id,
        )
        .first()
    )

    try:
        if existing:
            # Update existing
            for field, value in episode_data.model_dump(exclude_unset=True).items():
                setattr(existing, field, value)

            # Update RAG embedding
            _upsert_episode_embedding(
                db, current_user.id, existing, question_id, question.weight
            )

            db.commit()
            db.refresh(existing)
            return existing

        # Create new
        episode_detail = models.EpisodeDetail(
            user_id=current_user.id,
            question_id=question_id,
            **episode_data.model_dump(),
        )
        db.add(episode_detail)
        db.flush()  # Get ID without committing

        # Add to RAG embeddings
        _upsert_episode_embedding(
            db, current_user.id, episode_detail, question_id, question.weight
        )

        db.commit()
        db.refresh(episode_detail)
        return episode_detail

    except Exception:
        db.rollback()
        raise
    else:
        return episode_detail


@router.get("/{question_id}", response_model=schemas.EpisodeDetailResponse)
def get_episode_detail(
    question_id: UUID,
    current_user: models.User = Depends(get_current_user),  # noqa: B008
    db: Session = Depends(get_db),  # noqa: B008
):
    """Get episode detail for a question"""
    episode_detail = (
        db.query(models.EpisodeDetail)
        .filter(
            models.EpisodeDetail.user_id == current_user.id,
            models.EpisodeDetail.question_id == question_id,
        )
        .first()
    )

    if not episode_detail:
        raise HTTPException(status_code=404, detail="Episode detail not found")

    return episode_detail


@router.post("/{question_id}/feedback", response_model=schemas.AnswerFeedbackResponse)
def get_episode_feedback(
    question_id: UUID,
    request: schemas.EpisodeFeedbackRequest,
    _: models.User = Depends(get_current_user),  # noqa: B008
    db: Session = Depends(get_db),  # noqa: B008
):
    """Generate AI feedback for episode detail"""
    import openai

    question = db.get(models.Question, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    # Build episode detail text
    episode = request.episode_detail
    detail_text = _build_episode_content(episode) or "未記入"

    prompt = (
        f"あなたは就活支援の専門家です。以下のエピソードを{episode.method_type}法で"
        f"整理した内容を評価し、改善提案を提供してください。\n\n"
        f"【元の回答】\n{request.original_answer}\n\n"
        f"【{episode.method_type}法詳細】\n{detail_text}\n\n"
        f"以下の観点でフィードバックを提供してください:\n"
        f"1. 具体性: 数字や固有名詞を使って具体的に表現できているか\n"
        f"2. 論理性: 因果関係が明確か\n"
        f"3. 成果: 結果が定量的・定性的に示されているか\n"
        f"4. 強みの表現: あなたの強みが伝わるか\n\n"
        f"改善提案を日本語で、箇条書き形式で提供してください。"
    )

    try:
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
        )
    except Exception as e:
        import logging

        logging.error(f"Failed to generate episode feedback: {e!s}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to generate feedback",
        ) from e

    feedback_text = response.choices[0].message.content

    # Extract suggestions
    suggestions = [
        line.strip("- ").strip()
        for line in feedback_text.split("\n")
        if line.strip().startswith("-") or line.strip().startswith("•")
    ]

    return {
        "feedback": feedback_text,
        "suggestions": suggestions
        if suggestions
        else ["より具体的な例を追加してください"],
    }


@router.post("/{question_id}/summary")
def generate_summary(
    question_id: UUID,
    request: schemas.EpisodeSummaryRequest,
    _: models.User = Depends(get_current_user),  # noqa: B008
    db: Session = Depends(get_db),  # noqa: B008
):
    """Generate summary from episode detail"""
    import openai

    question = db.get(models.Question, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    episode = request.episode_detail
    detail_text = _build_episode_content(episode)

    prompt = (
        f"以下の{episode.method_type}法の各項目から、簡潔で分かりやすいまとめを"
        f"200-300文字で生成してください。\n\n"
        f"{detail_text}\n\n"
        f"まとめは、第三者が読んでもエピソードの全体像が理解できるようにしてください。"
    )

    try:
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
        )
    except Exception as e:
        import logging

        logging.error(f"Failed to generate summary: {e!s}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to generate summary",
        ) from e

    summary = response.choices[0].message.content

    return {"summary": summary}
