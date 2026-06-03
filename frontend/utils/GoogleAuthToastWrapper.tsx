"use client";
import { useGoogleAuthToast } from "@/hook/useGoogleAuthToast";

export default function GoogleAuthToastWrapper() {
  useGoogleAuthToast();
  return null;
}
