import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AppController } from "./app.controller.js";
import { AppService } from "./app.service.js";
import { Env, envSchema } from "./env.js";
import { DrizzleModule } from "@nestjs/drizzle";
import { createConnection } from "./db/db.js";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => envSchema.parse(config),
    }),
    DrizzleModule.forRootAsync({
      useFactory: (config: ConfigService<Env, true>) => ({
        db: createConnection(config.get("DATABASE_URL")),
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
