import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, startOfDay, addDays, differenceInHours } from "date-fns";
import { 
  Activity,
  RotateCcw,
  Info,
  AlertCircle
} from "lucide-react";
import ReactECharts from 'echarts-for-react';
import { cn } from "../utils/cn";
import { medicationStorage } from "../utils/storage";
import { runSimulation, Ester, Route, type DoseEvent } from "@hrt-tracker/core";

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
  const [showNotice, setShowNotice] = useState(false);

  useEffect(() => {
    setRecords(medicationStorage.getRecords());
  }, []);

  const handleConfirmNotice = () => {
    setShowNotice(false);
  };

  // 图表数据计算
  const simulationData = useMemo(() => {
    try {
      if (records.length === 0) return [];

      const events: DoseEvent[] = records.map(r => {
        const method = METHODS.find(m => m.id === r.method);
        const type = TYPES.find(t => t.id === r.type);
        const timeDate = new Date(r.time);
        const nowStart = startOfDay(new Date());
        return {
          id: r.id,
          timeH: differenceInHours(timeDate, nowStart),
          doseMG: r.dosage,
          ester: type?.ester || Ester.EV,
          route: method?.route || Route.Injection,
        };
      });

      const result = runSimulation(events, 60); // 默认体重 60kg
      if (!result) {
        return [];
      }

      if (!result.timeH || !result.concPGmL_E2 || !result.concPGmL_CPA) {
        return [];
      }

      return result.timeH.map((t: number, i: number) => ({
        time: t,
        displayTime: format(addDays(startOfDay(new Date()), t / 24), "M月d日"),
        e2: Math.round(result.concPGmL_E2[i] || 0),
        cpa: Math.round(result.concPGmL_CPA[i] || 0),
      }));
    } catch (error) {
      console.error("Error in simulationData useMemo:", error);
      return [];
    }
  }, [records]);

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
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 16,
        borderWidth: 0,
        padding: [12, 16],
        textStyle: {
          color: '#111827',
          fontWeight: 'bold'
        },
        extraCssText: 'box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);',
        formatter: (params: any) => {
          const data = params[0];
          return `
            <div style="margin-bottom: 4px; color: #6b7280; font-size: 12px;">${data.name}</div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 8px; height: 8px; border-radius: 50%; background-color: #f472b6;"></div>
              <span style="font-size: 14px;">雌二醇: <span style="font-size: 18px; color: #f472b6;">${data.value}</span> pg/mL</span>
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
          color: '#9ca3af',
          fontSize: 12,
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
            color: '#f0f0f0'
          }
        },
        axisLabel: {
          color: '#f472b6',
          fontSize: 12
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
          backgroundColor: '#f9fafb',
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
              width: 1
            },
            data: [{ xAxis: nowIndex }]
          } : undefined,
          emphasis: {
            focus: 'series',
            itemStyle: {
              borderWidth: 2,
              borderColor: '#fff'
            }
          }
        }
      ]
    };
  }, [simulationData]);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* 顶部状态卡片 */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-500">当前估算血药浓度</span>
            <button 
              onClick={() => setShowNotice(true)}
              className="flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-400 rounded-full text-[10px] font-bold hover:bg-red-100 transition-colors cursor-pointer"
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
              <span className="text-sm font-bold text-gray-900">雌二醇</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-black text-gray-900">{currentE2}</span>
              <span className="text-sm font-bold text-gray-400">pg/mL</span>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              <span className="text-sm font-bold text-gray-900">醋酸环丙孕酮</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-black text-gray-200">--</span>
            </div>
          </div>
        </div>
        
        <div className="absolute top-0 right-0 w-32 h-32 bg-pink-50/30 rounded-full -mr-16 -mt-16 blur-3xl" />
      </motion.div>

      {/* 图表卡片 */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100"
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-pink-50 flex items-center justify-center">
              <Activity className="w-5 h-5 text-pink-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">血药浓度</h3>
          </div>
          <button className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-400">
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        <div className="h-[400px] w-full">
          <ReactECharts 
            option={chartOption} 
            style={{ height: '100%', width: '100%' }}
            notMerge={true}
            lazyUpdate={true}
          />
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
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-100"
              onClick={handleConfirmNotice}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[440px] bg-[#F2F2F2] rounded-[48px] p-10 shadow-2xl z-101 overflow-hidden"
            >
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm">
                  <AlertCircle className="w-8 h-8 text-red-400" />
                </div>
                
                <h2 className="text-2xl font-black text-gray-900">重要提示</h2>
                
                <div className="space-y-4">
                  <p className="text-gray-500 leading-relaxed font-medium">
                    近期有用户反馈，参考血检结果进行校准后，估算数据出现异常偏差。
                  </p>
                  
                  <div className="bg-white/60 border border-pink-100 rounded-[32px] p-6 text-left">
                    <p className="text-gray-900 font-bold leading-relaxed">
                      请务必理解：本软件仅依据药代动力学模型提供理论估算值，无法替代真实的血液检测。同一个个体在不同时期的吸收代谢情况也可能发生变化。
                    </p>
                  </div>
                  
                  <p className="text-gray-400 text-sm leading-relaxed px-2">
                    要准确了解您的血药浓度，唯一的途径是前往医院进行血检。请始终以医院检查报告作为调整用药的依据，切勿仅依赖本软件的估算值。
                  </p>
                </div>

                <button
                  onClick={handleConfirmNotice}
                  className="w-full py-5 bg-[#4A9488] text-white rounded-[24px] font-bold text-lg hover:bg-[#3D7A70] transition-all active:scale-[0.98] shadow-lg shadow-[#4A9488]/20 mt-4"
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
