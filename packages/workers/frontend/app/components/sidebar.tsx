import { NavLink } from "react-router";
import { 
  LayoutDashboard, 
  Calendar, 
  Scale, 
  Settings, 
  UserCircle 
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "../utils/cn";

export function Sidebar() {
  const { t, i18n } = useTranslation();
  
  const navItems = [
    { icon: LayoutDashboard, label: t('common.nav.dashboard'), to: "/" },
    { icon: Calendar, label: t('common.nav.records'), to: "/records" },
    { icon: Scale, label: t('common.nav.calibration'), to: "/calibration" },
    { icon: Settings, label: t('common.nav.settings'), to: "/settings" },
    { icon: UserCircle, label: t('common.nav.account'), to: "/account" },
  ];

  const currentTime = new Date();
  const timeString = currentTime.toLocaleTimeString(i18n.language, { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
  
  const dateString = i18n.language.startsWith('zh') 
    ? `${currentTime.getMonth() + 1}月${currentTime.getDate()}日`
    : i18n.language === 'ja'
    ? `${currentTime.getMonth() + 1}月${currentTime.getDate()}日`
    : currentTime.toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' });

  return (
    <aside className="w-64 h-screen flex flex-col bg-white dark:bg-background border-r border-gray-100 dark:border-white/[0.05] p-6">
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">HRT Tracker</h1>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group",
              isActive 
                ? "bg-[#E0F9F1] dark:bg-[#00A37B]/20 text-[#00A37B] dark:text-[#00c292] font-medium" 
                : "text-gray-500 hover:bg-gray-50 dark:hover:bg-white/[0.03] hover:text-gray-900 dark:hover:text-white"
            )}
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn(
                  "w-5 h-5 transition-colors",
                  isActive ? "text-[#00A37B] dark:text-[#00c292]" : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                )} />
                <span className="text-[15px]">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00A37B] dark:bg-[#00c292]" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto">
        <div className="bg-[#F2F2F2] dark:bg-white/[0.03] rounded-[32px] p-6 flex flex-col items-start">
          <span className="text-4xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
            {timeString}
          </span>
          <div className="w-full h-px bg-gray-200 dark:bg-white/[0.05] mb-3" />
          <span className="text-sm font-medium text-gray-500 tracking-wide">
            {dateString}
          </span>
        </div>
      </div>
    </aside>
  );
}
