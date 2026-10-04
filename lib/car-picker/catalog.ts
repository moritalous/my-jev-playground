import catalogJson from "@/data/car-picker/catalog.json";
import type { Catalog } from "./types";

export const catalog = catalogJson as unknown as Catalog;
