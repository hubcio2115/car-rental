"use server";

import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import * as z from "zod";

import { apiErrorDetail } from "~/lib/api/problem";
import { $serverFetch } from "~/lib/api/server-fetch";
import { loginSchema, registerSchema } from "./schema";
import { isAuthCookie } from "./session-cookie";

export interface AuthFormState {
  fieldErrors?: { email?: string[]; password?: string[] };
  formError?: string;
  values?: { email?: string };
}

const GENERIC_ERROR = "Something went wrong. Try again.";
// The API refuses cookie-bearing writes that don't come from this app's origin.
const ORIGIN_ERROR = "Security check failed. Refresh the page and try again.";
const INVALID_ERROR = "Check your details and try again.";

function submittedEmail(formData: FormData): string | undefined {
  const email = formData.get("email");
  return typeof email === "string" ? email : undefined;
}

function logFailure(label: string, status: number, body: unknown): void {
  console.error(`[auth] ${label} failed with ${status}`, apiErrorDetail(body));
}

export async function login(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  const values = { email: submittedEmail(formData) };

  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const { error } = await $serverFetch("/api/auth/sign-in/email", {
    method: "POST",
    body: parsed.data,
  });

  if (error !== null) {
    logFailure("login", error.status, error);
    const formError =
      error.status === 401
        ? "Invalid email or password."
        : error.status === 400
          ? INVALID_ERROR
          : error.status === 403
            ? ORIGIN_ERROR
            : GENERIC_ERROR;
    return { formError, values };
  }

  refresh();
  redirect("/");
}

export async function register(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  const values = { email: submittedEmail(formData) };

  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const { error } = await $serverFetch("/api/auth/sign-up/email", {
    method: "POST",
    // better-auth requires a display name. Nothing asks for one yet, so it's the email.
    body: { ...parsed.data, name: parsed.data.email },
  });

  if (error !== null) {
    logFailure("register", error.status, error);
    // No "already registered" case: with autoSignIn off, better-auth answers a taken email with
    // the same success as a new one, so sign-up can't be used to probe who has an account.
    const formError =
      error.status === 400 ? INVALID_ERROR : error.status === 403 ? ORIGIN_ERROR : GENERIC_ERROR;
    return { formError, values };
  }

  redirect("/login?registered=1");
}

export async function logout(): Promise<void> {
  await $serverFetch("/api/auth/sign-out", { method: "POST" });

  // The sign-out response expires them too, but a failed call must not leave the user signed in.
  const cookieStore = await cookies();
  for (const cookie of cookieStore.getAll()) {
    if (isAuthCookie(cookie.name)) cookieStore.delete(cookie.name);
  }

  refresh();
  redirect("/login");
}
