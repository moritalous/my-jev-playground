import { catalog } from "@/lib/car-picker/catalog";

export const dynamic = "force-static";

export function GET() {
  return Response.json({
    builtAt: catalog.builtAt,
    tags: catalog.tags,
    glossary: catalog.glossary,
  });
}
