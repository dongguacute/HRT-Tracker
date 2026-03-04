import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("records", "routes/records.tsx", { id: "records" }),
  route("calibration", "routes/calibration.tsx", { id: "calibration" }),
  route("settings", "routes/settings.tsx", { id: "settings" }),
] satisfies RouteConfig;
