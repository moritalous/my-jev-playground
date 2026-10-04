import type {
  Questions,
  RequestOptions,
  SystemOneRequest,
  SystemOneResult,
  TypeSafeClient,
} from "@typesafe-ai/sdk";

export type JevTrace = {
  label: string;
  request: { model: string; state: unknown; questions: unknown };
  response: { model: string; answers: unknown; usage: unknown } | null;
  ms: number;
  error?: string;
};

export function makeJevTrace(
  label: string,
  request: { model: string; state: unknown; questions: unknown },
  response: { model: string; answers: unknown; usage: unknown } | null,
  ms: number,
): JevTrace {
  return {
    label,
    request: {
      model: request.model,
      state: request.state,
      questions: request.questions,
    },
    response: response
      ? {
          model: response.model,
          answers: response.answers,
          usage: response.usage,
        }
      : null,
    ms: Math.round(ms),
  };
}

export async function tracedSystemOne<Q extends Questions>(
  client: TypeSafeClient,
  label: string,
  request: SystemOneRequest<Q>,
  options?: RequestOptions,
): Promise<{ result: SystemOneResult<Q>; trace: JevTrace }> {
  const sent = {
    model: request.model ?? client.defaultModel,
    state: request.state,
    questions: request.questions,
  };
  const started = performance.now();
  const result = await client.systemOne(request, options);
  const trace = makeJevTrace(label, sent, result, performance.now() - started);
  return { result, trace };
}
