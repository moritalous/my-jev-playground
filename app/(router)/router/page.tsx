import { Router } from "@/components/router/router";
import samples from "@/data/router/samples.json";
import { customerState, questions } from "@/lib/router/questions";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Router
      hasKey={Boolean(process.env.TYPESAFE_API_KEY?.trim())}
      samples={samples}
      customer={customerState}
      questionsJson={JSON.stringify(questions, null, 2)}
    />
  );
}
