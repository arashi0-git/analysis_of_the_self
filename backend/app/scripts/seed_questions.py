"""
Seed script to populate questions table with new 7-question structure
"""

import os
import sys

from app.models import Question
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

load_dotenv()

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: DATABASE_URL environment variable is not set")
    sys.exit(1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def seed_questions():
    """Seed the database with initial questions."""
    # Environment protection: prevent running in production
    environment = os.getenv("ENVIRONMENT", "development")
    if environment.lower() == "production":
        print("ERROR: This script cannot be run in production environment")
        print("It will delete all existing questions and related data.")
        sys.exit(1)

    # Additional confirmation for safety
    print("WARNING: This will delete all existing questions and related data!")
    print(f"Current environment: {environment}")
    confirmation = input("Type 'yes' to continue: ")
    if confirmation.lower() != "yes":
        print("Operation cancelled.")
        sys.exit(0)

    db = SessionLocal()

    try:
        # WARNING: This will cascade delete all related user_answers
        # and episode_details! Only run in development/staging.
        db.query(Question).delete()
        db.commit()

        # New 7 questions
        questions = [
            {
                "category": "childhood",
                "question_text": (
                    "小学校時代で最も印象に残っている出来事を教えてください。"
                ),
                "display_order": 1,
                "weight": 1.0,
                "has_deep_dive": False,
            },
            {
                "category": "childhood",
                "question_text": (
                    "中学校時代で最も印象に残っている出来事を教えてください。"
                ),
                "display_order": 2,
                "weight": 1.0,
                "has_deep_dive": False,
            },
            {
                "category": "childhood",
                "question_text": (
                    "高校時代で最も印象に残っている出来事を教えてください。"
                ),
                "display_order": 3,
                "weight": 1.0,
                "has_deep_dive": False,
            },
            {
                "category": "student_life",
                "question_text": (
                    "学生時代で最も力を入れて取り組んだことを教えてください。"
                ),
                "display_order": 4,
                "weight": 1.5,
                "has_deep_dive": True,
            },
            {
                "category": "student_life",
                "question_text": "学生時代で最も印象に残っていることを教えてください。",
                "display_order": 5,
                "weight": 1.5,
                "has_deep_dive": True,
            },
            {
                "category": "values",
                "question_text": "あなたが大切にしたい価値観を教えてください。",
                "display_order": 6,
                "weight": 1.5,
                "has_deep_dive": True,
            },
            {
                "category": "future",
                "question_text": (
                    "将来どうなりたいか、あなたの目標や夢を教えてください。"
                ),
                "display_order": 7,
                "weight": 1.5,
                "has_deep_dive": True,
            },
        ]

        for q_data in questions:
            question = Question(**q_data)
            db.add(question)

        db.commit()
        print(f"✅ Successfully seeded {len(questions)} questions")

    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding questions: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_questions()
