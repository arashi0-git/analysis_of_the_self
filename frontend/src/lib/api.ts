export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

/**
 * Get authentication token from localStorage.
 * CLIENT-SIDE ONLY: This function is designed for use in client components only.
 * Returns empty string in SSR/server environments.
 *
 * Note: Returns empty string instead of throwing to avoid breaking SSR.
 * API calls will fail with 401 if token is missing, which is handled by
 * individual API functions with user-friendly error messages.
 *
 * @returns JWT token or empty string
 */
function getToken(): string {
  if (typeof window === "undefined") {
    // SSR環境では空文字を返す（API呼び出しはクライアントサイドでのみ実行される想定）
    return "";
  }
  return localStorage.getItem("token") || "";
}

export interface GeneratedAnswer {
  reasoning: string;
  answer_text: string;
  referenced_memo_ids: string[];
}

export interface AnswerRequest {
  query_text: string;
}

export interface UserAnswer {
  id: string;
  user_id: string;
  question_id: string;
  answer_text: string;
  embedding_id: string | null;
}

export interface UserAnswersResponse {
  answers: UserAnswer[];
}

export async function generateAnswer(
  query: string,
  token: string,
): Promise<GeneratedAnswer> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒のタイムアウト

  try {
    const response = await fetch(`${API_BASE_URL}/chat/answer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query_text: query } as AnswerRequest),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to generate answer: ${response.status} ${errorText}`,
      );
    }

    const data = await response.json();

    // レスポンスの基本的な検証
    if (
      !data ||
      typeof data.answer_text !== "string" ||
      typeof data.reasoning !== "string"
    ) {
      throw new Error("Invalid response format from server");
    }

    return data as GeneratedAnswer;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timeout: The server took too long to respond");
    }
    throw error;
  }
}

export async function getUserAnswers(): Promise<{ answers: UserAnswer[] }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${API_BASE_URL}/answers`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    // 404 means user has no answers yet (first-time user)
    if (response.status === 404) {
      return { answers: [] };
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to get answers: ${response.status} ${errorText}`);
      throw new Error("回答の取得に失敗しました。もう一度お試しください。");
    }

    const data = await response.json();

    // レスポンス形式の検証
    if (!data || !Array.isArray(data.answers)) {
      console.error("Invalid response format from getUserAnswers");
      throw new Error("サーバーからの応答形式が不正です。");
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("サーバーの応答が遅すぎます。もう一度お試しください。");
    }
    throw error;
  }
}

export async function updateSingleAnswer(
  questionId: string,
  answerText: string,
  token: string,
): Promise<void> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${API_BASE_URL}/answers/${questionId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ answer_text: answerText }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      // Log detailed error for debugging
      const errorText = await response.text();
      console.error(`Failed to update answer: ${response.status} ${errorText}`);
      // Throw user-friendly error message
      throw new Error("回答の更新に失敗しました。もう一度お試しください。");
    }
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("サーバーの応答が遅すぎます。もう一度お試しください。");
    }
    throw error;
  }
}

export interface AnswerFeedbackResponse {
  feedback: string;
  suggestions: string[];
}

