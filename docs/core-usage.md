# @hrt-tracker/core 使用文档

`@hrt-tracker/core` 是一个用于雌二醇（Estradiol）药代动力学（PK）建模的生产级 TypeScript 核心库。它支持多种给药途径、多种酯类，并提供高精度的浓度模拟和实验室数据校准功能。

## 核心概念

### 1. 酯类 (Ester)

支持常见的雌二醇酯类以及醋酸环丙孕酮（CPA）：

- `E2`: 纯雌二醇 (Estradiol)
- `EB`: 苯甲酸雌二醇 (Estradiol Benzoate)
- `EV`: 戊酸雌二醇 (Estradiol Valerate)
- `EC`: 环戊丙酸雌二醇 (Estradiol Cypionate)
- `EN`: 庚酸雌二醇 (Estradiol Enanthate)
- `CPA`: 醋酸环丙孕酮 (Cyproterone Acetate)

### 2. 给药途径 (Route)

- `Injection`: 注射（支持多种酯类的动力学模型）
- `Oral`: 口服（支持生物利用度计算，支持 CPA）
- `Sublingual`: 舌下含服（支持快速吸收和吞咽部分的分离模型）
- `Gel`: 凝胶（支持不同部位的吸收率，如手臂、大腿、阴囊）
- `PatchApply`: 贴片贴敷（支持零级释放模型或一级吸收模型）
- `PatchRemove`: 贴片移除

## 快速上手

### 运行浓度模拟

```typescript
import { runSimulation, Ester, Route, ExtraKey } from '@hrt-tracker/core';

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
  console.log('时间点序列:', result.timeH);
  console.log('总 E2 等效浓度 (pg/mL):', result.concPGmL);
  console.log('纯 CPA 浓度 (ng/mL):', result.concPGmL_CPA);
  console.log('AUC:', result.auc);
}
```

## API 参考

### `runSimulation(events: DoseEvent[], bodyWeightKG: number): SimulationResult | null`

执行完整的 PK 模拟。模拟范围会自动覆盖从第一个事件前 24 小时到最后一个事件后 14 天。

- **参数**:
  - `events`: `DoseEvent[]` 给药事件数组。
  - `bodyWeightKG`: 用户体重，用于计算表观分布容积（Vd）。
- **返回**: `SimulationResult` 对象，包含时间序列和对应的浓度。

### `DoseEvent` 结构

```typescript
interface DoseEvent {
  id: string;
  timeH: number;
  doseMG: number;
  ester: Ester;
  route: Route;
  extras?: Partial<Record<ExtraKey, number>>; // 额外参数
}
```

#### `ExtraKey` 说明

部分给药途径支持额外参数：

- **Gel (凝胶)**: 
  - `ExtraKey.GelSite`: 涂抹部位索引。`0`: 手臂 (arm), `1`: 大腿 (thigh), `2`: 阴囊 (scrotal)。
- **Sublingual (舌下)**:
  - `ExtraKey.SublingualTier`: 熟练度等级。`0`: 快速, `1`: 随意, `2`: 标准, `3`: 严格。
  - `ExtraKey.SublingualTheta`: 直接指定吸收比例 (0-1)。
- **Patch (贴片)**:
  - `ExtraKey.ReleaseRateUGPerDay`: 贴片额定释放速率 (μg/day)。如果提供，将采用零级释放模型。

### `SimulationResult` 结构

```typescript
interface SimulationResult {
  timeH: number[];        // 时间轴（小时）
  concPGmL: number[];     // 总 E2 等效浓度 (pg/mL) = 纯 E2 + (CPA * 1000)
  concPGmL_E2: number[];  // 纯雌二醇浓度 (pg/mL)
  concPGmL_CPA: number[]; // 环丙孕酮浓度 (ng/mL)
  auc: number;            // 曲线下面积 (基于 concPGmL)
}
```

### 实验室数据校准 (Calibration)

你可以使用真实的验血结果来校准模拟曲线。校准器会计算观测值与预测值的比率，并提供平滑的插值函数。

```typescript
import { createCalibrationInterpolator, convertToPgMl } from '@hrt-tracker/core';

const labResults = [
  { id: 'lab1', timeH: 100, concValue: 250, unit: 'pg/ml' }
];

// 创建校准函数 (返回一个接收 timeH 并返回 ratio 的函数)
const getCalibrationRatio = createCalibrationInterpolator(result, labResults);

// 获取特定时间的校准系数
const ratio = getCalibrationRatio(150);
const originalConc = interpolateConcentration(result, 150, 'concPGmL_E2');
const calibratedConc = originalConc * ratio;
```

### 辅助工具

- `convertToPgMl(val, unit)`: 单位转换（pmol/L 到 pg/mL，系数为 3.671）。
- `interpolateConcentration(sim, hour, key?)`: 在模拟结果中进行线性插值，获取任意时间的浓度。`key` 可选 `concPGmL`, `concPGmL_E2`, `concPGmL_CPA`。
- `compressData(data) / decompressData(base64)`: 异步工具，使用 `CompressionStream` (Gzip) 对模拟数据进行压缩/解压。

## 物理常数与模型

核心库内置了基于临床研究的 PK 参数：

- **注射模型**: 采用 3-室模型（3-Compartment Model）模拟吸收、分布和消除。
- **口服/舌下**: 考虑了首过效应（生物利用度约 3%）和不同的吸收速率。
- **贴片**: 模拟恒定速率释放（零级）或移除后的指数衰减。
- **CPA**: 采用独立的 Vd (14 L/kg) 和消除速率 (kClear = 0.017)。

## 开发与贡献

该库位于 `packages/core` 目录下。

- 编译: `pnpm build`
- 源码结构:
  - `src/model`: 核心动力学逻辑，负责参数解析和贡献计算。
  - `src/math`: 物理方程的解析解（1-室、3-室模型）。
  - `src/constants`: PK 参数常数（分子量、消除率、各途径参数）。
  - `src/simulation`: 模拟循环逻辑。
  - `src/types`: 类型定义。
  - `src/utils`: 单位转换、插值和压缩工具。
