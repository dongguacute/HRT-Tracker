# @hrt-tracker/core 使用文档

`@hrt-tracker/core` 是一个用于雌二醇（Estradiol）药代动力学（PK）建模的生产级 TypeScript 核心库。它支持多种给药途径、多种酯类，并提供高精度的浓度模拟和实验室数据校准功能。

## 核心概念

### 1. 酯类 (Ester)

支持常见的雌二醇酯类以及环丙孕酮（CPA）：

- `E2`: 纯雌二醇 (Estradiol)
- `EB`: 苯甲酸雌二醇 (Estradiol Benzoate)
- `EV`: 戊酸雌二醇 (Estradiol Valerate)
- `EC`: 环戊丙酸雌二醇 (Estradiol Cypionate)
- `EN`: 庚酸雌二醇 (Estradiol Enanthate)
- `CPA`: 醋酸环丙孕酮 (Cyproterone Acetate)

### 2. 给药途径 (Route)

- `Injection`: 注射（支持多种酯类的动力学模型）
- `Oral`: 口服（支持生物利用度计算）
- `Sublingual`: 舌下含服（支持快速吸收和吞咽部分的分离模型）
- `Gel`: 凝胶（支持不同部位的吸收率，如手臂、大腿、阴囊）
- `PatchApply`: 贴片贴敷（支持零级释放模型）
- `PatchRemove`: 贴片移除

## 快速上手

### 运行浓度模拟

```typescript
import { runSimulation, Ester, Route } from '@hrt-tracker/core';

const events = [
  {
    id: '1',
    timeH: 0,           // 发生时间（小时）
    doseMG: 4,          // 剂量（毫克）
    ester: Ester.EV,    // 戊酸雌二醇
    route: Route.Injection // 肌肉注射
  },
  {
    id: '2',
    timeH: 168,         // 7天后
    doseMG: 4,
    ester: Ester.EV,
    route: Route.Injection
  }
];

const bodyWeight = 70; // 体重 (kg)

const result = runSimulation(events, bodyWeight);

if (result) {
  console.log('时间点:', result.timeH);
  console.log('总浓度 (pg/mL):', result.concPGmL);
  console.log('AUC:', result.auc);
}
```

## API 参考

### `runSimulation(events: DoseEvent[], bodyWeightKG: number): SimulationResult | null`

执行完整的 PK 模拟。

- **参数**:
  - `events`: 给药事件数组。
  - `bodyWeightKG`: 用户体重，用于计算表观分布容积（Vd）。
- **返回**: `SimulationResult` 对象，包含时间序列和对应的浓度。

### `SimulationResult` 结构

```typescript
interface SimulationResult {
  timeH: number[];        // 时间轴（小时）
  concPGmL: number[];     // 总 E2 等效浓度 (pg/mL)
  concPGmL_E2: number[];  // 纯雌二醇浓度 (pg/mL)
  concPGmL_CPA: number[]; // 环丙孕酮浓度 (ng/mL)
  auc: number;            // 曲线下面积
}
```

### 实验室数据校准 (Calibration)

你可以使用真实的验血结果来校准模拟曲线：

```typescript
import { createCalibrationInterpolator, convertToPgMl } from '@hrt-tracker/core';

const labResults = [
  { id: 'lab1', timeH: 100, concValue: 250, unit: 'pg/ml' }
];

// 创建校准函数
const getCalibrationRatio = createCalibrationInterpolator(result, labResults);

// 获取特定时间的校准系数
const ratio = getCalibrationRatio(150);
const calibratedConc = originalConc * ratio;
```

### 辅助工具

- `convertToPgMl(val, unit)`: 单位转换（pmol/L 到 pg/mL）。
- `interpolateConcentration(sim, hour)`: 在模拟结果中进行线性插值，获取任意时间的浓度。
- `compressData / decompressData`: 用于在浏览器端压缩/解压模拟数据的 Gzip 工具。

## 物理常数与模型

核心库内置了基于临床研究的 PK 参数：

- **注射模型**: 采用 3-室模型（3-Compartment Model）模拟吸收、分布和消除。
- **口服/舌下**: 考虑了首过效应和不同的吸收速率。
- **贴片**: 模拟恒定速率释放及移除后的指数衰减。

## 开发与贡献

该库位于 `packages/core` 目录下。

- 编译: `pnpm build`
- 源码结构:
  - `src/model`: 核心动力学逻辑
  - `src/math`: 物理方程的解析解
  - `src/constants`: PK 参数常数
  - `src/types`: 类型定义

