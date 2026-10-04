import { MissingApiKeyError } from "./recommend";

export function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function errorResponse(e: unknown): Response {
  if (e instanceof MissingApiKeyError) {
    return Response.json(
      {
        error:
          "サーバーに TYPESAFE_API_KEY が設定されていません。環境変数を設定してください。",
      },
      { status: 503 },
    );
  }
  console.error(e);
  return Response.json(
    { error: "Jevの呼び出しに失敗しました" },
    { status: 502 },
  );
}
