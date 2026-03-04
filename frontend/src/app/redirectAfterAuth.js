export function isAdminUser(user) {
  // Support different backend shapes
  if (!user) return false;

  // common patterns:
  if (user.role && String(user.role).toLowerCase() === "admin") return true;
  if (user.type && String(user.type).toLowerCase() === "admin") return true;
  if (user.is_admin === true) return true;
  if (user.isAdmin === true) return true;

  // optional: array roles
  if (Array.isArray(user.roles) && user.roles.some((r) => String(r).toLowerCase() === "admin")) return true;

  return false;
}

export function redirectAfterAuth(navigate, user) {
  navigate(isAdminUser(user) ? "/admin" : "/", { replace: true });
}
