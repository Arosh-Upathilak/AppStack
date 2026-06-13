"use client";
import PendingSellersTable from "@/components/admin/PendingSellersTable";

export default function AdminPendingSellersPage() {
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

      <PendingSellersTable />
    </div>
  );
}
