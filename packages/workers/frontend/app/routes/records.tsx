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
  ChevronRight
} from "lucide-react";
import { cn } from "../utils/cn";
import { medicationStorage, type MedicationRecord } from "../utils/storage";

const METHODS = [
  { id: "Injection", label: "肌肉注射 (Injection)", icon: Syringe, color: "text-pink-500" },
  { id: "Beta-Patch", label: "贴片贴上 (Beta)", icon: Bookmark, color: "text-orange-500" },
  { id: "Beta-Remove", label: "贴片移除 (Beta)", icon: X, color: "text-gray-400" },
  { id: "Beta-Gel", label: "凝胶 (Beta)", icon: Droplets, color: "text-blue-400" },
  { id: "Oral", label: "口服 (Oral)", icon: Pill, color: "text-blue-500" },
  { id: "Sublingual", label: "舌下 (Sublingual)", icon: Pill, color: "text-emerald-500" },
];

const TYPES = [
  { id: "EB", label: "苯甲酸雌二醇 (EB)", icon: "hexagon" },
  { id: "EV", label: "戊酸雌二醇 (EV)", icon: "spiral" },
  { id: "EC", label: "环戊丙酸雌二醇 (EC)", icon: "circle-dot" },
  { id: "EN", label: "庚酸雌二醇 (EN)", icon: "git-branch" },
];

