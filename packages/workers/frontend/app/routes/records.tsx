import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, setHours, setMinutes } from "date-fns";
import { zhCN } from "date-fns/locale";
import { DayPicker } from "react-day-picker";
import { 
  Calendar as CalendarIcon, 
  ChevronDown, 
  Syringe, 
  Droplets, 
  Pill, 
  X, 
  Check, 
  Save,
  AlertTriangle,
  ExternalLink,
  Trash2,
  Bookmark,
  Plus,
  Activity,
  ChevronLeft, 
  ChevronRight,
  Hexagon,
  Loader,
  Orbit,
  Network,
  Info,
  Pencil
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "../utils/cn";
import { medicationStorage, type MedicationRecord } from "../utils/storage";
import { Ester, Route } from "@hrt-tracker/core";

export default function RecordsPage() {
  const { t, i18n } = useTranslation();
  
  const METHODS = [
    { id: "Injection", label: `${t('records.methods.Injection')} (Injection)`, icon: Syringe, color: "text-pink-500", route: Route.Injection },
    { id: "Beta-Patch", label: `${t('records.methods.Patch')} (Beta)`, icon: Bookmark, color: "text-orange-500", route: Route.PatchApply },
    { id: "Beta-Remove", label: `${t('records.methods.Remove')} (Beta)`, icon: X, color: "text-gray-400", route: Route.PatchRemove },
    { id: "Beta-Gel", label: `${t('records.methods.Gel')} (Beta)`, icon: Droplets, color: "text-blue-400", route: Route.Gel },
    { id: "Oral", label: `${t('records.methods.Oral')} (Oral)`, icon: Pill, color: "text-blue-500", route: Route.Oral },
    { id: "Sublingual", label: `${t('records.methods.Sublingual')} (Sublingual)`, icon: Pill, color: "text-emerald-500", route: Route.Sublingual },
  ];

  const TYPES = [
    { id: "EB", label: t('records.types.EB'), icon: Hexagon, ester: Ester.EB },
    { id: "EV", label: t('records.types.EV'), icon: Loader, ester: Ester.EV },
    { id: "EC", label: t('records.types.EC'), icon: Orbit, ester: Ester.EC },
    { id: "EN", label: t('records.types.EN'), icon: Network, ester: Ester.EN },
  ];

  const [records, setRecords] = useState<MedicationRecord[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState(METHODS[0]);
  const [selectedType, setSelectedType] = useState(TYPES[1]);
  const [dosage, setDosage] = useState("0.0");
  const [time, setTime] = useState(new Date());
  const [isMethodOpen, setIsMethodOpen] = useState(false);
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  useEffect(() => {
    const loadedRecords = medicationStorage.getRecords();
    setRecords(loadedRecords);
  }, []);

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [hours, minutes] = e.target.value.split(':').map(Number);
    const newDate = setHours(setMinutes(time, minutes), hours);
    setTime(newDate);
  };

  const handleSave = () => {
    const recordData = {
      time: time.toISOString(),
      method: selectedMethod.id,
      type: selectedType.id,
      dosage: parseFloat(dosage) || 0,
      unit: "mg",
    };

    if (editingId) {
      const updatedRecord = medicationStorage.updateRecord(editingId, recordData);
      if (updatedRecord) {
        setRecords(records.map(r => r.id === editingId ? updatedRecord : r));
      }
      setEditingId(null);
    } else {
      const newRecord = medicationStorage.saveRecord(recordData);
      setRecords([newRecord, ...records]);
    }
    setShowAddForm(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedMethod(METHODS[0]);
    setSelectedType(TYPES[1]);
    setDosage("0.0");
    setTime(new Date());
    setEditingId(null);
  };

  const handleEdit = (record: MedicationRecord) => {
    setEditingId(record.id);
    setSelectedMethod(METHODS.find(m => m.id === record.method) || METHODS[0]);
    setSelectedType(TYPES.find(t => t.id === record.type) || TYPES[0]);
    setDosage(record.dosage.toString());
    setTime(new Date(record.time));
    setShowAddForm(true);
  };

  const handleDelete = (id: string) => {
    medicationStorage.deleteRecord(id);
    setRecords(records.filter(r => r.id !== id));
  };

  const getDosageLevel = (dosageValue: number) => {
    if (dosageValue <= 1.5) return { label: t('home.dosage_levels.low'), color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" };
    if (dosageValue <= 3.0) return { label: t('home.dosage_levels.medium'), color: "bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" };
    if (dosageValue <= 6.0) return { label: t('home.dosage_levels.high'), color: "bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400" };
    return { label: t('home.dosage_levels.very_high'), color: "bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400" };
  };

  const currentDosageLevel = getDosageLevel(parseFloat(dosage) || 0);

  const handleMethodToggle = () => {
    setIsMethodOpen(!isMethodOpen);
    if (!isMethodOpen) setIsTypeOpen(false);
  };

  const handleTypeToggle = () => {
    setIsTypeOpen(!isTypeOpen);
    if (!isTypeOpen) setIsMethodOpen(false);
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 md:space-y-8">
      {/* Header / Trigger Button */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => {
          if (showAddForm || editingId) {
            setShowAddForm(false);
            resetForm();
          } else {
            setShowAddForm(true);
          }
        }}
        className="bg-white dark:bg-card rounded-[24px] md:rounded-[32px] p-4 md:p-6 shadow-sm border border-gray-100 dark:border-white/[0.05] flex items-center justify-between cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
      >
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-pink-50 dark:bg-pink-500/10 flex items-center justify-center">
            <Activity className="w-5 h-5 md:w-6 md:h-6 text-pink-400 dark:text-pink-300" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">{t('records.title')}</h2>
            <p className="text-xs md:text-sm text-gray-400 dark:text-gray-500">{records.length} {t('records.count')}</p>
          </div>
        </div>
        <div className={cn(
          "w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center transition-colors duration-300",
          (showAddForm || editingId) ? "bg-pink-50 dark:bg-pink-500/10" : "bg-[#E6F6F2] dark:bg-[#00A37B]/10"
        )}>
          {(showAddForm || editingId) ? (
            <X className="w-5 h-5 md:w-6 md:h-6 text-pink-400 dark:text-pink-300" />
          ) : (
            <Plus className="w-5 h-5 md:w-6 md:h-6 text-[#00A37B] dark:text-[#00c292]" />
          )}
        </div>
      </motion.div>

      {/* Add/Edit Record Card */}
      <AnimatePresence>
        {(showAddForm || editingId) && (
          <motion.div 
            key="form"
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="bg-[#F2F2F2] dark:bg-card rounded-[24px] md:rounded-[32px] p-6 md:p-8 shadow-sm relative overflow-hidden"
          >
            <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-6">
              {editingId ? t('records.edit_record') : t('records.add_record')}
            </h2>
            
            <div className="space-y-6">
              {/* Dosage Level Reference */}
              <div className="bg-[#E6F6F2] dark:bg-[#00A37B]/10 border border-[#00A37B]/10 dark:border-[#00A37B]/20 rounded-2xl p-4 flex gap-3">
                <Info className="w-5 h-5 text-[#00A37B] dark:text-[#00c292] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-bold text-gray-900 dark:text-white">{t('records.dosage_ref')}</h4>
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] md:text-xs font-bold", currentDosageLevel.color)}>
                      {currentDosageLevel.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('records.current_input')}：{dosage || "0"} mg/{t('common.day', '天')}
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-relaxed">
                    {t('records.ref_range')}
                  </p>
                </div>
              </div>
              {/* Time Picker */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('records.medication_time')}</label>
                <div className="relative">
                  <div 
                    onClick={() => setIsCalendarOpen(true)}
                    className="w-full bg-white dark:bg-white/[0.05] rounded-2xl p-4 flex items-center justify-between border border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-all cursor-pointer"
                  >
                    <span className="text-base md:text-lg font-medium text-gray-900 dark:text-white">
                      {format(time, i18n.language.startsWith('zh') || i18n.language === 'ja' ? "EEE d MMM HH:mm" : "EEE, MMM d, HH:mm", { locale: i18n.language === 'zh-CN' ? zhCN : undefined })}
                    </span>
                    <CalendarIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  </div>

                  <AnimatePresence>
                    {isCalendarOpen && (
                      <>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={() => setIsCalendarOpen(false)}
                          className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-100"
                        />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9, y: 20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: 20 }}
                          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-[#121212] rounded-[32px] md:rounded-[40px] p-6 md:p-8 shadow-2xl z-101 w-[90%] max-w-[400px] border dark:border-white/10"
                        >
                          <div className="flex flex-col gap-6">
                            <div className="flex flex-wrap items-baseline gap-3">
                              <span className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                                {format(time, i18n.language.startsWith('zh') || i18n.language === 'ja' ? "EEE d MMM" : "EEE, MMM d", { locale: i18n.language === 'zh-CN' ? zhCN : undefined })}
                              </span>
                              <input
                                type="time"
                                value={format(time, "HH:mm")}
                                onChange={handleTimeChange}
                                className="text-2xl md:text-3xl font-bold text-gray-400 dark:text-gray-500 bg-transparent border-none focus:outline-none focus:text-gray-900 dark:focus:text-white w-24"
                              />
                            </div>

                            <div className="calendar-container overflow-x-auto">
                              <style>{`
                                .rdp-root {
                                  --rdp-accent-color: #00A37B;
                                  --rdp-accent-background-color: #E6F6F2;
                                  margin: 0;
                                }
                                .rdp-day_button {
                                  border-radius: 9999px !important;
                                }
                                .rdp-selected .rdp-day_button {
                                  background-color: var(--rdp-accent-color) !important;
                                  color: white !important;
                                }
                                .dark .rdp-day_button:hover {
                                  background-color: rgba(255, 255, 255, 0.05) !important;
                                }
                              `}</style>
                              <DayPicker
                                mode="single"
                                selected={time}
                                onSelect={(date) => {
                                  if (date) {
                                    const newDate = setHours(setMinutes(date, time.getMinutes()), time.getHours());
                                    setTime(newDate);
                                  }
                                }}
                                locale={i18n.language === 'zh-CN' ? zhCN : undefined}
                                classNames={{
                                  month_caption: "flex justify-center py-2 mb-4 relative items-center text-lg font-bold text-gray-900 dark:text-white",
                                  nav: "flex items-center",
                                  button_previous: "absolute left-1 z-10 flex h-7 w-7 items-center justify-center bg-transparent p-0 opacity-50 hover:opacity-100 dark:text-white",
                                  button_next: "absolute right-1 z-10 flex h-7 w-7 items-center justify-center bg-transparent p-0 opacity-50 hover:opacity-100 dark:text-white",
                                  month_grid: "w-full border-collapse space-y-1",
                                  weekdays: "flex justify-between mb-2",
                                  weekday: "text-gray-400 dark:text-gray-500 rounded-md w-9 font-medium text-[0.8rem] uppercase text-center",
                                  week: "flex w-full justify-between mt-2",
                                  day: "h-9 w-9 md:h-10 md:w-10 text-center text-sm p-0 relative flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors dark:text-gray-300",
                                  selected: "bg-[#00A37B] text-white hover:bg-[#008F6B] focus:bg-[#00A37B]",
                                  today: "text-[#00A37B] dark:text-[#00c292] font-bold",
                                  outside: "text-gray-300 dark:text-gray-600 opacity-50",
                                  disabled: "text-gray-300 dark:text-gray-600 opacity-50",
                                  hidden: "invisible",
                                }}
                                components={{
                                  Chevron: ({ orientation }) => {
                                    if (orientation === 'left') return <ChevronLeft className="h-4 w-4" />;
                                    return <ChevronRight className="h-4 w-4" />;
                                  }
                                }}
                              />
                            </div>

                            <div className="flex gap-4 mt-2">
                              <button
                                onClick={() => setIsCalendarOpen(false)}
                                className="flex-1 py-3 md:py-4 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 rounded-[20px] md:rounded-[24px] font-bold hover:bg-gray-200 dark:hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                              >
                                <X className="w-5 h-5" />
                                {t('common.cancel')}
                              </button>
                              <button
                                onClick={() => setIsCalendarOpen(false)}
                                className="flex-1 py-3 md:py-4 bg-[#00A37B] dark:bg-[#00c292] text-white dark:text-black rounded-[20px] md:rounded-[24px] font-bold hover:bg-[#008F6B] dark:hover:bg-[#00e0a8] transition-colors flex items-center justify-center"
                              >
                                {t('common.confirm')}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Method Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('records.medication_method')}</label>
                <div className="relative">
                  <button 
                    onClick={handleMethodToggle}
                    className="w-full bg-white dark:bg-white/[0.05] rounded-2xl p-4 flex items-center gap-3 border border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-all text-left"
                  >
                    <selectedMethod.icon className={cn("w-5 h-5", selectedMethod.color)} />
                    <span className="text-base md:text-lg font-medium text-gray-900 dark:text-white flex-1">{selectedMethod.label}</span>
                    <ChevronDown className={cn("w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform", isMethodOpen && "rotate-180")} />
                  </button>
                  
                  <AnimatePresence>
                    {isMethodOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#121212] rounded-2xl shadow-xl border border-gray-100 dark:border-white/10 z-10 overflow-hidden"
                      >
                        {METHODS.map((m) => (
                          <button
                            key={m.id}
                            onClick={() => {
                              setSelectedMethod(m);
                              setIsMethodOpen(false);
                            }}
                            className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left"
                          >
                            <m.icon className={cn("w-5 h-5", m.color)} />
                            <span className="text-base md:text-lg font-medium text-gray-900 dark:text-white flex-1">{m.label}</span>
                            {selectedMethod.id === m.id && <Check className="w-5 h-5 text-[#00A37B] dark:text-[#00c292]" />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Drug Type Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('records.medication_type')}</label>
                <div className="relative">
                  <button 
                    onClick={handleTypeToggle}
                    className="w-full bg-white dark:bg-white/[0.05] rounded-2xl p-4 flex items-center gap-3 border border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-all text-left"
                  >
                    <selectedType.icon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <span className="text-base md:text-lg font-medium text-gray-900 dark:text-white flex-1">{selectedType.label}</span>
                    <ChevronDown className={cn("w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform", isTypeOpen && "rotate-180")} />
                  </button>

                  <AnimatePresence>
                    {isTypeOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#121212] rounded-2xl shadow-xl border border-gray-100 dark:border-white/10 z-10 overflow-hidden"
                      >
                        {TYPES.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => {
                              setSelectedType(t);
                              setIsTypeOpen(false);
                            }}
                            className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left"
                          >
                            <t.icon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                            <span className="text-base md:text-lg font-medium text-gray-900 dark:text-white flex-1">{t.label}</span>
                            {selectedType.id === t.id && <Check className="w-5 h-5 text-[#00A37B] dark:text-[#00c292]" />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Dosage Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('records.dosage_amount')}</label>
                <div className="relative">
                  <input 
                    type="number"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    className="w-full bg-gray-200/50 dark:bg-white/[0.05] rounded-2xl p-4 md:p-6 text-xl md:text-2xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00A37B]/20 transition-all"
                    placeholder="0.0"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end pt-4">
                <button 
                  onClick={handleSave}
                  className="w-full md:w-auto px-8 py-4 bg-[#00A37B] dark:bg-[#00c292] text-white dark:text-black rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#008F6B] dark:hover:bg-[#00e0a8] transition-all shadow-lg shadow-[#00A37B]/20 dark:shadow-[#00c292]/10"
                >
                  <Save className="w-5 h-5" />
                  {t('records.save')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Records List */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#00A37B] dark:bg-[#00c292]" />
          {t('records.history')}
        </h3>
        
        <div className="space-y-3">
          {records.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-white/[0.02] rounded-[24px] md:rounded-[32px] border-2 border-dashed border-gray-200 dark:border-white/10">
              <p className="text-gray-400 dark:text-gray-500">{t('records.no_records')}</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {records.map((record) => {
                const method = METHODS.find(m => m.id === record.method) || METHODS[0];
                const type = TYPES.find(t => t.id === record.type) || TYPES[0];
                const date = new Date(record.time);
                
                return (
                  <motion.div 
                    key={record.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, x: -20 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30, mass: 1 }}
                    className="bg-white dark:bg-card border border-gray-100 dark:border-white/[0.05] rounded-[24px] md:rounded-3xl p-4 md:p-6 flex items-center gap-3 md:gap-4 hover:shadow-md transition-shadow group"
                  >
                    <div className={cn("w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center bg-gray-50 dark:bg-white/5 shrink-0", method.color.replace('text-', 'bg-').replace('500', '50').replace('400', '400/10'))}>
                      <method.icon className={cn("w-5 h-5 md:w-6 md:h-6", method.color)} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <type.icon className="w-3 h-3 md:w-4 md:h-4 text-gray-400 dark:text-gray-500 shrink-0" />
                          <h4 className="font-bold text-sm md:text-base text-gray-900 dark:text-white truncate">{type.label.split(' ')[0]} ({record.type})</h4>
                        </div>
                        <span className="text-xs text-gray-400 dark:text-gray-500 font-medium shrink-0">
                          {(() => {
                            const now = new Date();
                            const isSameYear = date.getFullYear() === now.getFullYear();
                            const isToday = isSameYear && 
                                            date.getMonth() === now.getMonth() && 
                                            date.getDate() === now.getDate();
                            
                            if (isToday) {
                              return format(date, "HH:mm");
                            } else if (isSameYear) {
                              return format(date, i18n.language.startsWith('zh') || i18n.language === 'ja' ? "M月d日 HH:mm" : "MMM d, HH:mm");
                            } else {
                              return format(date, i18n.language.startsWith('zh') || i18n.language === 'ja' ? "yyyy年M月d日 HH:mm" : "MMM d, yyyy, HH:mm");
                            }
                          })()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 truncate">{method.label.split(' ')[0]} • {record.dosage} {record.unit}</p>
                        <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-all">
                          <button 
                            onClick={() => handleEdit(record)}
                            className="p-1.5 md:p-2 text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-all"
                          >
                            <Pencil className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(record.id)}
                            className="p-1.5 md:p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}