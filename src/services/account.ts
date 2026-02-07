import { supabase } from "../lib/supabase";
import { API_BASE_URL } from "./api";

export async function deleteMyAccount(): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("You must be signed in to delete your account.");
  }

  const response = await fetch(`${API_BASE_URL}/api/account/delete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to delete account.");
  }

  const data = await response.json().catch(() => ({}));
  if (data?.success !== true) {
    throw new Error("Account deletion could not be verified.");
  }
}
