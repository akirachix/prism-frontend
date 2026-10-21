"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/layout/AuthShell";
import { authApi } from "../api";
import { loginRouteFor, portalForRole } from "../roles";
import { clearSession, useSession } from "../session";

export function LogoutScreen() {
  const router = useRouter();
  const { user } = useSession();
  const portal = portalForRole(user?.role);
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      await authApi.logout();
    } catch {
    } finally {
      clearSession();
      router.replace(loginRouteFor(portal));
    }
  }

  return (
    <AuthShell subtitle="Logout" role={portal}>
      <div
        style={{
          maxWidth: 380,
          width: "100%",
          margin: "0 auto",
          display: "grid",
          gap: 20,
        }}
      >
        <div
          style={{ display: "flex", justifyContent: "center", marginTop: 8 }}
        >
          <div
            style={{
              width: 126,
              height: 126,
              borderRadius: "50%",
              border: "3px solid #0a2d5d",
              display: "grid",
              placeItems: "center",
              position: "relative",
              background: "#f8f4ef",
            }}
          >
            <div
              style={{
                width: 68,
                height: 68,
                borderRadius: 18,
                border: "3px solid #0a2d5d",
                display: "grid",
                placeItems: "center",
                background: "#f8f4ef",
              }}
            >
              <span
                aria-hidden="true"
                style={{ fontSize: 28, fontWeight: 700 }}
              >
                →
              </span>
            </div>
            <span
              style={{
                position: "absolute",
                top: 8,
                right: 12,
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: "#d51d38",
                border: "3px solid #f8f4ef",
              }}
            />
          </div>
        </div>

        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: 30, color: "#0a2d5d", marginBottom: 10 }}>
            Logout of Mirai?
          </h2>
          <p
            style={{
              fontSize: 16,
              color: "#062657",
              opacity: 0.8,
              lineHeight: 1.5,
            }}
          >
            Are you sure you want to log out? You can sign in again to access
            your {portal} account.
          </p>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          <button
            type="button"
            onClick={() => router.back()}
            disabled={loading}
            style={{
              height: 52,
              borderRadius: 999,
              border: "2px solid #0a2d5d",
              background: "transparent",
              color: "#0a2d5d",
              fontWeight: 700,
              fontSize: 18,
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={logout}
            disabled={loading}
            style={{
              height: 52,
              borderRadius: 999,
              border: "2px solid #d51d38",
              background: "#d51d38",
              color: "#fff",
              fontWeight: 700,
              fontSize: 18,
            }}
          >
            {loading ? "Please wait…" : "Logout"}
          </button>
        </div>
      </div>
    </AuthShell>
  );
}
