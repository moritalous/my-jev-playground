import { Demo } from "@/components/search-filter/demo";
import { getApiKey, queries } from "@/lib/search-filter/search-filter";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Demo
      hasKey={Boolean(getApiKey())}
      queries={queries.map((q) => ({
        query: q.query,
        products: q.products.map((p) => ({
          id: p.id,
          title: p.title,
          brand: p.brand,
          color: p.color,
        })),
      }))}
    />
  );
}
