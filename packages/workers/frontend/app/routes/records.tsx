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
import { cn } from "../utils/cn";
import { medicationStorage, type MedicationRecord } from "../utils/storage";
import { Ester, Route } from "@hrt-tracker/core";

const METHODS = [
  { id: "Injection", label: "肌肉注射 (Injection)", icon: Syringe, color: "text-pink-500", route: Route.Injection },
  { id: "Beta-Patch", label: "贴片贴上 (Beta)", icon: Bookmark, color: "text-orange-500", route: Route.PatchApply },
  { id: "Beta-Remove", label: "贴片移除 (Beta)", icon: X, color: "text-gray-400", route: Route.PatchRemove },
  { id: "Beta-Gel", label: "凝胶 (Beta)", icon: Droplets, color: "text-blue-400", route: Route.Gel },
  { id: "Oral", label: "口服 (Oral)", icon: Pill, color: "text-blue-500", route: Route.Oral },
  { id: "Sublingual", label: "舌下 (Sublingual)", icon: Pill, color: "text-emerald-500", route: Route.Sublingual },
];

const TYPES = [
  { id: "EB", label: "苯甲酸雌二醇 (EB)", icon: Hexagon, ester: Ester.EB },
  { id: "EV", label: "戊酸雌二醇 (EV)", icon: Loader, ester: Ester.EV },
  { id: "EC", label: "环戊丙酸雌二醇 (EC)", icon: Orbit, ester: Ester.EC },
  { id: "EN", label: "庚酸雌二醇 (EN)", icon: Network, ester: Ester.EN },
];

