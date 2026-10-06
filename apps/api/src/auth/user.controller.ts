import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse } from "@nestjs/swagger";
import { Session, type UserSession } from "@thallesp/nestjs-better-auth";
import { type CurrentUser, currentUserSchema } from "./user-response.dto.js";

@Controller("users")
export class UserController {
  @Get("me")
  @ApiOkResponse({ standardSchema: currentUserSchema })
  getProfile(@Session() session: UserSession): CurrentUser {
    // better-auth types `role` loosely; parsing narrows it to the column's enum and drops the
    // fields the spec doesn't promise.
    return currentUserSchema.parse({ user: session.user });
  }
}
