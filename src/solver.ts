import type {
  Constraint,
  ContradictionCycle,
  Edge,
  SolveResult,
  TimeWindow,
} from './types';

const EPS = 1e-9;

/** 收集所有事件名（保持出现顺序），锚点事件若不在约束中也补入 */
export function collectEvents(constraints: Constraint[], anchorEvent: string | null): string[] {
  const seen = new Set<string>();
  const events: string[] = [];
  const push = (name: string) => {
    if (!seen.has(name)) {
      seen.add(name);
      events.push(name);
    }
  };
  for (const c of constraints) {
    push(c.a);
    push(c.b);
  }
  if (anchorEvent) push(anchorEvent);
  return events;
}

/** 约束的中文描述，如 “A 比 B 晚 2 ~ 5 分钟” */
export function constraintText(c: Constraint): string {
  const rel = c.relation === 'after' ? '晚' : '早';
  const range =
    c.minMinutes === c.maxMinutes
      ? `${c.minMinutes} 分钟`
      : `${c.minMinutes} ~ ${c.maxMinutes} 分钟`;
  return `${c.a} 比 ${c.b} ${rel} ${range}`;
}

function fmtOffset(minutes: number): string {
  if (minutes === 0) return '';
  return minutes > 0 ? ` + ${minutes}` : ` - ${Math.abs(minutes)}`;
}

/**
 * 把每条约束统一建模为 A - B ∈ [low, high]（分钟），再拆成两条差分约束边：
 *   A ≤ B + high  ⇒  边 B → A，权重 high
 *   B ≤ A - low   ⇒  边 A → B，权重 -low
 */
export function buildEdges(constraints: Constraint[]): Edge[] {
  const edges: Edge[] = [];
  for (const c of constraints) {
    const low = c.relation === 'after' ? c.minMinutes : -c.maxMinutes;
    const high = c.relation === 'after' ? c.maxMinutes : -c.minMinutes;
    const text = constraintText(c);
    edges.push({
      from: c.b,
      to: c.a,
      weight: high,
      constraintId: c.id,
      constraintText: text,
      ineq: `${c.a} ≤ ${c.b}${fmtOffset(high)}`,
    });
    edges.push({
      from: c.a,
      to: c.b,
      weight: -low,
      constraintId: c.id,
      constraintText: text,
      ineq: `${c.b} ≤ ${c.a}${fmtOffset(-low)}`,
    });
  }
  return edges;
}

interface Pred {
  node: string;
  edge: Edge;
}

/**
 * Bellman-Ford 负环检测（所有节点距离初始化为 0，等价于引入超级源点，
 * 因此不连通的子图中的负环也能被发现）。检测到负环时回溯前驱指针提取环。
 */
function detectNegativeCycle(nodes: string[], edges: Edge[]): ContradictionCycle | null {
  if (nodes.length === 0) return null;
  const dist = new Map<string, number>(nodes.map((n) => [n, 0]));
  const pred = new Map<string, Pred>();
  let lastRelaxed: string | null = null;

  for (let i = 0; i < nodes.length; i++) {
    lastRelaxed = null;
    for (const e of edges) {
      const d = dist.get(e.from)! + e.weight;
      if (d < dist.get(e.to)! - EPS) {
        dist.set(e.to, d);
        pred.set(e.to, { node: e.from, edge: e });
        lastRelaxed = e.to;
      }
    }
    if (lastRelaxed === null) return null; // 提前收敛，无负环
  }
  if (lastRelaxed === null) return null;

  // 从最后被松弛的节点沿前驱走 |V| 步，必定已进入环内
  let v = lastRelaxed;
  for (let i = 0; i < nodes.length; i++) v = pred.get(v)!.node;

  // 沿前驱回溯一圈（逆向），再反转得到正向环
  const backNodes: string[] = [];
  const backEdges: Edge[] = [];
  let cur = v;
  do {
    const p = pred.get(cur)!;
    backEdges.push(p.edge);
    backNodes.push(p.node);
    cur = p.node;
  } while (cur !== v);

  const cycleNodes = backNodes.reverse();
  const cycleEdges = backEdges.reverse();
  const totalWeight = cycleEdges.reduce((sum, e) => sum + e.weight, 0);
  return { nodes: cycleNodes, edges: cycleEdges, totalWeight };
}

/** 以 source 为源点跑 Bellman-Ford 最短路（仅在无负环时调用） */
function shortestPaths(nodes: string[], edges: Edge[], source: string): Map<string, number> {
  const dist = new Map<string, number>();
  for (const n of nodes) dist.set(n, Infinity);
  dist.set(source, 0);
  for (let i = 0; i < nodes.length - 1; i++) {
    let changed = false;
    for (const e of edges) {
      const df = dist.get(e.from)!;
      if (df === Infinity) continue;
      if (df + e.weight < dist.get(e.to)! - EPS) {
        dist.set(e.to, df + e.weight);
        changed = true;
      }
    }
    if (!changed) break;
  }
  return dist;
}

/**
 * 求解约束系统：
 * - 存在负环 ⇒ 不可满足，返回一条可复核的矛盾环；
 * - 否则以锚点为源点求最短路：
 *     latest(v)   = dist(anchor → v)          （v 相对锚点的最晚偏移）
 *     earliest(v) = -dist(v → anchor)         （在反向图上求 dist(anchor → v)）
 *   两侧都不可达的节点视为与锚点不连通，标记为「无法定时」。
 */
export function solve(constraints: Constraint[], anchorEvent: string | null): SolveResult {
  const anchor = anchorEvent && anchorEvent.trim() ? anchorEvent.trim() : null;
  const nodes = collectEvents(constraints, anchor);
  const edges = buildEdges(constraints);

  const cycle = detectNegativeCycle(nodes, edges);
  if (cycle) return { satisfiable: false, cycle };

  const windows = new Map<string, TimeWindow>();
  if (anchor) {
    const latest = shortestPaths(nodes, edges, anchor);
    const reversed = edges.map((e) => ({ ...e, from: e.to, to: e.from }));
    const toAnchor = shortestPaths(nodes, reversed, anchor);
    for (const n of nodes) {
      const up = latest.get(n)!;
      const down = toAnchor.get(n)!;
      windows.set(n, {
        latest: up === Infinity ? null : up,
        earliest: down === Infinity ? null : -down,
        connected: up !== Infinity || down !== Infinity,
      });
    }
  }
  return { satisfiable: true, windows };
}
