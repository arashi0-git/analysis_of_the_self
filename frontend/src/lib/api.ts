export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

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

export async function getUserAnswers(
  token: string,
): Promise<UserAnswersResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${API_BASE_URL}/answers`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      // Log detailed error for debugging
      const errorText = await response.text();
      console.error(
        `Failed to get user answers: ${response.status} ${errorText}`,
      );
      // Throw user-friendly error message
      throw new Error("回答の取得に失敗しました。もう一度お試しください。");
    }

    const data = await response.json();

    // Validate response format
    if (!data || !Array.isArray(data.answers)) {
      throw new Error("Invalid response format from server");
    }

    return data as UserAnswersResponse;
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
