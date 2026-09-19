/** 关系：A 比 B 早 / 晚 */
export type Relation = 'before' | 'after';

/** 用户录入的一条约束：事件 A 比事件 B 早/晚 minMinutes ~ maxMinutes 分钟 */
export interface Constraint {
  id: string;
  a: string;
  b: string;
  relation: Relation;
  minMinutes: number;
  maxMinutes: number;
}

/** 差分约束图中的一条边：to ≤ from + weight */
export interface Edge {
  from: string;
  to: string;
  weight: number;
  constraintId: string;
  constraintText: string;
  /** 人类可读的不等式，如 “现场断电 ≤ 报警触发 + 3” */
  ineq: string;
}

/** 检测到的矛盾环：edges[i] 为 nodes[i] → nodes[(i+1) % k] */
export interface ContradictionCycle {
  nodes: string[];
  edges: Edge[];
  /** 环上权重之和（< 0 即矛盾） */
  totalWeight: number;
}

/** 某事件相对锚点的时间窗（分钟），null 表示该侧无界 */
export interface TimeWindow {
  earliest: number | null;
  latest: number | null;
  /** 是否与锚点在约束图中连通 */
  connected: boolean;
}

export type SolveResult =
  | { satisfiable: false; cycle: ContradictionCycle }
  | { satisfiable: true; windows: Map<string, TimeWindow> };

/** 本地持久化的状态结构 */
export interface PersistedState {
  constraints: Constraint[];
  anchorEvent: string;
  anchorTime: string;
}
