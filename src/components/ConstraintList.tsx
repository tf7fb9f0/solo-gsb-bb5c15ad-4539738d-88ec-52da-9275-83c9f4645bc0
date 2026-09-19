import type { Constraint } from '../types';
import { constraintText } from '../solver';

interface Props {
  constraints: Constraint[];
  /** 构成矛盾环的约束 id（用于高亮） */
  highlightIds: Set<string>;
  onDelete: (id: string) => void;
  onClear: () => void;
}

export default function ConstraintList({ constraints, highlightIds, onDelete, onClear }: Props) {
  return (
    <div className="card">
      <div className="card-head">
        <h2>约束列表（{constraints.length}）</h2>
        {constraints.length > 0 && (
          <button className="btn ghost" onClick={onClear}>
            清空
          </button>
        )}
      </div>
      {constraints.length === 0 ? (
        <p className="hint">暂无约束。请在上方添加，或加载示例数据。</p>
      ) : (
        <ul className="constraint-list">
          {constraints.map((c, i) => (
            <li key={c.id} className={highlightIds.has(c.id) ? 'highlight' : ''}>
              <span className="idx">#{i + 1}</span>
              <span className="text">{constraintText(c)}</span>
              {highlightIds.has(c.id) && <span className="tag">矛盾环</span>}
              <button className="btn danger" onClick={() => onDelete(c.id)} title="删除该约束">
                删除
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
