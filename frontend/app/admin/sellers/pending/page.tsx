"use client";
import PendingSellersTable from "@/components/admin/PendingSellersTable";
import { useState } from "react";

export default function AdminPendingSellersPage() {
  const [pendingCount, setPendingCount] = useState(0);

  return (
    <div className="page screen-enter">
      <div className="page-head">
        <div>
          <h1 className="page-title">Pending sellers</h1>
          <p className="page-sub">
            Review and approve seller applications. Approved users gain access
            to the seller dashboard.
          </p>
        </div>
      </div>

      <PendingSellersTable onCountChange={setPendingCount}  />
    </div>
  );
}
