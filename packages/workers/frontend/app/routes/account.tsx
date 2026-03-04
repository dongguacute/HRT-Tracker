import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { User, LogOut, Shield, UserCircle, Key } from "lucide-react";

interface UserData {
  username: string;
  role: string;
}

export default function Account() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Not logged in");
      })
      .then((data) => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => {
        navigate("/login");
      });
  }, [navigate]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    navigate("/login");
  };

  if (loading) return <div className="p-8 text-center">加载中...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <UserCircle className="h-6 w-6 text-blue-600" />
            账号信息
          </h1>
          <p className="text-gray-500 dark:text-gray-400">管理您的个人账号设置</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          退出登录
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <User className="h-5 w-5 text-gray-400" />
            基本信息
          </h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 uppercase font-bold tracking-wider">用户名</label>
              <p className="text-lg font-medium text-gray-900 dark:text-white">{user?.username}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase font-bold tracking-wider">账号角色</label>
              <div className="mt-1">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  user?.role === 'admin' 
                    ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' 
                    : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                }`}>
                  {user?.role === 'admin' ? '管理员' : '普通用户'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Key className="h-5 w-5 text-gray-400" />
            安全设置
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            您当前使用的是简易账号系统。如需修改密码或增强安全性，请联系系统管理员。
          </p>
          {user?.role === 'admin' && (
            <div className="pt-2">
              <button
                onClick={() => navigate("/users")}
                className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
              >
                <Shield className="h-4 w-4" />
                前往用户管理中心
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
