import type { ContradictionCycle } from '../types';

/** 展示一条可复核的矛盾环：节点 → 不等式 → 节点 …→ 回到起点 */
export default function CycleView({ cycle }: { cycle: ContradictionCycle }) {
  const k = cycle.nodes.length;
  return (
    <div className="card cycle-card">
      <h2>矛盾环（{k} 个事件）</h2>
      <p className="hint">沿环依次应用下列不等式，最终会要求同一事件比自身更早，逻辑上无法成立：</p>
      <ol className="cycle-path">
        {cycle.edges.map((e, i) => (
          <li key={i}>
            <div className="cycle-node">{cycle.nodes[i]}</div>
            <div className="cycle-edge">
              <span className="arrow">↓</span>
              <code>{e.ineq}</code>
              <span className="src">来自约束：{e.constraintText}</span>
            </div>
          </li>
        ))}
        <li>
          <div className="cycle-node back">回到「{cycle.nodes[0]}」</div>
        </li>
      </ol>
      <p className="cycle-sum">
        环上不等式求和得 <code>0 ≤ {cycle.totalWeight}</code>（分钟），矛盾！
        请修正左侧红色高亮的约束中的至少一条。
      </p>
    </div>
  );
}
