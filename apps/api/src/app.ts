import type { NestApplicationOptions } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import { AppModule } from "./app.module.js";
import type { Env } from "./env.js";

/** Builds the app exactly as it runs, so e2e tests exercise the same wiring as `main.ts`. */
export async function createApp({ logger }: Pick<NestApplicationOptions, "logger"> = {}) {
  // better-auth parses bodies itself, see AuthModule's `bodyParser`.
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
    bodyParser: false,
    ...(logger === undefined ? {} : { logger }),
  });

  const config = app.get<ConfigService<Env, true>>(ConfigService);

  app.enableCors({
    origin: config.get("WEB_ORIGIN", { infer: true }),
    credentials: true,
    methods: ["GET", "POST", "DELETE"],
    allowedHeaders: ["Content-Type"],
    maxAge: 60 * 60,
  });

  app.enableShutdownHooks();

  return app;
}
