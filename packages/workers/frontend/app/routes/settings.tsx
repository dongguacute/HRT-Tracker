import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Moon, 
  Sun, 
  Monitor, 
  Weight, 
  Download, 
  Upload, 
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Trash2,
  ExternalLink,
  Github,
  Heart,
  Languages,
  ChevronDown,
  Check
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "../utils/cn";
import { settingsStorage, type Settings } from "../utils/storage";

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const [settings, setSettings] = useState<Settings>(settingsStorage.getSettings());
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleThemeChange = (theme: Settings['theme']) => {
    const updated = settingsStorage.saveSettings({ theme });
    setSettings(updated);
  };

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const weight = parseFloat(e.target.value) || 0;
    const updated = settingsStorage.saveSettings({ weight });
    setSettings(updated);
  };

  const handleExport = () => {
    const data = settingsStorage.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hrt-tracker-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (settingsStorage.importData(content)) {
        setImportStatus('success');
        setSettings(settingsStorage.getSettings());
        setTimeout(() => setImportStatus('idle'), 3000);
      } else {
        setImportStatus('error');
        setTimeout(() => setImportStatus('idle'), 3000);
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = () => {
    settingsStorage.clearAllData();
  };

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const [isLangOpen, setIsLangOpen] = useState(false);

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">{t('common.settings')}</h1>
      </div>

      {/* 语言设置 */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">{t('common.language')}</h2>
        <div className="relative">
          <button
            onClick={() => setIsLangOpen(!isLangOpen)}
            className="w-full bg-white dark:bg-white/5 rounded-[24px] p-4 flex items-center justify-between border-2 border-gray-100 dark:border-white/10 hover:border-gray-200 dark:hover:border-white/20 transition-all"
          >
            <div className="flex items-center gap-3">
              <Languages className="w-5 h-5 text-gray-400" />
              <span className="font-bold text-gray-900 dark:text-white">
                {[
                  { id: 'zh-CN', label: '简体中文' },
                  { id: 'zh-Hant', label: '繁體中文' },
                  { id: 'en', label: 'English' },
                  { id: 'ja', label: '日本語' },
                ].find(l => l.id === i18n.language || (l.id === 'zh-CN' && i18n.language.startsWith('zh') && !['zh-TW', 'zh-HK', 'zh-Hant'].includes(i18n.language)))?.label || '简体中文'}
              </span>
            </div>
            <ChevronDown className={cn("w-5 h-5 text-gray-400 transition-transform", isLangOpen && "rotate-180")} />
          </button>

          <AnimatePresence>
            {isLangOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#121212] rounded-[24px] shadow-xl border border-gray-100 dark:border-white/10 z-50 overflow-hidden"
              >
                {[
                  { id: 'zh-CN', label: '简体中文' },
                  { id: 'zh-Hant', label: '繁體中文' },
                  { id: 'en', label: 'English' },
                  { id: 'ja', label: '日本語' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      handleLanguageChange(item.id);
                      setIsLangOpen(false);
                    }}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left"
                  >
                    <span className={cn(
                      "font-bold",
                      (i18n.language === item.id || (item.id === 'zh-CN' && i18n.language.startsWith('zh') && !['zh-TW', 'zh-HK', 'zh-Hant'].includes(i18n.language)))
                        ? "text-[#00A37B]"
                        : "text-gray-700 dark:text-gray-300"
                    )}>
                      {item.label}
                    </span>
                    {(i18n.language === item.id || (item.id === 'zh-CN' && i18n.language.startsWith('zh') && !['zh-TW', 'zh-HK', 'zh-Hant'].includes(i18n.language))) && (
                      <Check className="w-5 h-5 text-[#00A37B]" />
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* 主题设置 */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">{t('common.appearance')}</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { id: 'light', label: t('common.light'), icon: Sun },
            { id: 'dark', label: t('common.dark'), icon: Moon },
            { id: 'system', label: t('common.system'), icon: Monitor },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleThemeChange(item.id as Settings['theme'])}
              className={cn(
                "flex flex-col items-center gap-3 p-4 rounded-[24px] border-2 transition-all",
                settings.theme === item.id
                  ? "border-[#00A37B] bg-[#E0F9F1] dark:bg-[#00A37B]/20 text-[#00A37B] dark:text-[#00c292]"
                  : "border-gray-100 dark:border-white/10 bg-white dark:bg-white/5 text-gray-500 hover:border-gray-200 dark:hover:border-white/20 dark:text-gray-400"
              )}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-sm font-bold">{item.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 体重设置 */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">{t('common.body_params.title')}</h2>
        <div className="bg-white dark:bg-card rounded-[32px] p-6 border border-gray-100 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
              <Weight className="w-6 h-6 text-blue-500 dark:text-blue-400" />
            </div>
            <div>
              <div className="font-bold text-gray-900 dark:text-white">{t('common.body_params.weight')}</div>
              <div className="text-xs text-gray-400 dark:text-gray-500">{t('common.body_params.weight_desc')}</div>
            </div>
          </div>
          <input
            type="number"
            value={settings.weight}
            onChange={handleWeightChange}
            className="w-24 px-4 py-3 rounded-2xl bg-gray-50 dark:bg-white/5 border-none text-right font-bold text-lg focus:ring-2 focus:ring-[#00A37B] dark:text-white"
          />
        </div>
      </section>

      {/* 数据管理 */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">{t('common.data_management')}</h2>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleExport}
            className="flex items-center justify-center gap-3 p-6 rounded-[32px] bg-white dark:bg-card border border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
          >
            <Download className="w-6 h-6 text-gray-400 dark:text-gray-500 group-hover:text-[#00A37B] dark:group-hover:text-[#00c292]" />
            <span className="font-bold text-gray-700 dark:text-gray-200">{t('common.export_json')}</span>
          </button>
          
          <label className="flex items-center justify-center gap-3 p-6 rounded-[32px] bg-white dark:bg-card border border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group cursor-pointer">
            <Upload className="w-6 h-6 text-gray-400 dark:text-gray-500 group-hover:text-[#00A37B] dark:group-hover:text-[#00c292]" />
            <span className="font-bold text-gray-700 dark:text-gray-200">{t('common.import_data')}</span>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>
        
        {importStatus === 'success' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 p-4 rounded-2xl font-medium"
          >
            <CheckCircle2 className="w-5 h-5" />
            {t('common.success')}
          </motion.div>
        )}
        {importStatus === 'error' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-red-500 bg-red-50 dark:bg-red-500/10 p-4 rounded-2xl font-medium"
          >
            <AlertCircle className="w-5 h-5" />
            {t('common.error')}
          </motion.div>
        )}

        <div className="pt-2">
          {!showClearConfirm ? (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="w-full flex items-center justify-center gap-3 p-6 rounded-[32px] bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/10 transition-colors group"
            >
              <Trash2 className="w-6 h-6 text-red-400 dark:text-red-500 group-hover:text-red-600 dark:group-hover:text-red-400" />
              <span className="font-bold text-red-600 dark:text-red-400">{t('common.clear_all_data')}</span>
            </button>
          ) : (
            <div className="space-y-4">
              <div className="bg-red-50 dark:bg-red-500/10 p-6 rounded-[32px] border-2 border-red-200 dark:border-red-500/20">
                <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-2">
                  <AlertCircle className="w-6 h-6" />
                  <span className="font-black text-lg">{t('common.confirm_clear')}</span>
                </div>
                <p className="text-red-700/70 dark:text-red-400/70 text-sm font-medium mb-6">
                  {t('common.disclaimer_clear')}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="py-4 px-6 rounded-2xl bg-white dark:bg-white/5 text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={handleClearData}
                    className="py-4 px-6 rounded-2xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/25"
                  >
                    {t('common.confirm')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 关于项目 */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">{t('common.about_project')}</h2>
        <div className="bg-white dark:bg-card rounded-[32px] p-6 border border-gray-100 dark:border-white/5 space-y-4">
          <a 
            href="https://mahiro.uk/articles/estrogen-model-summary" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                <ExternalLink className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />
              </div>
              <div>
                <div className="font-bold text-gray-900 dark:text-white group-hover:text-[#00A37B] transition-colors">{t('common.model_explanation')}</div>
                <div className="text-xs text-gray-400 dark:text-gray-500">{t('common.model_explanation_desc')}</div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-[#00A37B] transition-colors" />
          </a>

          <div className="h-px bg-gray-50 dark:bg-white/5 mx-2" />

          <a 
            href="https://github.com/dongguacute/HRT-Tracker" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center">
                <Github className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              </div>
              <div>
                <div className="font-bold text-gray-900 dark:text-white group-hover:text-[#00A37B] transition-colors">{t('common.github_repo')}</div>
                <div className="text-xs text-gray-400 dark:text-gray-500">{t('common.github_repo_desc')}</div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-[#00A37B] transition-colors" />
          </a>

          <div className="h-px bg-gray-50 dark:bg-white/5 mx-2" />

          <a 
            href="https://github.com/SmirnovaOyama" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-pink-50 dark:bg-pink-500/10 flex items-center justify-center">
                <Heart className="w-6 h-6 text-pink-500 dark:text-pink-400" />
              </div>
              <div>
                <div className="font-bold text-gray-900 dark:text-white group-hover:text-[#00A37B] transition-colors">{t('common.original_author')}</div>
                <div className="text-xs text-gray-400 dark:text-gray-500">{t('common.original_author_desc')}</div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-[#00A37B] transition-colors" />
          </a>
        </div>
      </section>

      {/* 免责声明 */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">{t('common.legal_info')}</h2>
        <div className="bg-orange-50 dark:bg-orange-500/10 rounded-[32px] p-8 border border-orange-100 dark:border-orange-500/20 space-y-4">
          <div className="flex items-center gap-3 text-orange-600 dark:text-orange-400">
            <ShieldAlert className="w-6 h-6" />
            <h3 className="font-black text-lg">{t('common.disclaimer')}</h3>
          </div>
          <div className="space-y-3 text-sm text-orange-800/80 dark:text-orange-300/80 leading-relaxed font-medium">
            <p>{t('common.disclaimer_1')}</p>
            <p>{t('common.disclaimer_2')}</p>
            <p>{t('common.disclaimer_3')}</p>
            <p>{t('common.disclaimer_4')}</p>
          </div>
        </div>
      </section>

      <div className="text-center text-gray-300 dark:text-gray-600 text-xs font-medium pb-8">
        HRT Tracker v1.0.0 • Made with Love
      </div>
    </div>
  );
}
