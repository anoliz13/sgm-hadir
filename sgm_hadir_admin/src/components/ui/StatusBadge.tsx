/**
 * StatusBadge Component - Color-coded status indicator
 */

import React from "react";
import { STATUS_LABELS, STATUS_COLORS } from "../../lib/types";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

export default function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const label = STATUS_LABELS[status] || status;
  const color = STATUS_COLORS[status] || "gray";

  return (
    <span
      className={`badge ${color}`}
      style={
        size === "sm" ? { fontSize: "0.6875rem", padding: "1px 8px" } : {}
      }
    >
      {label}
    </span>
  );
}
