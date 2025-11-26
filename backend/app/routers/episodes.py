"""
Episode detail endpoints for STAR/5W1H deep-dive functionality
"""

from uuid import UUID

from app import models, schemas
from app.database import get_db
from app.routers.auth import get_current_user
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

router = APIRouter(prefix="/episodes", tags=["episodes"])


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

    if existing:
        # Update existing
        for field, value in episode_data.model_dump(exclude_unset=True).items():
            setattr(existing, field, value)
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
    db.commit()
    db.refresh(episode_detail)

    # TODO: Add to RAG embeddings

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
    if episode.method_type == "STAR":
        detail_text = (
            f"状況（Situation）: {episode.situation or '未記入'}\n"
            f"課題（Task）: {episode.task or '未記入'}\n"
            f"行動（Action）: {episode.action or '未記入'}\n"
            f"結果（Result）: {episode.result or '未記入'}"
        )
    else:  # 5W1H
        detail_text = (
            f"何を（What）: {episode.what or '未記入'}\n"
            f"なぜ（Why）: {episode.why or '未記入'}\n"
            f"いつ（When）: {episode.when_detail or '未記入'}\n"
            f"どこで（Where）: {episode.where_detail or '未記入'}\n"
            f"誰と（Who）: {episode.who_detail or '未記入'}\n"
            f"どのように（How）: {episode.how_detail or '未記入'}"
        )

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
    if episode.method_type == "STAR":
        detail_text = (
            f"状況: {episode.situation or ''}\n"
            f"課題: {episode.task or ''}\n"
            f"行動: {episode.action or ''}\n"
            f"結果: {episode.result or ''}"
        )
    else:
        detail_text = (
            f"何を: {episode.what or ''}\n"
            f"なぜ: {episode.why or ''}\n"
            f"いつ: {episode.when_detail or ''}\n"
            f"どこで: {episode.where_detail or ''}\n"
            f"誰と: {episode.who_detail or ''}\n"
            f"どのように: {episode.how_detail or ''}"
        )

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
