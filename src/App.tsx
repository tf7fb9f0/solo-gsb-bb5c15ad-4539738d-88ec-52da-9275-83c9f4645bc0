import { useEffect, useMemo, useState } from 'react';
import ConstraintForm from './components/ConstraintForm';
import ConstraintList from './components/ConstraintList';
import ResultPanel from './components/ResultPanel';
import { solve } from './solver';
import { loadPersisted, savePersisted } from './storage';
import { contradictorySample, satisfiableSample } from './sampleData';
import type { Constraint } from './types';
import { defaultAnchorTime, newId } from './utils';

const persisted = loadPersisted();

export default function App() {
  const [constraints, setConstraints] = useState<Constraint[]>(persisted?.constraints ?? []);
  const [anchorEvent, setAnchorEvent] = useState<string>(persisted?.anchorEvent ?? '');
  const [anchorTime, setAnchorTime] = useState<string>(persisted?.anchorTime ?? defaultAnchorTime());

  // 本地持久化：任何变化都写回 localStorage
  useEffect(() => {
    savePersisted({ constraints, anchorEvent, anchorTime });
  }, [constraints, anchorEvent, anchorTime]);

  const events = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const c of constraints) {
      if (!seen.has(c.a)) {
        seen.add(c.a);
        list.push(c.a);
      }
      if (!seen.has(c.b)) {
        seen.add(c.b);
        list.push(c.b);
      }
    }
    return list;
  }, [constraints]);

  // 实时求解：约束或锚点变化即重新校验
  const result = useMemo(() => solve(constraints, anchorEvent), [constraints, anchorEvent]);

  const cycleConstraintIds = useMemo(() => {
    if (result.satisfiable) return new Set<string>();
    return new Set(result.cycle.edges.map((e) => e.constraintId));
  }, [result]);

  const addConstraint = (c: Omit<Constraint, 'id'>) =>
    setConstraints((prev) => [...prev, { ...c, id: newId() }]);

  const loadSample = (kind: 'ok' | 'bad') => {
    const s = kind === 'ok' ? satisfiableSample() : contradictorySample();
    setConstraints(s.constraints);
    setAnchorEvent(s.anchorEvent);
  };

  return (
    <div className="app">
      <header>
        <h1>事件时序约束校验</h1>
        <p>
          以「事件 A 比事件 B 早 / 晚 x ~ y 分钟」录入约束并指定锚点时间，系统将其转为差分约束图，
          实时校验是否可满足：矛盾时给出可复核的矛盾环，可满足时推算各事件相对锚点的最早 / 最晚时间窗。
        </p>
      </header>

      <main>
        <div className="col">
          <div className="card">
            <h2>锚点设置</h2>
            <div className="form-row">
              <label className="grow">
                锚点事件
                <input
                  list="event-options"
                  value={anchorEvent}
                  onChange={(e) => setAnchorEvent(e.target.value)}
                  placeholder="如：报警触发"
                />
              </label>
              <label>
                锚点时间
                <input
                  type="datetime-local"
                  value={anchorTime}
                  onChange={(e) => setAnchorTime(e.target.value)}
                />
              </label>
            </div>
            <p className="hint">未与锚点在约束图中连通的事件将标记为「无法定时」。</p>
          </div>

          <ConstraintForm onAdd={addConstraint} />

          <div className="card">
            <h2>示例数据</h2>
            <div className="btn-row">
              <button className="btn" onClick={() => loadSample('ok')}>
                加载示例：事故复盘（可满足）
              </button>
              <button className="btn" onClick={() => loadSample('bad')}>
                加载示例：口供冲突（含矛盾）
              </button>
            </div>
            <p className="hint">加载示例会覆盖当前约束；所有数据自动保存在浏览器本地。</p>
          </div>

          <ConstraintList
            constraints={constraints}
            highlightIds={cycleConstraintIds}
            onDelete={(id) => setConstraints((prev) => prev.filter((c) => c.id !== id))}
            onClear={() => setConstraints([])}
          />
        </div>

        <div className="col">
          <ResultPanel
            result={result}
            anchorEvent={anchorEvent}
            anchorTime={anchorTime}
            hasAnyConstraint={constraints.length > 0}
          />
        </div>
      </main>

      <footer>
        <p>数据仅保存在当前浏览器 localStorage 中 · 差分约束 + Bellman-Ford 负环检测</p>
      </footer>

      <datalist id="event-options">
        {events.map((ev) => (
          <option key={ev} value={ev} />
        ))}
      </datalist>
    </div>
  );
}