export async function getAnswerFeedback(
  questionId: string,
  answerText: string,
  token: string,
): Promise<AnswerFeedbackResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60秒タイムアウト

  try {
    const response = await fetch(
      `${API_BASE_URL}/answers/${questionId}/feedback`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ answer_text: answerText }),
        signal: controller.signal,
      },
    );
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to get feedback: ${response.status} ${errorText}`);
      throw new Error(
        "フィードバックの取得に失敗しました。もう一度お試しください。",
      );
    }

    const data = (await response.json()) as AnswerFeedbackResponse;

    // レスポンス形式の基本的な検証
    if (
      !data ||
      typeof data.feedback !== "string" ||
      !Array.isArray(data.suggestions)
    ) {
      throw new Error("サーバーからのフィードバック形式が不正です。");
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("サーバーの応答が遅すぎます。もう一度お試しください。");
    }
    throw error;
  }
}

// Episode Detail Types
export type MethodType = "STAR" | "5W1H";

export interface EpisodeDetailBase {
  method_type: MethodType;
  // STAR fields
  situation?: string;
  task?: string;
  action?: string;
  result?: string;
  // 5W1H fields
  what?: string;
  why?: string;
  when_detail?: string;
  where_detail?: string;
  who_detail?: string;
  how_detail?: string;
  // Common
  summary?: string;
}

export interface EpisodeDetailResponse extends EpisodeDetailBase {
  id: string;
  user_id: string;
  question_id: string;
  ai_feedback?: string;
  created_at: string;
  updated_at: string;
}

export interface EpisodeFeedbackRequest {
  original_answer: string;
  episode_detail: EpisodeDetailBase;
}

export interface EpisodeSummaryRequest {
  episode_detail: EpisodeDetailBase;
}

// Episode Detail API Functions
export async function createOrUpdateEpisodeDetail(
  questionId: string,
  episodeData: EpisodeDetailBase,
): Promise<EpisodeDetailResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${API_BASE_URL}/episodes/${questionId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(episodeData),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = "Failed to save episode detail";
      try {
        const error = JSON.parse(errorText);
        errorMessage = error.detail || errorMessage;
      } catch {
        console.error(
          `Failed to save episode detail: ${response.status} ${errorText}`,
        );
      }
      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(
        "リクエストがタイムアウトしました。もう一度お試しください。",
      );
    }
    throw error;
  }
}

export async function getEpisodeDetail(
  questionId: string,
): Promise<EpisodeDetailResponse | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${API_BASE_URL}/episodes/${questionId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = "Failed to get episode detail";
      try {
        const error = JSON.parse(errorText);
        errorMessage = error.detail || errorMessage;
      } catch {
        console.error(
          `Failed to get episode detail: ${response.status} ${errorText}`,
        );
      }
      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(
        "リクエストがタイムアウトしました。もう一度お試しください。",
      );
    }
    throw error;
  }
}

export async function getEpisodeFeedback(
  questionId: string,
  request: EpisodeFeedbackRequest,
): Promise<AnswerFeedbackResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s for AI processing

  try {
    const response = await fetch(
      `${API_BASE_URL}/episodes/${questionId}/feedback`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      },
    );
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = "Failed to get episode feedback";
      try {
        const error = JSON.parse(errorText);
        errorMessage = error.detail || errorMessage;
      } catch {
        console.error(
          `Failed to get episode feedback: ${response.status} ${errorText}`,
        );
      }
      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(
        "リクエストがタイムアウトしました(60秒)。もう一度お試しください。",
      );
    }
    throw error;
  }
}

export async function generateEpisodeSummary(
  questionId: string,
  request: EpisodeSummaryRequest,
): Promise<{ summary: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s for AI processing

  try {
    const response = await fetch(
      `${API_BASE_URL}/episodes/${questionId}/summary`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      },
    );
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = "Failed to generate summary";
      try {
        const error = JSON.parse(errorText);
        errorMessage = error.detail || errorMessage;
      } catch {
        console.error(
          `Failed to generate summary: ${response.status} ${errorText}`,
        );
      }
      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(
        "リクエストがタイムアウトしました(60秒)。もう一度お試しください。",
      );
    }
    throw error;
  }
}

// Question Types
export interface Question {
  id: string;
  category: string;
  question_text: string;
  display_order: number;
  weight: number;
  has_deep_dive: boolean;
}

export interface QuestionList {
  questions: Question[];
}

// Get Questions
export async function getQuestions(): Promise<QuestionList> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${API_BASE_URL}/questions`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = "Failed to get questions";
      try {
        const error = JSON.parse(errorText);
        errorMessage = error.detail || errorMessage;
      } catch {
        console.error(
          `Failed to get questions: ${response.status} ${errorText}`,
        );
      }
      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(
        "リクエストがタイムアウトしました。もう一度お試しください。",
      );
    }
    throw error;
  }
}
