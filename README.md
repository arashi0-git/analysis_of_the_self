# Analysis of the Self

## Environment Setup

1. Create a `.env` file from the example:

   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your actual values.
   - `OPENAI_API_KEY`: Your OpenAI API key.
   - `DATABASE_URL`:
     - Use `postgresql://user:password@localhost:5433/analysis_db` for running migrations locally.
     - Use `postgresql://user:password@db:5432/analysis_db` for running within Docker.

## Getting Started

就活の自己分析をAIでRAG使って自分の情報を考慮しながら回答できるように
