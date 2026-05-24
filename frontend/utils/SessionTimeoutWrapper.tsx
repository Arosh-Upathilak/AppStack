"use client";
import { useSessionTimeout } from "@/hook/useSessionTimeout";

export default function SessionTimeoutWrapper() {
  useSessionTimeout();
  return null;
}
