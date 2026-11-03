import { defineConfig } from "steiger";
import fsd from "@feature-sliced/steiger-plugin";

export default defineConfig([
  ...fsd.configs.recommended,
  {
    ignores: ["**/*.test.ts"],
  },
  {
    // ponytail: Faz 0 fixture'ı yalnız dinamik import ile yüklenir, steiger statik görmez.
    // Faz 1'de gerçek oyunlar apps/games'e taşınınca bu dosya kalkar, kural geri açılır.
    files: ["./src/features/mock-game/**"],
    rules: {
      "fsd/insignificant-slice": "off",
    },
  },
]);
