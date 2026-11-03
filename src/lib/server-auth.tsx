import { cookies } from "next/headers";
import { UserProvider } from "@/lib/user-context";

export async function ServerUserProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const loggedIn = cookieStore.get("loggedIn")?.value === "true";

  return (
    <UserProvider initialLoggedIn={loggedIn}>
      {children}
    </UserProvider>
  );
}
