import json
import sys

import requests

BASE_URL = "http://localhost:8001"


def print_step(step):
    print(f"\n=== {step} ===")


def main():
    # 1. Create User
    # (Implicitly done by other endpoints, but let's ensure we have one
    # via memo creation)
    print_step("1. Creating Memo (and User)")

    memo_text = (
        "私の強みは、粘り強さと論理的思考力です。"
        "大学時代はプログラミングサークルで活動し、Pythonを使ってWebアプリを開発しました。"
    )
    response = requests.post(f"{BASE_URL}/memos", json={"text": memo_text}, timeout=10)

    if response.status_code == 200:
        print("Memo created successfully.")
        print(json.dumps(response.json(), indent=2, ensure_ascii=False))
    else:
        print(f"Failed to create memo: {response.status_code}")
        print(response.text)
        sys.exit(1)

    # 2. Ask Question
    print_step("2. Asking Question")

    query_text = "私の強みは何ですか？"
    response = requests.post(
        f"{BASE_URL}/answer", json={"query_text": query_text}, timeout=10
    )

    if response.status_code == 200:
        print("Answer generated successfully.")
        result = response.json()
        print(json.dumps(result, indent=2, ensure_ascii=False))

        # Basic Validation
        if (
            "粘り強さ" in result["answer_text"]
            or "論理的思考力" in result["answer_text"]
        ):
            print("\n[SUCCESS] Answer contains expected keywords.")
        else:
            print("\n[WARNING] Answer might not contain expected keywords.")

    else:
        print(f"Failed to generate answer: {response.status_code}")
        print(response.text)
        sys.exit(1)


if __name__ == "__main__":
    main()
