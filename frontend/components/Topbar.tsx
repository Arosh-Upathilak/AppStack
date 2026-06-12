"use client";

import React from "react";
import Icon from "./Icon";
import RoleSwitcher from "./RoleSwitcher";

interface TopbarProps {
  crumbs: string[];
}

export default function Topbar({ crumbs }: TopbarProps) {
  return (
    <header className="topbar">
      <div className="crumbs">
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <Icon name="chevron_right" size={12} className="sep" />}
            <span className={i === crumbs.length - 1 ? "now" : ""}>{c}</span>
          </React.Fragment>
        ))}
      </div>
      <div className="tb-search">
        <Icon name="search" size={14} className="tb-search-icon" />
        <input placeholder="Search subscriptions, products, invoices…" />
        <span className="tb-kbd">⌘ K</span>
      </div>
      <RoleSwitcher />
      {/*
        Notifications live in the side nav (live unread badge via
        useNotificationStore). Removed the redundant topbar bell here to avoid
        the duplicate notification entry point — see issue #13.
      */}
      <button className="tb-icon-btn" title="Inbox">
        <Icon name="inbox" size={16} />
      </button>
    </header>
  );
}
