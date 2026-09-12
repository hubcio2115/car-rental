"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "$components/ui/button";
import { Input } from "$components/ui/input";
import { Label } from "$components/ui/label";
import { register, type AuthFormState } from "$lib/auth/actions";

const initialState: AuthFormState = {};

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(register, initialState);
  const emailError = state.fieldErrors?.email?.[0];
  const passwordError = state.fieldErrors?.password?.[0];

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          defaultValue={state.values?.email}
          aria-invalid={emailError !== undefined}
          aria-describedby={emailError === undefined ? undefined : "email-error"}
        />
        {emailError === undefined ? null : (
          <p id="email-error" className="text-sm text-destructive" aria-live="polite">
            {emailError}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          maxLength={72}
          autoComplete="new-password"
          aria-invalid={passwordError !== undefined}
          aria-describedby={passwordError === undefined ? "password-hint" : "password-error"}
        />
        {passwordError === undefined ? (
          <p id="password-hint" className="text-sm text-muted-foreground">
            At least 8 characters.
          </p>
        ) : (
          <p id="password-error" className="text-sm text-destructive" aria-live="polite">
            {passwordError}
          </p>
        )}
      </div>

      {state.formError === undefined ? null : (
        <p className="text-sm text-destructive" role="alert">
          {state.formError}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Creating account" : "Create account"}
      </Button>

      <p className="text-sm">
        Already have an account?{" "}
        <Link href="/login" className="underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </form>
  );
}