export default function RecordsPage() {
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
    if (dosageValue <= 1.5) return { label: "低剂量", color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" };
    if (dosageValue <= 3.0) return { label: "中等剂量", color: "bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" };
    if (dosageValue <= 6.0) return { label: "高剂量", color: "bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400" };
    return { label: "超高剂量", color: "bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400" };
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
          <div className="w-12 h-12 rounded-2xl bg-pink-50 dark:bg-pink-500/10 flex items-center justify-center">
            <Activity className="w-6 h-6 text-pink-400 dark:text-pink-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">用药记录</h2>
            <p className="text-sm text-gray-400 dark:text-gray-500">{records.length} 条记录</p>
          </div>
        </div>
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors duration-300",
          (showAddForm || editingId) ? "bg-pink-50 dark:bg-pink-500/10" : "bg-[#E6F6F2] dark:bg-[#00A37B]/10"
        )}>
          {(showAddForm || editingId) ? (
            <X className="w-6 h-6 text-pink-400 dark:text-pink-300" />
          ) : (
            <Plus className="w-6 h-6 text-[#00A37B] dark:text-[#00c292]" />
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
            className="bg-[#F2F2F2] dark:bg-card rounded-[32px] p-8 shadow-sm relative overflow-hidden"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              {editingId ? "编辑用药记录" : "新增用药记录"}
            </h2>
            
            <div className="space-y-6">
              {/* Dosage Level Reference */}
              <div className="bg-[#E6F6F2] dark:bg-[#00A37B]/10 border border-[#00A37B]/10 dark:border-[#00A37B]/20 rounded-2xl p-4 flex gap-3">
                <Info className="w-5 h-5 text-[#00A37B] dark:text-[#00c292] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-gray-900 dark:text-white">剂量级别参考</h4>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-bold", currentDosageLevel.color)}>
                      {currentDosageLevel.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    当前输入剂量：{dosage || "0"} mg/天
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-relaxed">
                    参考范围：低剂量 ≤ 1.5 mg/天 · 中等剂量 ≤ 3 mg/天 · 高剂量 ≤ 6 mg/天 · 超高剂量 ≤ 9 mg/天
                  </p>
                </div>
              </div>
              {/* Time Picker */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">给药时间</label>
                <div className="relative">
                  <div 
                    onClick={() => setIsCalendarOpen(true)}
                    className="w-full bg-white dark:bg-white/[0.05] rounded-2xl p-4 flex items-center justify-between border border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-all cursor-pointer"
                  >
                    <span className="text-lg font-medium text-gray-900 dark:text-white">
                      {format(time, "EEE d MMM HH:mm", { locale: zhCN })}
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
                          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-[#121212] rounded-[40px] p-8 shadow-2xl z-101 w-[90%] max-w-[400px] border dark:border-white/10"
                        >
                          <div className="flex flex-col gap-6">
                            <div className="flex items-baseline gap-3">
                              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                                {format(time, "EEE d MMM", { locale: zhCN })}
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
                                locale={zhCN}
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
                                className="flex-1 py-4 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 rounded-[24px] font-bold hover:bg-gray-200 dark:hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                              >
                                <X className="w-5 h-5" />
                                取消
                              </button>
                              <button
                                onClick={() => setIsCalendarOpen(false)}
                                className="flex-1 py-4 bg-[#00A37B] dark:bg-[#00c292] text-white dark:text-black rounded-[24px] font-bold hover:bg-[#008F6B] dark:hover:bg-[#00e0a8] transition-colors flex items-center justify-center"
                              >
                                确定
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
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">给药途径</label>
                <div className="relative">
                  <button 
                    onClick={handleMethodToggle}
                    className="w-full bg-white dark:bg-white/[0.05] rounded-2xl p-4 flex items-center gap-3 border border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-all text-left"
                  >
                    <selectedMethod.icon className={cn("w-5 h-5", selectedMethod.color)} />
                    <span className="text-lg font-medium text-gray-900 dark:text-white flex-1">{selectedMethod.label}</span>
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
                            <span className="text-lg font-medium text-gray-900 dark:text-white flex-1">{m.label}</span>
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
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">药物类型</label>
                <div className="relative">
                  <button 
                    onClick={handleTypeToggle}
                    className="w-full bg-white dark:bg-white/[0.05] rounded-2xl p-4 flex items-center gap-3 border border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-all text-left"
                  >
                    <selectedType.icon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <span className="text-lg font-medium text-gray-900 dark:text-white flex-1">{selectedType.label}</span>
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
                            <span className="text-lg font-medium text-gray-900 dark:text-white flex-1">{t.label}</span>
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
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">药物剂量 (MG)</label>
                <div className="relative">
                  <input 
                    type="number"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    className="w-full bg-gray-200/50 dark:bg-white/[0.05] rounded-2xl p-6 text-2xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00A37B]/20 transition-all"
                    placeholder="0.0"
                  />
                </div>
              </div>

              {/* Warning Box */}
              <div className="bg-[#FFF9E6] dark:bg-yellow-500/10 border border-[#FFD666]/30 dark:border-yellow-500/20 rounded-2xl p-4 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-[#FAAD14] shrink-0" />
                <div>
                  <h4 className="font-bold text-[#855800] dark:text-yellow-500">使用方式与用量</h4>
                  <p className="text-sm text-[#855800] dark:text-yellow-500/80 opacity-80">乳腺癌高风险者、重度肝障碍患者请勿使用！</p>
                </div>
              </div>

              {/* Info Sections */}
              <div className="bg-gray-100/50 dark:bg-white/[0.02] rounded-2xl p-6 space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  使用方式：肌肉注射、皮下注射 <span className="text-pink-500 dark:text-pink-400 font-medium">不会打针就不要瞎打！</span>
                </p>
                <div className="space-y-2">
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300">使用剂量：</p>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside space-y-1">
                    <li>戊酸雌二醇：每 5-7 天 5 mg / 每 1-2 周 10 mg</li>
                    <li>环戊丙酸雌二醇：每 7 天 5-6 mg / 每 14 天 10-12 mg</li>
                  </ul>
                  <a href="https://transfemscience.org/misc/injectable-e2-simulator/" className="text-sm text-[#00A37B] dark:text-[#00c292] flex items-center gap-1 hover:underline">
                    雌二醇注射剂模拟计算器 (英文) <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Notes Section */}
              <div className="bg-gray-100/50 dark:bg-white/[0.02] rounded-2xl p-6 space-y-4">
                <h4 className="font-bold text-gray-900 dark:text-white">注意事项：</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <li>• 请以正确的方式打开安瓿瓶，以避免被玻璃划伤 / 使瓶子碎裂 / 使微小的玻璃碎渣混入药水。</li>
                  <li>• 请勿重复注入同一位置。</li>
                  <li className="text-red-500 dark:text-red-400 font-medium">• 小心避开血管，可能栓塞血管！</li>
                  <li className="text-red-500 dark:text-red-400 font-medium">• 小心避开神经，若进行肌肉注射，在安全区域内注射。</li>
                  <li>• 由于药品为油性，建议使用 12 号针头 (粉, 18G) 抽取药品，6 号针头 (蓝, 23G / 25G) 注射。</li>
                  <li>• 快速进针和抽药完毕后使用新针头注射有助于缓解疼痛。</li>
                  <li>• 自行注射建议使用股外侧肌 (大腿三分之一中段斜外上方) 和三角肌 (打疫苗的位置)。</li>
                  <li>• 如果您在插入注射针头时感到剧烈疼痛或看到大量血液回流，请立即拔出针头，更换新的针头并更换注射部位。</li>
                  <li>• 如果在某次注射结束后有较以往更多出血 (但可以止住)，属于正常现象，请不要惊慌。</li>
                </ul>
                <div className="pt-2 border-t border-gray-200 dark:border-white/10">
                  <a href="https://mtf.wiki" className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 hover:underline">
                    来源: Mtf.wiki <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end pt-4">
                <button 
                  onClick={handleSave}
                  className="px-8 py-4 bg-[#00A37B] dark:bg-[#00c292] text-white dark:text-black rounded-2xl font-bold flex items-center gap-2 hover:bg-[#008F6B] dark:hover:bg-[#00e0a8] transition-all shadow-lg shadow-[#00A37B]/20 dark:shadow-[#00c292]/10"
                >
                  <Save className="w-5 h-5" />
                  保存
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
          历史记录
        </h3>
        
        <div className="space-y-3">
          {records.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-white/[0.02] rounded-[32px] border-2 border-dashed border-gray-200 dark:border-white/10">
              <p className="text-gray-400 dark:text-gray-500">暂无记录</p>
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
                    className="bg-white dark:bg-card border border-gray-100 dark:border-white/[0.05] rounded-3xl p-6 flex items-center gap-4 hover:shadow-md transition-shadow group"
                  >
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center bg-gray-50 dark:bg-white/5", method.color.replace('text-', 'bg-').replace('500', '50').replace('400', '400/10'))}>
                      <method.icon className={cn("w-6 h-6", method.color)} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <type.icon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                          <h4 className="font-bold text-gray-900 dark:text-white">{type.label.split(' ')[0]} ({record.type})</h4>
                        </div>
                        <span className="text-sm text-gray-400 dark:text-gray-500 font-medium">
                          {format(date, "HH:mm")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500 dark:text-gray-400">{method.label.split(' ')[0]} • {record.dosage} {record.unit}</p>
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
