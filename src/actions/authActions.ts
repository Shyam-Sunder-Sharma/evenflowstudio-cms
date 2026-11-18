"use server";

import { redirect } from "next/navigation";
import { createSession, deleteSession } from "../lib/auth";

export async function loginAction(
  prevState: { error?: string } | null,
  formData: FormData
) {
  const email = (formData.get("email") as string)?.trim();
  const password = (formData.get("password") as string)?.trim();

  const adminEmail = process.env.ADMIN_EMAIL || "admin@evenflowstudio.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@12345";

  if (!email || !password) {
    return { error: "Please provide both email and password." };
  }

  if (email.toLowerCase() !== adminEmail.toLowerCase() || password !== adminPassword) {
    return { error: "Invalid email or password." };
  }

  await createSession(email);
  redirect("/dashboard");
}

export async function logoutAction() {
  await deleteSession();
  redirect("/login");
}
