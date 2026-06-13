"use client";

import React, { useCallback, useEffect, useState } from "react";
import Icon from "@/components/Icon";
import { toast } from "react-toastify";
import { getUsers, updateUserRole, deleteUserGDPR } from "@/lib/api/admin";
import type { UserAdmin } from "@/lib/api/admin";
import { getErrorMessage } from "@/lib/api/errors";

type UserRole = UserAdmin["roles"][number];
const ROLE_OPTIONS: UserRole[] = ["BUYER", "SELLER", "ADMIN"];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  // Role Edit Modal State
  const [editingUser, setEditingUser] = useState<UserAdmin | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const loadUsers = useCallback(async (pageNum = 1) => {
    try {
      setLoading(true);
      const data = await getUsers(pageNum, 10, search, roleFilter);
      setUsers(data.users);
      setPage(data.pagination.page);
      setTotalPages(data.pagination.pages);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load user list"));
    } finally {
      setLoading(false);
    }
  }, [roleFilter, search]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadUsers(1);
    }, 300); // Debounce search
    return () => window.clearTimeout(timeout);
  }, [loadUsers]);

  const handleOpenEditRoles = (user: UserAdmin) => {
    setEditingUser(user);
    setSelectedRoles([...user.roles]);
  };

  const handleCloseEditRoles = () => {
    setEditingUser(null);
    setSelectedRoles([]);
  };

  const handleToggleRole = (role: UserRole) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter((r) => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const handleRolesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (selectedRoles.length === 0) {
      toast.error("User must have at least one role.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await updateUserRole(editingUser.id, selectedRoles);
      toast.success(res.message || "User roles updated successfully!");
      handleCloseEditRoles();
      loadUsers(page);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update user roles"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGDPR = async (user: UserAdmin) => {
    const confirmation = prompt(
      `GDPR WARNING: This will permanently wipe all personal identifier data for ${user.email}. Subscriptions, Invoices, and Consent logs will remain intact with anonymized tokens. Type "ANONYMIZE" to confirm.`
    );

    if (confirmation !== "ANONYMIZE") {
      if (confirmation !== null) {
        toast.info("GDPR deletion cancelled.");
      }
      return;
    }

    try {
      const res = await deleteUserGDPR(user.id);
      toast.success(res.message || "User personal data successfully anonymized!");
      loadUsers(page);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to delete/anonymize user"));
    }
  };

  return (
    <div className="page screen-enter" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 className="page-title">User management</h1>
        <p className="page-sub">
          Search, manage roles, and anonymize user personal accounts in compliance with GDPR guidelines.
        </p>
      </div>

      {/* Filters Row */}
      <div className="card card-pad" style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flex: 1, gap: 12, minWidth: 280 }}>
          <div style={{ position: "relative", flex: 1 }}>
            <input
              type="text"
              className="input"
              style={{ paddingLeft: 36 }}
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Icon name="search" size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-4)" }} />
          </div>

          <select className="input" style={{ width: 140 }} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">All Roles</option>
            <option value="BUYER">Buyer</option>
            <option value="SELLER">Seller</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>

        <button onClick={() => loadUsers(page)} className="btn btn-secondary" disabled={loading}>
          <Icon name="refresh" size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Users Table */}
      <div className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="table-container" style={{ overflowX: "auto" }}>
          <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line)" }}>
                <th style={{ textAlign: "left", padding: "12px 8px", color: "var(--ink-3)", fontSize: 12, fontWeight: 600 }}>User</th>
                <th style={{ textAlign: "left", padding: "12px 8px", color: "var(--ink-3)", fontSize: 12, fontWeight: 600 }}>Email</th>
                <th style={{ textAlign: "center", padding: "12px 8px", color: "var(--ink-3)", fontSize: 12, fontWeight: 600 }}>Roles</th>
                <th style={{ textAlign: "center", padding: "12px 8px", color: "var(--ink-3)", fontSize: 12, fontWeight: 600 }}>Verified</th>
                <th style={{ textAlign: "left", padding: "12px 8px", color: "var(--ink-3)", fontSize: 12, fontWeight: 600 }}>Joined</th>
                <th style={{ textAlign: "center", padding: "12px 8px", color: "var(--ink-3)", fontSize: 12, fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 24, color: "var(--ink-4)" }}>
                    Loading users list...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 24, color: "var(--ink-4)" }}>
                    No users found matching search criteria.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || "Anonymized User";
                  const isAnonymized = user.email.includes("anonymized.local");

                  return (
                    <tr key={user.id} style={{ borderBottom: "1px solid var(--line-soft)", height: 48, opacity: isAnonymized ? 0.6 : 1 }}>
                      <td style={{ padding: "8px" }}>
                        <div className="row gap-2">
                          <div className="sb-avatar" style={{ width: 28, height: 28, fontSize: 10 }}>
                            {fullName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </div>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink-1)" }}>{fullName}</div>
                        </div>
                      </td>
                      <td style={{ padding: "8px", fontSize: 13.5, color: "var(--ink-2)" }}>
                        {user.email}
                      </td>
                      <td style={{ padding: "8px", textAlign: "center" }}>
                        <div className="row gap-1" style={{ justifyContent: "center", flexWrap: "wrap" }}>
                          {user.roles.map((role) => {
                            let rColor = "var(--ink-3)";
                            let rBg = "var(--line-soft)";
                            if (role === "ADMIN") {
                              rColor = "var(--brand)";
                              rBg = "var(--brand-soft)";
                            } else if (role === "SELLER") {
                              rColor = "var(--success)";
                              rBg = "var(--success-soft)";
                            }
                            return (
                              <span
                                key={role}
                                style={{
                                  padding: "2px 6px",
                                  borderRadius: 4,
                                  fontSize: 10,
                                  fontWeight: 700,
                                  color: rColor,
                                  background: rBg,
                                }}
                              >
                                {role}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td style={{ padding: "8px", textAlign: "center" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            padding: "2px 8px",
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 600,
                            color: user.isVerified ? "var(--success)" : "var(--warning)",
                            background: user.isVerified ? "var(--success-soft)" : "var(--warning-soft)",
                          }}
                        >
                          {user.isVerified ? "Yes" : "No"}
                        </span>
                      </td>
                      <td style={{ padding: "8px", fontSize: 13, color: "var(--ink-3)" }}>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "8px", textAlign: "center" }}>
                        <div className="row gap-1" style={{ justifyContent: "center" }}>
                          {!isAnonymized && (
                            <>
                              <button
                                onClick={() => handleOpenEditRoles(user)}
                                className="btn btn-secondary btn-sm"
                                style={{ fontSize: 12 }}
                                title="Edit Roles"
                              >
                                <Icon name="edit" size={12} /> Roles
                              </button>
                              <button
                                onClick={() => handleDeleteGDPR(user)}
                                className="btn btn-sm"
                                style={{
                                  background: "var(--danger-soft)",
                                  color: "var(--danger)",
                                  borderColor: "transparent",
                                  fontSize: 12,
                                }}
                                title="GDPR Delete"
                              >
                                <Icon name="trash" size={12} /> Delete
                              </button>
                            </>
                          )}
                          {isAnonymized && (
                            <span style={{ fontSize: 11, color: "var(--ink-4)", fontStyle: "italic" }}>
                              Anonymized
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="row gap-2" style={{ justifyContent: "center", marginTop: 12 }}>
            <button
              onClick={() => loadUsers(page - 1)}
              disabled={page === 1 || loading}
              className="btn btn-secondary btn-sm"
            >
              <Icon name="arrow_left" size={12} /> Previous
            </button>
            <span style={{ fontSize: 13, color: "var(--ink-3)" }}>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => loadUsers(page + 1)}
              disabled={page === totalPages || loading}
              className="btn btn-secondary btn-sm"
            >
              Next <Icon name="arrow_right" size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Edit Roles Modal */}
      {editingUser && (
        <div className="modal-overlay" onClick={handleCloseEditRoles}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 360 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Edit user roles</h3>
              <button onClick={handleCloseEditRoles} className="btn btn-ghost btn-sm" style={{ padding: 4 }}>
                <Icon name="x" size={16} />
              </button>
            </div>

            <form onSubmit={handleRolesSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 8 }}>
                Select roles to assign for <strong>{editingUser.email}</strong>.
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {ROLE_OPTIONS.map((role) => {
                  const isChecked = selectedRoles.includes(role);
                  return (
                    <label
                      key={role}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: 10,
                        border: "1px solid var(--line)",
                        borderRadius: 8,
                        cursor: "pointer",
                        background: isChecked ? "var(--brand-soft)" : "var(--surface)",
                        borderColor: isChecked ? "var(--brand)" : "var(--line)",
                        fontSize: 13.5,
                        fontWeight: 500,
                        color: "var(--ink-1)",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleRole(role)}
                        style={{ width: 16, height: 16 }}
                      />
                      <span>{role}</span>
                    </label>
                  );
                })}
              </div>

              <div className="row gap-2" style={{ justifyContent: "flex-end", marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={handleCloseEditRoles} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Updating..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
