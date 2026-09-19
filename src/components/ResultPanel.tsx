import type { SolveResult } from '../types';
import { isValidDateTimeLocal } from '../utils';
import CycleView from './CycleView';
import WindowsTable from './WindowsTable';

interface Props {
  result: SolveResult;
  anchorEvent: string;
  anchorTime: string;
  hasAnyConstraint: boolean;
}

export default function ResultPanel({ result, anchorEvent, anchorTime, hasAnyConstraint }: Props) {
  if (!result.satisfiable) {
    return (
      <div className="result">
        <div className="banner bad">✗ 约束不可满足：检测到矛盾</div>
        <CycleView cycle={result.cycle} />
      </div>
    );
  }

  const anchor = anchorEvent.trim();
  return (
    <div className="result">
      <div className="banner good">✓ 约束可满足</div>
      {!hasAnyConstraint ? (
        <div className="card">
          <p className="hint">暂无约束。添加约束或加载示例后，此处将显示各事件相对锚点的时间窗。</p>
        </div>
      ) : !anchor ? (
        <div className="card">
          <p className="hint">请在左侧设置锚点事件与锚点时间，以计算各事件的时间窗。</p>
        </div>
      ) : !isValidDateTimeLocal(anchorTime) ? (
        <div className="card">
          <p className="hint">请填写有效的锚点时间。</p>
        </div>
      ) : (
        <WindowsTable windows={result.windows} anchorEvent={anchor} anchorTime={anchorTime} />
      )}
    </div>
  );
}