export default function RecordsPage() {
  const [records, setRecords] = useState<MedicationRecord[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(METHODS[0]);
  const [selectedType, setSelectedType] = useState(TYPES[1]);
  const [dosage, setDosage] = useState("0.0");
  const [time, setTime] = useState(new Date());
  const [isMethodOpen, setIsMethodOpen] = useState(false);
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  useEffect(() => {
    setRecords(medicationStorage.getRecords());
  }, []);

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [hours, minutes] = e.target.value.split(':').map(Number);
    const newDate = setHours(setMinutes(time, minutes), hours);
    setTime(newDate);
  };

  const handleSave = () => {
    const newRecord = medicationStorage.saveRecord({
      time: time.toISOString(),
      method: selectedMethod.id,
      type: selectedType.id,
      dosage: parseFloat(dosage) || 0,
      unit: "mg",
    });
    setRecords([newRecord, ...records]);
    setShowAddForm(false);
    // Reset form or show success
  };

  const handleDelete = (id: string) => {
    medicationStorage.deleteRecord(id);
    setRecords(records.filter(r => r.id !== id));
  };

  const formatDate = (date: Date) => {
    return format(date, "M月d日 HH:mm", { locale: zhCN });
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Header / Trigger Button */}
      <AnimatePresence mode="wait">
        {!showAddForm ? (
          <motion.div 
            key="trigger"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={() => setShowAddForm(true)}
            className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-pink-50 flex items-center justify-center">
                <Activity className="w-6 h-6 text-pink-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">用药记录</h2>
                <p className="text-sm text-gray-400">{records.length} 条记录</p>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#E6F6F2] flex items-center justify-center">
              <Plus className="w-6 h-6 text-[#00A37B]" />
            </div>
          </motion.div>
        ) : (
          /* Add Record Card */
          <motion.div 
            key="form"
            initial={{ opacity: 0, height: 0, y: 20 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="bg-[#F2F2F2] rounded-[32px] p-8 shadow-sm relative overflow-hidden"
          >
            <button 
              onClick={() => setShowAddForm(false)}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:bg-gray-200 rounded-full transition-colors z-20"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-6">新增用药记录</h2>
            
            <div className="space-y-6">
              {/* Time Picker */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">给药时间</label>
              <div className="relative">
                <div 
                  onClick={() => setIsCalendarOpen(true)}
                  className="w-full bg-white rounded-2xl p-4 flex items-center justify-between border border-transparent hover:border-gray-200 transition-all cursor-pointer"
                >
                  <span className="text-lg font-medium text-gray-900">
                    {format(time, "EEE d MMM HH:mm", { locale: zhCN })}
                  </span>
                  <CalendarIcon className="w-5 h-5 text-gray-400" />
                </div>

                <AnimatePresence>
                  {isCalendarOpen && (
                    <>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsCalendarOpen(false)}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100]"
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-[40px] p-8 shadow-2xl z-[101] w-[90%] max-w-[400px]"
                      >
                        <div className="flex flex-col gap-6">
                          <div className="flex items-baseline gap-3">
                            <span className="text-3xl font-bold text-gray-900">
                              {format(time, "EEE d MMM", { locale: zhCN })}
                            </span>
                            <input
                              type="time"
                              value={format(time, "HH:mm")}
                              onChange={handleTimeChange}
                              className="text-3xl font-bold text-gray-400 bg-transparent border-none focus:outline-none focus:text-gray-900 w-24"
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
                                month_caption: "flex justify-center py-2 mb-4 relative items-center text-lg font-bold text-gray-900",
                                nav: "flex items-center",
                                button_previous: "absolute left-1 z-10 flex h-7 w-7 items-center justify-center bg-transparent p-0 opacity-50 hover:opacity-100",
                                button_next: "absolute right-1 z-10 flex h-7 w-7 items-center justify-center bg-transparent p-0 opacity-50 hover:opacity-100",
                                month_grid: "w-full border-collapse space-y-1",
                                weekdays: "flex justify-between mb-2",
                                weekday: "text-gray-400 rounded-md w-9 font-medium text-[0.8rem] uppercase text-center",
                                week: "flex w-full justify-between mt-2",
                                day: "h-10 w-10 text-center text-sm p-0 relative flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors",
                                selected: "bg-[#00A37B] text-white hover:bg-[#008F6B] focus:bg-[#00A37B]",
                                today: "text-[#00A37B] font-bold",
                                outside: "text-gray-300 opacity-50",
                                disabled: "text-gray-300 opacity-50",
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
                              className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-[24px] font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                            >
                              <X className="w-5 h-5" />
                              取消
                            </button>
                            <button
                              onClick={() => setIsCalendarOpen(false)}
                              className="flex-1 py-4 bg-[#00A37B] text-white rounded-[24px] font-bold hover:bg-[#008F6B] transition-colors flex items-center justify-center"
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
                <label className="text-sm font-medium text-gray-500">给药途径</label>
                <div className="relative">
                  <button 
                    onClick={() => setIsMethodOpen(!isMethodOpen)}
                    className="w-full bg-white rounded-2xl p-4 flex items-center gap-3 border border-transparent hover:border-gray-200 transition-all text-left"
                  >
                    <selectedMethod.icon className={cn("w-5 h-5", selectedMethod.color)} />
                    <span className="text-lg font-medium text-gray-900 flex-1">{selectedMethod.label}</span>
                    <ChevronDown className={cn("w-5 h-5 text-gray-400 transition-transform", isMethodOpen && "rotate-180")} />
                  </button>
                  
                  <AnimatePresence>
                    {isMethodOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 z-10 overflow-hidden"
                      >
                        {METHODS.map((m) => (
                          <button
                            key={m.id}
                            onClick={() => {
                              setSelectedMethod(m);
                              setIsMethodOpen(false);
                            }}
                            className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                          >
                            <m.icon className={cn("w-5 h-5", m.color)} />
                            <span className="text-lg font-medium text-gray-900 flex-1">{m.label}</span>
                            {selectedMethod.id === m.id && <Check className="w-5 h-5 text-[#00A37B]" />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Drug Type Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">药物类型</label>
                <div className="relative">
                  <button 
                    onClick={() => setIsTypeOpen(!isTypeOpen)}
                    className="w-full bg-white rounded-2xl p-4 flex items-center gap-3 border border-transparent hover:border-gray-200 transition-all text-left"
                  >
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-gray-300" />
                    </div>
                    <span className="text-lg font-medium text-gray-900 flex-1">{selectedType.label}</span>
                    <ChevronDown className={cn("w-5 h-5 text-gray-400 transition-transform", isTypeOpen && "rotate-180")} />
                  </button>

                  <AnimatePresence>
                    {isTypeOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 z-10 overflow-hidden"
                      >
                        {TYPES.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => {
                              setSelectedType(t);
                              setIsTypeOpen(false);
                            }}
                            className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                          >
                            <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-gray-300" />
                            </div>
                            <span className="text-lg font-medium text-gray-900 flex-1">{t.label}</span>
                            {selectedType.id === t.id && <Check className="w-5 h-5 text-[#00A37B]" />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Dosage Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">药物剂量 (MG)</label>
                <div className="relative">
                  <input 
                    type="number"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    className="w-full bg-gray-200/50 rounded-2xl p-6 text-2xl font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#00A37B]/20 transition-all"
                    placeholder="0.0"
                  />
                </div>
              </div>

              {/* Warning Box */}
              <div className="bg-[#FFF9E6] border border-[#FFD666]/30 rounded-2xl p-4 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-[#FAAD14] shrink-0" />
                <div>
                  <h4 className="font-bold text-[#855800]">使用方式与用量</h4>
                  <p className="text-sm text-[#855800] opacity-80">乳腺癌高风险者、重度肝障碍患者请勿使用！</p>
                </div>
              </div>

              {/* Info Sections */}
              <div className="bg-gray-100/50 rounded-2xl p-6 space-y-4">
                <p className="text-sm text-gray-600">
                  使用方式：肌肉注射、皮下注射 <span className="text-pink-500 font-medium">不会打针就不要瞎打！</span>
                </p>
                <div className="space-y-2">
                  <p className="text-sm font-bold text-gray-700">使用剂量：</p>
                  <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                    <li>戊酸雌二醇：每 5-7 天 5 mg / 每 1-2 周 10 mg</li>
                    <li>环戊丙酸雌二醇：每 7 天 5-6 mg / 每 14 天 10-12 mg</li>
                  </ul>
                  <a href="#" className="text-sm text-[#00A37B] flex items-center gap-1 hover:underline">
                    雌二醇注射剂模拟计算器 (英文) <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Notes Section */}
              <div className="bg-gray-100/50 rounded-2xl p-6 space-y-4">
                <h4 className="font-bold text-gray-900">注意事项：</h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• 请以正确的方式打开安瓿瓶，以避免被玻璃划伤 / 使瓶子碎裂 / 使微小的玻璃碎渣混入药水。</li>
                  <li>• 请勿重复注入同一位置。</li>
                  <li className="text-red-500 font-medium">• 小心避开血管，可能栓塞血管！</li>
                  <li className="text-red-500 font-medium">• 小心避开神经，若进行肌肉注射，在安全区域内注射。</li>
                  <li>• 由于药品为油性，建议使用 12 号针头 (粉, 18G) 抽取药品，6 号针头 (蓝, 23G / 25G) 注射。</li>
                  <li>• 快速进针和抽药完毕后使用新针头注射有助于缓解疼痛。</li>
                  <li>• 自行注射建议使用股外侧肌 (大腿三分之一中段斜外上方) 和三角肌 (打疫苗的位置)。</li>
                  <li>• 如果您在插入注射针头时感到剧烈疼痛或看到大量血液回流，请立即拔出针头，更换新的针头并更换注射部位。</li>
                  <li>• 如果在某次注射结束后有较以往更多出血 (但可以止住)，属于正常现象，请不要惊慌。</li>
                </ul>
                <div className="pt-2 border-t border-gray-200">
                  <a href="#" className="text-xs text-gray-400 flex items-center gap-1 hover:underline">
                    来源: Mtf.wiki <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4">
                <button className="p-4 bg-white rounded-2xl border border-gray-200 hover:bg-gray-50 transition-colors">
                  <Bookmark className="w-6 h-6 text-gray-400" />
                </button>
                <button 
                  onClick={handleSave}
                  className="px-8 py-4 bg-[#00A37B] text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-[#008F6B] transition-all shadow-lg shadow-[#00A37B]/20"
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
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#00A37B]" />
          历史记录
        </h3>
        
        <div className="space-y-3">
          {records.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200">
              <p className="text-gray-400">暂无记录</p>
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
                    className="bg-white border border-gray-100 rounded-3xl p-6 flex items-center gap-4 hover:shadow-md transition-shadow group"
                  >
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center bg-gray-50", method.color.replace('text-', 'bg-').replace('500', '50'))}>
                      <method.icon className={cn("w-6 h-6", method.color)} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-gray-900">{type.label.split(' ')[0]} ({record.type})</h4>
                        <span className="text-sm text-gray-400 font-medium">
                          {date.getHours().toString().padStart(2, '0')}:{date.getMinutes().toString().padStart(2, '0')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">{method.label.split(' ')[0]} • {record.dosage} {record.unit}</p>
                        <button 
                          onClick={() => handleDelete(record.id)}
                          className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
