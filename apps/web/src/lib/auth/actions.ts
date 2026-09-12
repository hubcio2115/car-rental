"use server";

import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import * as z from "zod";

import { springErrorDetail } from "~/lib/api/problem";
import { $serverFetch } from "~/lib/api/server-fetch";
import { loginSchema, registerSchema, userSchema } from "./schema";

export interface AuthFormState {
  fieldErrors?: { email?: string[]; password?: string[] };
  formError?: string;
  values?: { email?: string };
}

const GENERIC_ERROR = "Something went wrong. Try again.";
const CSRF_ERROR = "Security check failed. Refresh the page and try again.";
const INVALID_ERROR = "Check your details and try again.";

function submittedEmail(formData: FormData): string | undefined {
  const email = formData.get("email");
  return typeof email === "string" ? email : undefined;
}

function logFailure(label: string, status: number, body: unknown): void {
  console.error(`[auth] ${label} failed with ${status}`, springErrorDetail(body));
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

  const { error } = await $serverFetch("/auth/login", {
    method: "POST",
    body: parsed.data,
    output: userSchema,
  });

  if (error !== null) {
    logFailure("login", error.status, error);
    const formError =
      error.status === 401
        ? "Invalid email or password."
        : error.status === 400
          ? INVALID_ERROR
          : error.status === 403
            ? CSRF_ERROR
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

  const { error } = await $serverFetch("/auth/register", {
    method: "POST",
    body: parsed.data,
    output: userSchema,
  });

  if (error !== null) {
    logFailure("register", error.status, error);
    if (error.status === 409) {
      return { fieldErrors: { email: ["That email is already registered."] }, values };
    }
    const formError =
      error.status === 400 ? INVALID_ERROR : error.status === 403 ? CSRF_ERROR : GENERIC_ERROR;
    return { formError, values };
  }

  redirect("/login?registered=1");
}

export async function logout(): Promise<void> {
  await $serverFetch("/auth/logout", { method: "POST" });

  const cookieStore = await cookies();
  cookieStore.delete("JSESSIONID");

  refresh();
  redirect("/login");
}
