import { authOptions } from "@/utils/authOptions";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (!(session as any)?.user?.role.includes("ADMIN")) {
    redirect("/");
  }

  return session;
}