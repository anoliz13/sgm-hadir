/**
 * StatCard Component - Displays a key metric with icon and optional change indicator
 */

import React from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: "blue" | "green" | "yellow" | "red" | "purple";
  change?: string;
  changeType?: "positive" | "negative";
}

export default function StatCard({
  label,
  value,
  icon,
  color,
  change,
  changeType,
}: StatCardProps) {
  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-card-header">
        <span className="stat-card-label">{label}</span>
        <div className={`stat-card-icon ${color}`}>{icon}</div>
      </div>
      <div className="stat-card-value">{value}</div>
      {change && (
        <div className={`stat-card-change ${changeType || ""}`}>{change}</div>
      )}
    </div>
  );
}
