import { Button } from "$components/ui/button";
import { MainNav } from "$components/main-nav";
import { logout } from "$lib/auth/actions";

export default function ProtectedLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="relative min-h-dvh">
      <header className="absolute top-0 right-0 z-10 flex items-center gap-4.5 p-4">
        <MainNav />

        <form action={logout}>
          <Button type="submit" variant="outline" size="sm" className="cursor-pointer">
            Sign out
          </Button>
        </form>
      </header>

      {children}
    </div>
  );
}
