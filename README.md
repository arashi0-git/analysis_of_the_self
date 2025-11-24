# Analysis of the Self - AI自己分析支援アプリ

RAG（Retrieval-Augmented Generation）とAIを活用した、自己分析・就活支援アプリケーションです。

## 📸 スクリーンショット

### ホームページ
<!-- スクリーンショットをここに配置: screenshots/home.png -->

### 質問回答ページ（AI添削機能付き）
<!-- スクリーンショットをここに配置: screenshots/questionnaire.png -->

### 分析結果ページ
<!-- スクリーンショットをここに配置: screenshots/analysis.png -->

### チャットページ
<!-- スクリーンショットをここに配置: screenshots/chat.png -->

## 🎯 主な機能

### 1. ユーザー認証

- JWT認証による安全なログイン・登録
- Argon2によるパスワードハッシュ化
- セッション管理

### 2. 質問回答システム

- 10問の自己分析質問に回答
- **AI添削機能**: 各質問に対してGPT-3.5-turboが改善提案を提供
  - 具体性の向上
  - 深掘り質問
  - 強みの明確化
- 個別保存機能（一問ずつ保存可能）
- 既存回答の編集

### 3. AI分析

- OpenAI GPT-4を使用した自己分析
- キーワード抽出
- 強みの特定（エビデンス付き）
- 価値観の分析
- 総合サマリー生成

### 4. RAGチャット

- pgvectorによるベクトル検索
- 過去の回答を参照したAI回答生成
- リアルタイムチャットUI

### 5. 統合UX

- 質問回答と編集を1ページで完結
- レスポンシブデザイン
- 直感的なUI/UX

## 🏗️ アーキテクチャ

```mermaid
graph TB
    subgraph "Frontend (Next.js)"
        UI[Chat UI]
        API_CLIENT[API Client]
    end
    
    subgraph "Backend (FastAPI)"
        MEMO_API[POST /memos]
        ANSWER_API[POST /answer]
        EMB_SVC[Embedding Service]
        SEARCH_SVC[Vector Search Service]
        LLM_SVC[LLM Service]
    end
    
    subgraph "External Services"
        OPENAI[OpenAI API]
    end
    
    subgraph "Database"
        POSTGRES[(PostgreSQL + pgvector)]
    end
    
    UI --> API_CLIENT
    API_CLIENT --> MEMO_API
    API_CLIENT --> ANSWER_API
    
    MEMO_API --> EMB_SVC
    EMB_SVC --> OPENAI
    EMB_SVC --> POSTGRES
    
    ANSWER_API --> EMB_SVC
    ANSWER_API --> SEARCH_SVC
    ANSWER_API --> LLM_SVC
    
    SEARCH_SVC --> POSTGRES
    LLM_SVC --> OPENAI
    
    style UI fill:#61dafb
    style POSTGRES fill:#336791
    style OPENAI fill:#10a37f
```

## 🛠️ 使用技術

### Frontend

- **Next.js 16.0.3** (App Router)
- **React 19.2.0**
- **TypeScript**
- **TailwindCSS**
- **react-markdown** - Markdown表示

### Backend

- **Python 3.11+**
- **FastAPI 0.121.3**
- **SQLAlchemy 2.0.44** - ORM
- **Alembic 1.13.1** - マイグレーション
- **OpenAI SDK 2.8.1**
- **pgvector 0.4.1** - ベクトル検索

### Infrastructure

- **Docker & Docker Compose**
- **PostgreSQL** with **pgvector**

## 📋 前提条件

- Docker Desktop
- OpenAI API Key

## 🚀 セットアップ方法

### 1. リポジトリのクローン

```bash
git clone https://github.com/arashi0-git/analysis_of_the_self.git
cd analysis_of_the_self
```

### 2. 環境変数の設定

`.env`ファイルをプロジェクトルートに作成:

```env
OPENAI_API_KEY=your_openai_api_key_here

POSTGRES_USER=user
POSTGRES_PASSWORD=password
POSTGRES_DB=analysis_db
DATABASE_URL=postgresql://user:password@db:5432/analysis_db
```

### 3. Dockerコンテナの起動

```bash
docker compose up -d --build
```

### 4. データベースマイグレーション

```bash
docker compose exec backend alembic upgrade head
```

## 💻 使用方法

### アプリケーションへのアクセス

ブラウザで以下のURLにアクセス:

```
http://localhost:3000/chat
```

### メモの保存

APIを使用してメモを保存:

```bash
curl -X POST http://localhost:8001/memos \
  -H "Content-Type: application/json" \
  -d '{"text": "私の強みは粘り強さと論理的思考力です。"}'
```

### チャットで質問

UIから質問を入力すると、保存されたメモを検索してAIが回答を生成します。

## 📁 プロジェクト構造

```
analysis_of_the_self/
├── frontend/               # Next.js フロントエンド
│   ├── src/
│   │   ├── app/           # App Router ページ
│   │   ├── components/    # Reactコンポーネント
│   │   └── lib/           # ユーティリティ
│   └── Dockerfile
├── backend/               # FastAPI バックエンド
│   ├── app/
│   │   ├── main.py       # エントリーポイント
│   │   ├── models.py     # SQLAlchemyモデル
│   │   ├── schemas.py    # Pydanticスキーマ
│   │   └── services/     # ビジネスロジック
│   ├── alembic/          # マイグレーション
│   └── Dockerfile
├── scripts/              # ユーティリティスクリプト
└── docker-compose.yml
```

## 🔧 開発

### バックエンドのテスト

```bash
docker compose exec backend pytest
```

### コードフォーマット

```bash
# Backend
docker compose exec backend ruff format .

# Frontend
docker compose exec frontend npm run format
```

## 📝 API エンドポイント

### POST /memos

メモを保存し、自動的にEmbeddingを生成

**Request:**

```json
{
  "text": "メモの内容"
}
```

**Response:**

```json
{
  "status": "success",
  "message": "Memo saved successfully"
}
```

### POST /answer

質問に対してRAGベースの回答を生成

**Request:**

```json
{
  "query_text": "私の強みは何ですか？"
}
```

**Response:**

```json
{
  "reasoning": "思考プロセス",
  "answer_text": "回答テキスト",
  "referenced_memo_ids": ["uuid1", "uuid2"]
}
```

## 🎨 主な実装ポイント

### 構造化出力

OpenAIの`beta.chat.completions.parse`を使用し、Pydanticモデルで型安全な回答を生成

### ベクトル検索

pgvectorのコサイン距離を使用した高速な類似度検索

### 競合状態制御

フロントエンドで複数リクエストの順序制御を実装

### タイムアウト処理

APIリクエストに30秒のタイムアウトを設定

## 📄 ライセンス

MIT License

## 👤 作成者

arashi0-git
