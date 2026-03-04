import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../app/auth";
import { isAdminUser } from "../app/redirectAfterAuth";

export default function AdminGuard({ children }) {
  const { user, booting } = useAuth();
  const loc = useLocation();

  if (booting) return null; // or loading UI

  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  if (!isAdminUser(user)) return <Navigate to="/" replace />;

  return children;
}
