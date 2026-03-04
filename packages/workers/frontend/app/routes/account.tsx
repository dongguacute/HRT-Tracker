import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, 
  LogOut, 
  Shield, 
  UserCircle, 
  Key, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2,
  ChevronDown,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "../utils/cn";

interface UserData {
  username: string;
  role: string;
}

export default function Account() {
  const { t } = useTranslation();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 修改密码相关状态
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [passwordError, setPasswordError] = useState("");

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

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError(t('common.account.password_mismatch'));
      return;
    }

    setIsChanging(true);
    setPasswordError("");
    
    try {
      const response = await fetch('/api/auth/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword })
      });

      const data = await response.json();
      if (response.ok) {
        setPasswordStatus('success');
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          setPasswordStatus('idle');
          setShowPasswordForm(false);
        }, 2000);
      } else {
        setPasswordStatus('error');
        setPasswordError(data.error === 'Invalid old password' ? t('common.account.invalid_old_password') : t('common.account.change_failed'));
      }
    } catch (e) {
      setPasswordStatus('error');
      setPasswordError(t('common.account.change_failed'));
    } finally {
      setIsChanging(false);
    }
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
          
          {user?.role === 'admin' ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                管理员账号密码由系统环境变量管理。如需修改，请前往用户管理中心管理其他用户。
              </p>
              <div className="pt-2">
                <button
                  onClick={() => navigate("/users")}
                  className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
                >
                  <Shield className="h-4 w-4" />
                  前往用户管理中心
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="w-full flex items-center justify-between group p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Lock className="h-4 w-4 text-indigo-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{t('common.account.change_password')}</span>
                </div>
                <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform", showPasswordForm && "rotate-180")} />
              </button>

              <AnimatePresence>
                {showPasswordForm && (
                  <motion.form
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    onSubmit={handlePasswordChange}
                    className="space-y-4 pt-2 overflow-hidden px-1"
                  >
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">{t('common.account.old_password')}</label>
                      <div className="relative">
                        <input
                          type={showOldPass ? "text" : "password"}
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          required
                          className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:text-white transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowOldPass(!showOldPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showOldPass ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">{t('common.account.new_password')}</label>
                      <div className="relative">
                        <input
                          type={showNewPass ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:text-white transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPass(!showNewPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showNewPass ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">{t('common.account.confirm_password')}</label>
                      <input
                        type={showNewPass ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:text-white transition-all"
                      />
                    </div>

                    {passwordError && (
                      <div className="text-red-500 text-[10px] font-bold flex items-center gap-1 ml-1">
                        <AlertCircle className="w-3 h-3" />
                        {passwordError}
                      </div>
                    )}

                    {passwordStatus === 'success' && (
                      <div className="text-emerald-500 text-[10px] font-bold flex items-center gap-1 ml-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {t('common.account.change_success')}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isChanging}
                      className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isChanging ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.confirm')}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
