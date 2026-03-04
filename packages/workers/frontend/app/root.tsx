import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { useEffect, Suspense, lazy, useState } from "react";
import "./i18n/config";

// @ts-ignore
import { useRegisterSW } from 'virtual:pwa-register/react';

import type { Route } from "./+types/root";
import "./app.css";
import { settingsStorage } from "./utils/storage";

const Sidebar = lazy(() => import("./components/sidebar").then(m => ({ default: m.Sidebar })));

export const links: Route.LinksFunction = () => [];

import { useTranslation } from "react-i18next";

export function Layout({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();
  const [mounted, setMounted] = useState(false);
  
  useRegisterSW({
    onRegistered(r: any) {
      console.log('SW registered');
    },
    onRegisterError(error: any) {
      console.log('SW registration error: ' + error);
    },
  });
  
  useEffect(() => {
    setMounted(true);
    // 初始加载时尝试从云端同步数据
    const settings = settingsStorage.getSettings();
    if (settings.isCloudSyncEnabled) {
      settingsStorage.fetchFromCloud().then(success => {
        if (success) {
          // 如果数据有更新，触发主题更新（或其他可能需要的 UI 更新）
          updateTheme();
        }
      });
    }

    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateTheme = () => {
      const settings = settingsStorage.getSettings();
      const root = window.document.documentElement;
      const theme = settings.theme === 'system' 
        ? (mediaQuery.matches ? 'dark' : 'light')
        : settings.theme;
      
      if (theme === 'dark') {
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
      }
    };

    const handleChange = () => {
      const settings = settingsStorage.getSettings();
      if (settings.theme === 'system') {
        updateTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);

    // 监听 localStorage 变化（处理其他页面/标签页的设置更新）
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'hrt_settings') {
        updateTheme();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // 监听自定义事件（处理同页面内的设置更新）
    const handleCustomThemeChange = () => {
      updateTheme();
    };
    window.addEventListener('theme-change', handleCustomThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('theme-change', handleCustomThemeChange);
    };
  }, []);

  return (
    <html lang={i18n.language} suppressHydrationWarning>
      <head>
        <title>HRT-Tracker</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="icon" type="image/png" href="/logo.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <meta name="theme-color" content="#ffffff" />
        <Meta />
        <Links />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var settings = JSON.parse(localStorage.getItem('hrt_settings') || '{}');
                  var theme = settings.theme;
                  if (theme === 'system' || !theme) {
                    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="flex flex-col md:flex-row h-screen overflow-hidden bg-gray-50 dark:bg-background" suppressHydrationWarning>
        <Suspense fallback={<div className="hidden md:block w-64 h-screen bg-white dark:bg-background border-r border-gray-100 dark:border-white/[0.05]" />}>
          {mounted ? <Sidebar /> : <div className="hidden md:block w-64 h-screen bg-white dark:bg-background border-r border-gray-100 dark:border-white/[0.05]" />}
        </Suspense>
        <main className="flex-1 overflow-y-auto bg-white dark:bg-background shadow-sm border border-gray-100 dark:border-white/5 pb-28 md:pb-0">
          {mounted ? children : null}
        </main>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
