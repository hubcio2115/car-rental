import { Suspense } from "react";

import { LoginForm } from "./login-form";
import { createLoader, parseAsString } from "nuqs/server";

export default function LoginPage(props: PageProps<"/login">) {
  return (
    <>
      <h1 className="text-2xl font-semibold">Sign in</h1>

      <Suspense fallback={null}>
        <RegisteredNotice searchParams={props.searchParams} />
      </Suspense>

      <LoginForm />
    </>
  );
}

const loginSearchParams = {
  registered: parseAsString,
};

const loadSearchParams = createLoader(loginSearchParams);

async function RegisteredNotice({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const { registered } = await loadSearchParams(searchParams);
  if (registered !== "1") return null;

  return (
    <p role="status" className="text-sm">
      Account created. Sign in below.
    </p>
  );
}
