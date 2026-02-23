import { NavLink } from "react-router";
import { 
  LayoutDashboard, 
  Calendar, 
  Scale, 
  Settings, 
  UserCircle 
} from "lucide-react";
import { cn } from "../utils/cn";

const navItems = [
  { icon: LayoutDashboard, label: "概览", to: "/" },
  { icon: Calendar, label: "记录", to: "/records" },
  { icon: Scale, label: "校准", to: "/calibration" },
  { icon: Settings, label: "设置", to: "/settings" },
  { icon: UserCircle, label: "账户", to: "/account" },
];

export function Sidebar() {
  const currentTime = new Date();
  const timeString = currentTime.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
  const dateString = `${currentTime.getMonth() + 1}月${currentTime.getDate()}日`;

  return (
    <aside className="w-64 h-screen flex flex-col bg-white border-r border-gray-100 p-6">
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">HRT Tracker</h1>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group",
              isActive 
                ? "bg-[#E0F9F1] text-[#00A37B] font-medium" 
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn(
                  "w-5 h-5 transition-colors",
                  isActive ? "text-[#00A37B]" : "text-gray-400 group-hover:text-gray-600"
                )} />
                <span className="text-[15px]">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00A37B]" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto">
        <div className="bg-[#F2F2F2] rounded-[32px] p-6 flex flex-col items-start">
          <span className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">
            {timeString}
          </span>
          <div className="w-full h-px bg-gray-200 mb-3" />
          <span className="text-sm font-medium text-gray-500 tracking-wide">
            {dateString}
          </span>
        </div>
      </div>
    </aside>
  );
}
