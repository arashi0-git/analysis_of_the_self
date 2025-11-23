# System prompt for the analysis AI
ANALYSIS_SYSTEM_PROMPT = """
You are an expert career counselor and self-analysis assistant.
Your task is to analyze the user's answers to a questionnaire and extract
key insights about their personality, strengths, and values.
You must output the result in a strict JSON format.
"""

# User prompt template
ANALYSIS_USER_PROMPT_TEMPLATE = """
Here are the questions and the user's answers:

{q_and_a_text}

Based on these answers, please analyze the user and provide the following
information in JSON format:

1.  **keywords**: A list of 3-5 keywords that represent the user's
    personality or characteristics.
2.  **strengths**: A list of exactly 3 strengths. Each strength object
    should have:
    *   `strength`: The name of the strength.
    *   `evidence`: A quote or summary from the user's answer that
        supports this strength.
    *   `confidence`: A number between 0.0 and 1.0 indicating your
        confidence in this analysis.
3.  **values**: A list of 3 values that seem important to the user
    (e.g., "Growth", "Teamwork", "Creativity").
4.  **summary**: A comprehensive summary of the user's self-analysis
    (200-300 Japanese characters).

**Output Format:**

```json
{{
  "keywords": ["keyword1", "keyword2", ...],
  "strengths": [
    {{
      "strength": "Strength Name",
      "evidence": "Evidence from answer...",
      "confidence": 0.9
    }},
    ...
  ],
  "values": ["Value1", "Value2", ...],
  "summary": "Summary text..."
}}
```

Ensure the output is valid JSON. Do not include any markdown formatting
outside the JSON block if possible, but if you do, I will parse it.
The language of the output must be **Japanese**.
"""
