import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Env } from "../env.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

type Request = { method: string; headers: Record<string, string | string[] | undefined> };

/**
 * CSRF protection for the Nest routes, matching what better-auth does for its own: a request
 * that changes state with cookies must come from the web app's origin. Browsers always send
 * `Origin` on those requests and a cross-site page can't forge it, so no token is needed.
 */
@Injectable()
export class OriginGuard implements CanActivate {
  constructor(@Inject() private readonly config: ConfigService<Env, true>) {}

  canActivate(context: ExecutionContext) {
    const { method, headers } = context.switchToHttp().getRequest<Request>();
    if (SAFE_METHODS.has(method) || headers.cookie === undefined) return true;

    if (headers.origin !== this.config.get("WEB_ORIGIN", { infer: true })) {
      throw new ForbiddenException("Invalid origin");
    }

    return true;
  }
}
