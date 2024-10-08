import solidPlugin from "vite-plugin-solid";
import { defineConfig } from "vitest/config";
import { useStyle } from "./src/shared";

export default defineConfig({
    plugins: [solidPlugin()],
    resolve: {
        conditions: ["development", "browser"],
    },
    test: {
        "setupFiles": [
            "fake-indexeddb/auto",
        ],
        typecheck: {
            allowJs: true,
            tsconfig: "./tsconfig"
        }
    },
})