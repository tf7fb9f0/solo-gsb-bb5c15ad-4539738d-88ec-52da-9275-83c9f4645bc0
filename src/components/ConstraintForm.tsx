import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Constraint, Relation } from '../types';

interface Props {
  onAdd: (c: Omit<Constraint, 'id'>) => void;
}

export default function ConstraintForm({ onAdd }: Props) {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [relation, setRelation] = useState<Relation>('after');
  const [min, setMin] = useState('0');
  const [max, setMax] = useState('10');
  const [error, setError] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const nameA = a.trim();
    const nameB = b.trim();
    const minN = Number(min);
    const maxN = Number(max);
    if (!nameA || !nameB) return setError('请填写事件 A 与事件 B 的名称');
    if (nameA === nameB) return setError('事件 A 与事件 B 不能是同一事件');
    if (!Number.isInteger(minN) || !Number.isInteger(maxN)) return setError('分钟数必须为整数');
    if (minN < 0 || maxN < 0) return setError('分钟数不能为负数');
    if (minN > maxN) return setError('下限不能大于上限');
    onAdd({ a: nameA, b: nameB, relation, minMinutes: minN, maxMinutes: maxN });
    setError('');
    setA('');
    setB('');
  };

  return (
    <form className="card" onSubmit={submit}>
      <h2>添加约束</h2>
      <div className="form-row">
        <label className="grow">
          事件 A
          <input
            list="event-options"
            value={a}
            onChange={(e) => setA(e.target.value)}
            placeholder="如：报警触发"
          />
        </label>
        <label>
          关系
          <select value={relation} onChange={(e) => setRelation(e.target.value as Relation)}>
            <option value="after">晚于</option>
            <option value="before">早于</option>
          </select>
        </label>
        <label className="grow">
          事件 B
          <input
            list="event-options"
            value={b}
            onChange={(e) => setB(e.target.value)}
            placeholder="如：值班员接警"
          />
        </label>
      </div>
      <div className="form-row">
        <label>
          最少（分钟）
          <input type="number" min="0" step="1" value={min} onChange={(e) => setMin(e.target.value)} />
        </label>
        <label>
          最多（分钟）
          <input type="number" min="0" step="1" value={max} onChange={(e) => setMax(e.target.value)} />
        </label>
        <button type="submit" className="btn primary">
          添加约束
        </button>
      </div>
      <p className="hint">
        含义：事件 A 比事件 B {relation === 'after' ? '晚' : '早'} {min} ~ {max} 分钟发生。
      </p>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
