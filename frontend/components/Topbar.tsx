"use client";

import React from "react";
import Icon from "./Icon";
import RoleSwitcher from "./RoleSwitcher";
import TopbarSearch from "./TopbarSearch";

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
      <TopbarSearch />
      <RoleSwitcher />
      {/*
        Notifications live in the side nav (live unread badge via
        useNotificationStore). No topbar bell here — a single notification
        entry point avoids a duplicate, dead control in the header.
      */}
    </header>
  );
}
