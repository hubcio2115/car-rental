import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import type { Database } from "../src/db/db.js";
import { bootApp, client, resetDatabase, signIn } from "./helpers.js";

/** The web app's session check, so its shape is the documented one and nothing more. */
describe("users/me", () => {
  let app: NestFastifyApplication;
  let db: Database;

  beforeAll(async () => {
    ({ app, db } = await bootApp());
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDatabase(db);
  });

  it("returns the signed-in user with the default role, and 401s without a session", async () => {
    const user = await signIn(app, "me@test.example");

    const me = await user.get("/users/me");
    expect(me.json()).toEqual({
      user: { id: user.userId, email: "me@test.example", name: "me@test.example", role: "user" },
    });

    expect((await client(app).get("/users/me")).statusCode).toBe(401);
  });
});
