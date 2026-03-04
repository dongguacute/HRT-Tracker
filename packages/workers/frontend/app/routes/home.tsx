import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, startOfDay, addDays, differenceInHours } from "date-fns";
import { 
  Activity,
  RotateCcw,
  Info,
  AlertCircle
} from "lucide-react";
import { cn } from "../utils/cn";
import { medicationStorage, labStorage, settingsStorage } from "../utils/storage";
import { runSimulation, Ester, Route, type DoseEvent, createCalibrationInterpolator, type LabResult as CoreLabResult, interpolateConcentration } from "@hrt-tracker/core";

const ReactECharts = lazy(() => import('echarts-for-react'));

const METHODS = [
  { id: "Injection", route: Route.Injection },
  { id: "Beta-Patch", route: Route.PatchApply },
  { id: "Beta-Remove", route: Route.PatchRemove },
  { id: "Beta-Gel", route: Route.Gel },
  { id: "Oral", route: Route.Oral },
  { id: "Sublingual", route: Route.Sublingual },
];

const TYPES = [
  { id: "EB", ester: Ester.EB },
  { id: "EV", ester: Ester.EV },
  { id: "EC", ester: Ester.EC },
  { id: "EN", ester: Ester.EN },
];

export default function Home() {
  const [records, setRecords] = useState<any[]>([]);
  const [labRecords, setLabRecords] = useState<any[]>([]);

  useEffect(() => {
    setRecords(medicationStorage.getRecords());
    setLabRecords(labStorage.getRecords());
  }, []);
  const [showNotice, setShowNotice] = useState(false);
  const handleConfirmNotice = () => setShowNotice(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(window.document.documentElement.classList.contains('dark'));
    };
    
    checkTheme();
    
    // 监听主题变化
    const observer = new MutationObserver(checkTheme);
    observer.observe(window.document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  // 计算当前校准倍率
  const currentCalibrationRatio = useMemo(() => {
    const defaultVal = { ratio: 1.0, theory: 0, actual: 0 };
    if (records.length === 0 || labRecords.length === 0) return defaultVal;
    
    try {
      const baseTime = new Date();
      const events: DoseEvent[] = records.map(r => {
        const method = METHODS.find(m => m.id === r.method);
        const type = TYPES.find(t => t.id === r.type);
        return {
          id: r.id,
          timeH: (new Date(r.time).getTime() - baseTime.getTime()) / (1000 * 60 * 60),
          doseMG: r.dosage,
          ester: type?.ester || Ester.EV,
          route: method?.route || Route.Injection,
        };
      });

      const settings = settingsStorage.getSettings();
      const result = runSimulation(events, settings.weight || 60);
      if (!result) return defaultVal;

      const coreLabResults: CoreLabResult[] = labRecords.map(lr => ({
        id: lr.id,
        timeH: (new Date(lr.time).getTime() - baseTime.getTime()) / (1000 * 60 * 60),
        concValue: lr.value,
        unit: lr.unit
      }));
      
      const latestLab = coreLabResults[0];
      const theoryAtLab = interpolateConcentration(result, latestLab.timeH, 'concPGmL_E2') || 0;
      
      const interpolator = createCalibrationInterpolator(result, coreLabResults);
      return {
        ratio: interpolator(0),
        theory: theoryAtLab,
        actual: latestLab.concValue
      };
    } catch (e) {
      console.error("Error calculating calibration ratio:", e);
      return defaultVal;
    }
  }, [records, labRecords]);

  // 图表数据计算
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSimulation = async () => {
      if (records.length === 0) {
        setSimulationResult(null);
        return;
      }

      setIsLoading(true);
      try {
        const baseTime = new Date();
        const events = records.map(r => {
          const method = METHODS.find(m => m.id === r.method);
          const type = TYPES.find(t => t.id === r.type);
          return {
            id: r.id,
            timeH: (new Date(r.time).getTime() - baseTime.getTime()) / (1000 * 60 * 60),
            doseMG: r.dosage,
            ester: type?.ester || Ester.EV,
            route: method?.route || Route.Injection,
          };
        });

        const settings = settingsStorage.getSettings();
        
        // 尝试调用后端 API
        const response = await fetch('/api/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ events, weight: settings.weight })
        });

        if (response.ok) {
          const result = await response.json();
          setSimulationResult(result);
        } else {
          // 后端失败则本地兜底
          const result = runSimulation(events, settings.weight || 60);
          setSimulationResult(result);
        }
      } catch (e) {
        console.error("API failed, using local fallback", e);
        // 网络失败则本地兜底
        const baseTime = new Date();
        const events = records.map(r => {
          const method = METHODS.find(m => m.id === r.method);
          const type = TYPES.find(t => t.id === r.type);
          return {
            id: r.id,
            timeH: (new Date(r.time).getTime() - baseTime.getTime()) / (1000 * 60 * 60),
            doseMG: r.dosage,
            ester: type?.ester || Ester.EV,
            route: method?.route || Route.Injection,
          };
        });
        const result = runSimulation(events, 60);
        setSimulationResult(result);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSimulation();
  }, [records]);

  const simulationData = useMemo(() => {
    if (!simulationResult || !simulationResult.timeH) return [];
    
    const baseTime = new Date();
    let finalConc_E2 = [...simulationResult.concPGmL_E2];
    
    if (labRecords.length > 0) {
      const coreLabResults: CoreLabResult[] = labRecords.map(lr => ({
        id: lr.id,
        timeH: (new Date(lr.time).getTime() - baseTime.getTime()) / (1000 * 60 * 60),
        concValue: lr.value,
        unit: lr.unit
      }));
      
      const interpolator = createCalibrationInterpolator(simulationResult, coreLabResults);
      finalConc_E2 = simulationResult.timeH.map((t: number, i: number) => simulationResult.concPGmL_E2[i] * interpolator(t));
    }

    return simulationResult.timeH.map((t: number, i: number) => ({
      time: t,
      displayTime: format(addDays(baseTime, t / 24), "M月d日 HH:mm"),
      e2: Math.round(finalConc_E2[i] || 0),
      cpa: Math.round(simulationResult.concPGmL_CPA[i] || 0),
    }));
  }, [simulationResult, labRecords]);

  const currentE2 = simulationData.length > 0 ? simulationData.find((d: any) => d.time >= 0)?.e2 || 0 : 0;

  const getDosageLevel = (dosageValue: number) => {
    if (dosageValue <= 1.5) return { label: "低剂量", color: "bg-emerald-50 text-emerald-400" };
    if (dosageValue <= 3.0) return { label: "中等剂量", color: "bg-blue-50 text-blue-400" };
    if (dosageValue <= 6.0) return { label: "高剂量", color: "bg-orange-50 text-orange-400" };
    return { label: "超高剂量", color: "bg-red-50 text-red-400" };
  };

  // 获取最近一次用药的剂量级别
  const latestDosageLevel = useMemo(() => {
    if (records.length === 0) return null;
    const latestRecord = records[0]; // records 已经是按时间倒序排列的
    return getDosageLevel(latestRecord.dosage);
  }, [records]);

  const chartOption = useMemo(() => {
    if (simulationData.length === 0) return {};

    const nowIndex = simulationData.findIndex((d: any) => d.time >= 0);

    return {
      grid: {
        top: 40,
        right: 20,
        bottom: 60,
        left: 40,
        containLabel: true
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: isDark ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.9)',
        borderRadius: 16,
        borderWidth: 0,
        padding: [12, 16],
        textStyle: {
          color: isDark ? '#f9fafb' : '#111827',
          fontWeight: 'bold'
        },
        extraCssText: isDark ? 'box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.5); border: 1px solid rgba(255,255,255,0.1);' : 'box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);',
        formatter: (params: any) => {
          const data = params[0];
          return `
            <div style="margin-bottom: 4px; color: ${isDark ? '#9ca3af' : '#6b7280'}; font-size: 12px;">${data.name}</div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 8px; height: 8px; border-radius: 50%; background-color: #f472b6;"></div>
              <span style="font-size: 14px; color: ${isDark ? '#e5e7eb' : '#374151'};">雌二醇: <span style="font-size: 18px; color: #f472b6; font-weight: 900;">${data.value}</span> <span style="font-size: 10px; color: ${isDark ? '#6b7280' : '#9ca3af'};">pg/mL</span></span>
            </div>
          `;
        }
      },
      xAxis: {
        type: 'category',
        data: simulationData.map((d: any) => d.displayTime),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: isDark ? '#6b7280' : '#9ca3af',
          fontSize: 11,
          interval: 'auto',
          hideOverlap: true
        },
        boundaryGap: false
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: {
          lineStyle: {
            type: 'dashed',
            color: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f0f0f0'
          }
        },
        axisLabel: {
          color: '#f472b6',
          fontSize: 11,
          fontWeight: 'bold'
        }
      },
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100,
          zoomOnMouseWheel: true
        },
        {
          type: 'slider',
          show: true,
          bottom: 10,
          height: 20,
          borderColor: 'transparent',
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#f9fafb',
          fillerColor: 'rgba(244, 114, 182, 0.1)',
          handleIcon: 'path://M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z',
          handleSize: '80%',
          handleStyle: {
            color: '#f472b6',
            shadowBlur: 3,
            shadowColor: 'rgba(0, 0, 0, 0.1)',
            shadowOffsetX: 2,
            shadowOffsetY: 2
          },
          textStyle: { color: 'transparent' },
          brushSelect: false
        }
      ],
      series: [
        {
          name: '雌二醇',
          type: 'line',
          smooth: true,
          showSymbol: false,
          symbolSize: 8,
          data: simulationData.map((d: any) => d.e2),
          lineStyle: {
            width: 4,
            color: '#f472b6'
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(244, 114, 182, 0.3)' },
                { offset: 1, color: 'rgba(244, 114, 182, 0)' }
              ]
            }
          },
          markLine: nowIndex !== -1 ? {
            symbol: ['none', 'none'],
            label: { show: false },
            lineStyle: {
              color: '#f472b6',
              type: 'dashed',
              width: 1,
              opacity: 0.5
            },
            data: [{ xAxis: nowIndex }]
          } : undefined,
          emphasis: {
            focus: 'series',
            itemStyle: {
              borderWidth: 2,
              borderColor: isDark ? '#0a0a0a' : '#fff'
            }
          }
        }
      ]
    };
  }, [simulationData, isDark]);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* 顶部状态卡片 */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-card rounded-[32px] p-8 shadow-sm border border-gray-100 dark:border-white/5 relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">当前估算血药浓度</span>
            <button 
              onClick={() => setShowNotice(true)}
              className="flex items-center gap-1 px-2 py-0.5 bg-red-50 dark:bg-red-500/10 text-red-400 dark:text-red-400 rounded-full text-[10px] font-bold hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors cursor-pointer"
            >
              <Info className="w-3 h-3" /> 重要提示
            </button>
          </div>
          {latestDosageLevel && (
            <div className={cn("px-3 py-1 rounded-full text-xs font-bold", latestDosageLevel.color)}>
              {latestDosageLevel.label}
            </div>
          )}
        </div>
        
        <div className="flex gap-12">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-pink-400" />
              <span className="text-sm font-bold text-gray-900 dark:text-white">雌二醇</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-black text-gray-900 dark:text-white">{currentE2}</span>
              <span className="text-sm font-bold text-gray-400 dark:text-gray-500">pg/mL</span>
            </div>
            {labRecords.length > 0 && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">校准倍率</span>
                  <span className={cn(
                    "text-xs font-black px-1.5 py-0.5 rounded-md",
                    currentCalibrationRatio.ratio > 1.2 ? "bg-orange-50 dark:bg-orange-500/10 text-orange-500" : 
                    currentCalibrationRatio.ratio < 0.8 ? "bg-blue-50 dark:bg-blue-500/10 text-blue-500" : "bg-gray-50 dark:bg-white/5 text-gray-400 dark:text-gray-500"
                  )}>
                    x{currentCalibrationRatio.ratio.toFixed(2)}
                  </span>
                </div>
                <div className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                  最近血检: {currentCalibrationRatio.actual} pg/mL (理论: {Math.round(currentCalibrationRatio.theory)} pg/mL)
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              <span className="text-sm font-bold text-gray-900 dark:text-white">醋酸环丙孕酮</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-black text-gray-200 dark:text-white/10">--</span>
            </div>
          </div>
        </div>
        
        <div className="absolute top-0 right-0 w-32 h-32 bg-pink-50/30 dark:bg-pink-500/5 rounded-full -mr-16 -mt-16 blur-3xl" />
      </motion.div>

      {/* 图表卡片 */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-card rounded-[32px] p-8 shadow-sm border border-gray-100 dark:border-white/5"
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-pink-50 dark:bg-pink-500/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-pink-400 dark:text-pink-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">血药浓度</h3>
          </div>
          <button className="p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-colors text-gray-400 dark:text-gray-500">
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        <div className="h-[400px] w-full">
          <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-gray-400">加载图表中...</div>}>
            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center text-gray-400">计算模拟数据中...</div>
            ) : (
              <ReactECharts 
                option={chartOption} 
                style={{ height: '100%', width: '100%' }}
                notMerge={true}
                lazyUpdate={true}
              />
            )}
          </Suspense>
        </div>
      </motion.div>

      {/* 重要提示弹窗 */}
      <AnimatePresence>
        {showNotice && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-100"
              onClick={handleConfirmNotice}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[440px] bg-[#F2F2F2] dark:bg-[#121212] rounded-[48px] p-10 shadow-2xl z-101 overflow-hidden border dark:border-white/10"
            >
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-white dark:bg-white/5 flex items-center justify-center shadow-sm">
                  <AlertCircle className="w-8 h-8 text-red-400 dark:text-red-400" />
                </div>
                
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">重要提示</h2>
                
                <div className="space-y-4">
                  <p className="text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                    近期有用户反馈，参考血检结果进行校准后，估算数据出现异常偏差。
                  </p>
                  
                  <div className="bg-white/60 dark:bg-white/5 border border-pink-100 dark:border-pink-500/20 rounded-[32px] p-6 text-left">
                    <p className="text-gray-900 dark:text-white font-bold leading-relaxed">
                      请务必理解：本软件仅依据药代动力学模型提供理论估算值，无法替代真实的血液检测。同一个个体在不同时期的吸收代谢情况也可能发生变化。
                    </p>
                  </div>
                  
                  <p className="text-gray-400 dark:text-gray-500 text-sm leading-relaxed px-2">
                    要准确了解您的血药浓度，唯一的途径是前往医院进行血检。请始终以医院检查报告作为调整用药的依据，切勿仅依赖本软件的估算值。
                  </p>
                </div>

                <button
                  onClick={handleConfirmNotice}
                  className="w-full py-5 bg-[#4A9488] dark:bg-[#00c292] text-white dark:text-black rounded-[24px] font-bold text-lg hover:bg-[#3D7A70] dark:hover:bg-[#00e0a8] transition-all active:scale-[0.98] shadow-lg shadow-[#4A9488]/20 dark:shadow-[#00c292]/10 mt-4"
                >
                  确定
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
