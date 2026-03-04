import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx", { id: "login" }),
  route("users", "routes/users.tsx", { id: "users" }),
  route("account", "routes/account.tsx", { id: "account" }),
  route("records", "routes/records.tsx", { id: "records" }),
  route("calibration", "routes/calibration.tsx", { id: "calibration" }),
  route("settings", "routes/settings.tsx", { id: "settings" }),
] satisfies RouteConfig;
