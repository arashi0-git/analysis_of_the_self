import os
import sys

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import DATABASE_URL

INITIAL_QUESTIONS = [
    # 小学校
    {
        "category": "elementary",
        "question_text": "小学校時代で最も印象に残っている出来事は何ですか？",
        "display_order": 1,
        "weight": 1.5,
    },
    {
        "category": "elementary",
        "question_text": "小学校時代に最も力を入れて取り組んだことは何ですか？",
        "display_order": 2,
        "weight": 2.0,
    },
    # 中学校
    {
        "category": "junior_high",
        "question_text": "中学校時代で最も印象に残っている出来事は何ですか？",
        "display_order": 3,
        "weight": 1.5,
    },
    {
        "category": "junior_high",
        "question_text": "中学校時代に最も力を入れて取り組んだことは何ですか？",
        "display_order": 4,
        "weight": 2.0,
    },
    # 高校
    {
        "category": "high_school",
        "question_text": "高校時代で最も印象に残っている出来事は何ですか？",
        "display_order": 5,
        "weight": 1.5,
    },
    {
        "category": "high_school",
        "question_text": "高校時代に最も力を入れて取り組んだことは何ですか？",
        "display_order": 6,
        "weight": 2.0,
    },
    # 大学
    {
        "category": "university",
        "question_text": "大学時代（現在）で最も印象に残っている出来事は何ですか？",
        "display_order": 7,
        "weight": 1.5,
    },
    {
        "category": "university",
        "question_text": "大学時代（現在）に最も力を入れて取り組んだことは何ですか？",
        "display_order": 8,
        "weight": 2.0,
    },
    # 価値観
    {
        "category": "values",
        "question_text": "あなたが大切にしている価値観や信念は何ですか？",
        "display_order": 9,
        "weight": 2.5,
    },
    {
        "category": "values",
        "question_text": "将来どのような社会人になりたいですか？",
        "display_order": 10,
        "weight": 1.5,
    },
]


def seed_questions():
    print("Connecting to database...")
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        print("Checking existing questions...")
        result = session.execute(text("SELECT COUNT(*) FROM questions"))
        count = result.scalar()

        if count > 0:
            print(f"Found {count} existing questions. Skipping seed.")
            return

        print("Seeding initial questions...")
        for q in INITIAL_QUESTIONS:
            session.execute(
                text(
                    """
                    INSERT INTO questions
                    (category, question_text, display_order, weight)
                    VALUES
                    (:category, :question_text, :display_order, :weight)
                """
                ),
                q,
            )

        session.commit()
        print("Successfully seeded questions!")
    except Exception as e:
        print(f"Error seeding questions: {e}")
        session.rollback()
    finally:
        session.close()


if __name__ == "__main__":
    seed_questions()
