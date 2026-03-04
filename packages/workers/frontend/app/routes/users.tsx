import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { UserPlus, Users, Trash2, ShieldCheck, User as UserIcon, Key, X, Check } from "lucide-react";
import { useTranslation } from "react-i18next";

interface User {
  username: string;
  role: string;
}

export default function UserManagement() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // 修改密码相关的状态
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editPassword, setEditPassword] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [meRes, usersRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/admin/users")
      ]);

      if (!meRes.ok) {
        navigate("/login");
        return;
      }

      const meData = await meRes.json();
      setCurrentUser(meData.user);

      if (meData.user.role !== 'admin') {
        setError(t('admin.users.admin_only'));
        setLoading(false);
        return;
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users);
      }
    } catch (err) {
      setError(t('admin.users.fetch_failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newUsername, password: newPassword }),
      });

      if (res.ok) {
        setNewUsername("");
        setNewPassword("");
        setSuccess(t('admin.users.create_success'));
        fetchData();
      } else {
        const data = await res.json();
        setError(data.error || t('admin.users.create_failed', '创建用户失败'));
      }
    } catch (err) {
      setError(t('admin.users.network_error'));
    }
  };

  const handleDeleteUser = async (username: string) => {
    if (!confirm(t('admin.users.delete_confirm', { username }))) return;
    
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/admin/users/${username}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setSuccess(t('admin.users.delete_success'));
        fetchData();
      } else {
        const data = await res.json();
        setError(data.error || t('admin.users.delete_failed', '删除失败'));
      }
    } catch (err) {
      setError(t('admin.users.network_error'));
    }
  };

  const handleUpdatePassword = async (username: string) => {
    if (!editPassword) return;
    
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/admin/users/${username}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: editPassword }),
      });

      if (res.ok) {
        setSuccess(t('admin.users.password_updated', { username }));
        setEditingUser(null);
        setEditPassword("");
        fetchData();
      } else {
        const data = await res.json();
        setError(data.error || t('admin.users.update_password_failed', '更新密码失败'));
      }
    } catch (err) {
      setError(t('admin.users.network_error'));
    }
  };

  if (loading) return <div className="p-8 text-center">{t('common.loading')}</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            {t('admin.users.title')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">{t('admin.users.manage_desc')}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl border border-red-100 dark:border-red-900/30">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-4 rounded-xl border border-green-100 dark:border-green-900/30">
          {success}
        </div>
      )}

      {currentUser?.role === 'admin' && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {t('admin.users.create_user')}
          </h2>
          <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder={t('admin.users.username')}
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder={t('admin.users.password')}
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl transition-colors"
            >
              {t('admin.users.add_user')}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
            <tr>
              <th className="px-6 py-4 font-semibold">{t('admin.users.username')}</th>
              <th className="px-6 py-4 font-semibold">{t('admin.users.role')}</th>
              <th className="px-6 py-4 font-semibold">{t('admin.users.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {users.map((user) => (
              <tr key={user.username} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                <td className="px-6 py-4 flex items-center gap-3">
                  <div className="h-8 w-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <UserIcon className="h-4 w-4 text-gray-500" />
                  </div>
                  {user.username}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    user.role === 'admin' 
                      ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' 
                      : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    {user.role === 'admin' ? t('common.account.role_admin') : t('common.account.role_user')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {user.role !== 'admin' && (
                    <div className="flex items-center gap-2">
                      {editingUser === user.username ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="password"
                            placeholder={t('admin.users.new_password')}
                            className="px-2 py-1 text-sm rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 w-32"
                            value={editPassword}
                            onChange={(e) => setEditPassword(e.target.value)}
                            autoFocus
                          />
                          <button 
                            onClick={() => handleUpdatePassword(user.username)}
                            className="text-green-500 hover:text-green-700 p-1"
                            title={t('common.confirm')}
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => { setEditingUser(null); setEditPassword(""); }}
                            className="text-gray-400 hover:text-gray-600 p-1"
                            title={t('common.cancel')}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <button 
                            onClick={() => setEditingUser(user.username)}
                            className="text-blue-500 hover:text-blue-700 p-2 transition-colors"
                            title={t('common.account.change_password')}
                          >
                            <Key className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(user.username)}
                            className="text-red-500 hover:text-red-700 p-2 transition-colors"
                            title={t('common.clear_all_data')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                  {t('admin.users.no_users')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
