import { inject } from "vitest";

// Runs before each spec imports AppModule, whose config validation reads the env at import time.
process.env.DATABASE_URL = inject("databaseUrl");
