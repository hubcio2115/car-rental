import { Module, StandardSchemaValidationPipe } from "@nestjs/common";
import { APP_GUARD, APP_PIPE } from "@nestjs/core";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { Env, envSchema } from "./env.js";
import { DrizzleModule, getDrizzleToken } from "@nestjs/drizzle";
import { createConnection, Database } from "./db/db.js";
import { AuthModule } from "@thallesp/nestjs-better-auth";
import { createAuth } from "./auth/auth.js";
import { CarsModule } from "./car/car.module.js";
import { UserModule } from "./auth/user.module.js";
import { RentalModule } from "./rental/rental.module.js";
import { OriginGuard } from "./auth/origin.guard.js";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => envSchema.parse(config),
    }),
    DrizzleModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        db: createConnection(config.get("DATABASE_URL")),
      }),
    }),
    AuthModule.forRootAsync({
      inject: [getDrizzleToken(), ConfigService],
      useFactory: (db: Database, config: ConfigService<Env, true>) => ({
        auth: createAuth(db, config.get("WEB_ORIGIN", { infer: true })),
        bodyParser: {
          json: { limit: "2mb" },
          // JSON only: no route takes form bodies, and without a form parser a cross-site
          // <form> post can't reach a handler. (`extended: true` also needed the missing `qs`.)
          urlencoded: { enabled: false },
          rawBody: true,
        },
      }),
    }),
    CarsModule,
    UserModule,
    RentalModule,
  ],
  controllers: [],
  // Registered here rather than in main.ts, so e2e tests get them too.
  providers: [
    { provide: APP_GUARD, useClass: OriginGuard },
    { provide: APP_PIPE, useClass: StandardSchemaValidationPipe },
  ],
})
export class AppModule {}
