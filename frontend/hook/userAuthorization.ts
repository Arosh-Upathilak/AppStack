import { getSession } from "next-auth/react";

export async function userAuthorization() {
  const session = await getSession();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return {
    Authorization: `Bearer ${session.user.id}`,
    "Content-Type": "application/json",
  };
}