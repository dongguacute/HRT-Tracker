import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "HRT Tracker" },
    { name: "description", content: "Welcome to HRT Tracker!" },
  ];
}

export default function Home() {
  return <Welcome />;
}
