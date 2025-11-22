const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

export interface GeneratedAnswer {
  reasoning: string;
  answer_text: string;
  referenced_memo_ids: string[];
}

export interface AnswerRequest {
  query_text: string;
}

export async function generateAnswer(query: string): Promise<GeneratedAnswer> {
  const response = await fetch(`${API_BASE_URL}/answer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query_text: query } as AnswerRequest),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to generate answer: ${response.status} ${errorText}`,
    );
  }

  return response.json();
}
