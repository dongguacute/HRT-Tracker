import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, setHours, setMinutes } from "date-fns";
import { zhCN } from "date-fns/locale";
import { DayPicker } from "react-day-picker";
import { 
  Calendar as CalendarIcon, 
  ChevronDown, 
  X, 
  Check, 
  Save,
  Trash2,
  Plus,
  Activity,
  ChevronLeft, 
  ChevronRight,
  Pencil,
  Beaker,
  Info
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "../utils/cn";
import { labStorage, type LabRecord } from "../utils/storage";

const UNITS = [
  { id: "pg/ml", label: "pg/mL" },
  { id: "pmol/l", label: "pmol/L" },
];

export default function CalibrationPage() {
  const { t, i18n } = useTranslation();
  const [records, setRecords] = useState<LabRecord[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const [selectedUnit, setSelectedUnit] = useState(UNITS[0]);
  const [time, setTime] = useState(new Date());
  const [isUnitOpen, setIsUnitOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  useEffect(() => {
    const loadedRecords = labStorage.getRecords();
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
      value: parseFloat(value) || 0,
      unit: selectedUnit.id as 'pg/ml' | 'pmol/l',
    };

    if (editingId) {
      const updatedRecord = labStorage.updateRecord(editingId, recordData);
      if (updatedRecord) {
        setRecords(records.map(r => r.id === editingId ? updatedRecord : r));
      }
      setEditingId(null);
    } else {
      const newRecord = labStorage.saveRecord(recordData);
      setRecords([newRecord, ...records].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()));
    }
    setShowAddForm(false);
    resetForm();
  };

  const resetForm = () => {
    setValue("");
    setSelectedUnit(UNITS[0]);
    setTime(new Date());
    setEditingId(null);
  };

  const handleEdit = (record: LabRecord) => {
    setEditingId(record.id);
    setValue(record.value.toString());
    setSelectedUnit(UNITS.find(u => u.id === record.unit) || UNITS[0]);
    setTime(new Date(record.time));
    setShowAddForm(true);
  };

  const handleDelete = (id: string) => {
    labStorage.deleteRecord(id);
    setRecords(records.filter(r => r.id !== id));
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
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
        className="bg-white dark:bg-card rounded-[32px] p-6 shadow-sm border border-gray-100 dark:border-white/[0.05] flex items-center justify-between cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
            <Beaker className="w-6 h-6 text-blue-400 dark:text-blue-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('calibration.title')}</h2>
            <p className="text-sm text-gray-400 dark:text-gray-500">{records.length} {t('records.count')}</p>
          </div>
        </div>
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors duration-300",
          (showAddForm || editingId) ? "bg-blue-50 dark:bg-blue-500/10" : "bg-[#E6F0F6] dark:bg-blue-500/10"
        )}>
          {(showAddForm || editingId) ? (
            <X className="w-6 h-6 text-blue-400 dark:text-blue-300" />
          ) : (
            <Plus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
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
            className="bg-[#F2F7FA] dark:bg-card rounded-[32px] p-8 shadow-sm relative overflow-hidden"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              {editingId ? t('calibration.edit_record') : t('calibration.add_record')}
            </h2>
            
            <div className="space-y-6">
              {/* Info Box */}
              <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-2xl p-4 flex gap-3">
                <Info className="w-5 h-5 text-blue-400 dark:text-blue-300 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm">{t('calibration.why_title')}</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    {t('calibration.why_desc')}
                  </p>
                </div>
              </div>

              {/* Time Picker */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('calibration.blood_time')}</label>
                <div className="relative">
                  <div 
                    onClick={() => setIsCalendarOpen(true)}
                    className="w-full bg-white dark:bg-white/[0.05] rounded-2xl p-4 flex items-center justify-between border border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-all cursor-pointer"
                  >
                    <span className="text-lg font-medium text-gray-900 dark:text-white">
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
                          className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-[100]"
                        />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9, y: 20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: 20 }}
                          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-[#121212] rounded-[40px] p-8 shadow-2xl z-[101] w-[90%] max-w-[400px] border dark:border-white/10"
                        >
                          <div className="flex flex-col gap-6">
                            <div className="flex items-baseline gap-3">
                              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                                {format(time, i18n.language.startsWith('zh') || i18n.language === 'ja' ? "EEE d MMM" : "EEE, MMM d", { locale: i18n.language === 'zh-CN' ? zhCN : undefined })}
                              </span>
                              <input
                                type="time"
                                value={format(time, "HH:mm")}
                                onChange={handleTimeChange}
                                className="text-3xl font-bold text-gray-400 dark:text-gray-500 bg-transparent border-none focus:outline-none focus:text-gray-900 dark:focus:text-white w-24"
                              />
                            </div>

                            <div className="calendar-container">
                              <style>{`
                                .rdp-root {
                                  --rdp-accent-color: #3b82f6;
                                  --rdp-accent-background-color: #eff6ff;
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
                                  day: "h-10 w-10 text-center text-sm p-0 relative flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors dark:text-gray-300",
                                  selected: "bg-blue-500 text-white hover:bg-blue-600 focus:bg-blue-500",
                                  today: "text-blue-500 dark:text-blue-400 font-bold",
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
                                className="flex-1 py-4 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 rounded-[24px] font-bold hover:bg-gray-200 dark:hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                              >
                                <X className="w-5 h-5" />
                                {t('common.cancel')}
                              </button>
                              <button
                                onClick={() => setIsCalendarOpen(false)}
                                className="flex-1 py-4 bg-blue-500 dark:bg-blue-600 text-white rounded-[24px] font-bold hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors flex items-center justify-center"
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

              {/* Value Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('calibration.e2_value')}</label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <input 
                      type="number"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      className="w-full bg-white dark:bg-white/[0.05] rounded-2xl p-6 text-2xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                      placeholder="0.0"
                    />
                  </div>
                  <div className="relative w-32">
                    <button 
                      onClick={() => setIsUnitOpen(!isUnitOpen)}
                      className="w-full h-full bg-white dark:bg-white/[0.05] rounded-2xl p-4 flex items-center justify-between border border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-all text-left"
                    >
                      <span className="font-bold text-gray-900 dark:text-white">{selectedUnit.label}</span>
                      <ChevronDown className={cn("w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform", isUnitOpen && "rotate-180")} />
                    </button>
                    
                    <AnimatePresence>
                      {isUnitOpen && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#121212] rounded-2xl shadow-xl border border-gray-100 dark:border-white/10 z-10 overflow-hidden"
                        >
                          {UNITS.map((u) => (
                            <button
                              key={u.id}
                              onClick={() => {
                                setSelectedUnit(u);
                                setIsUnitOpen(false);
                              }}
                              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left"
                            >
                              <span className="font-medium text-gray-900 dark:text-white">{u.label}</span>
                              {selectedUnit.id === u.id && <Check className="w-4 h-4 text-blue-500 dark:text-blue-400" />}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end pt-4">
                <button 
                  onClick={handleSave}
                  className="px-8 py-4 bg-blue-500 dark:bg-blue-600 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-600 dark:hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 dark:shadow-blue-900/20"
                >
                  <Save className="w-5 h-5" />
                  {t('calibration.save')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Records List */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400" />
          {t('calibration.history')}
        </h3>
        
        <div className="space-y-3">
          {records.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-white/[0.02] rounded-[32px] border-2 border-dashed border-gray-200 dark:border-white/10">
              <p className="text-gray-400 dark:text-gray-500">{t('calibration.no_records')}</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {records.map((record) => {
                const date = new Date(record.time);
                
                return (
                  <motion.div 
                    key={record.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, x: -20 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30, mass: 1 }}
                    className="bg-white dark:bg-card border border-gray-100 dark:border-white/[0.05] rounded-3xl p-6 flex items-center gap-4 hover:shadow-md transition-shadow group"
                  >
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-50 dark:bg-blue-500/10">
                      <Beaker className="w-6 h-6 text-blue-400 dark:text-blue-300" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-gray-900 dark:text-white">{t('home.estradiol')} (E2)</h4>
                        <span className="text-sm text-gray-400 dark:text-gray-500 font-medium">
                          {format(date, "yyyy-MM-dd HH:mm")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {record.value} <span className="text-sm font-medium text-gray-400 dark:text-gray-500">{record.unit}</span>
                        </p>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button 
                            onClick={() => handleEdit(record)}
                            className="p-2 text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-all"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(record.id)}
                            className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
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