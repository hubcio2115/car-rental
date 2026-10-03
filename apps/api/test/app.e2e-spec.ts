import { Test } from "@nestjs/testing";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import { AppModule } from "./../src/app.module.js";

describe("AppController (e2e)", () => {
  let app: NestFastifyApplication;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await app.init();
    // Fastify only accepts injected requests once its plugins have loaded
    await app.getHttpAdapter().getInstance().ready();
  });

  it("/ (GET)", async () => {
    const res = await app.inject({ method: "GET", url: "/" });

    expect(res.statusCode).toBe(200);
    expect(res.body).toBe("Hello World!");
  });

  afterEach(async () => {
    await app.close();
  });
});
