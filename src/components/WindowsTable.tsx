import type { TimeWindow } from '../types';
import { addMinutes, formatDateTime, formatRelative } from '../utils';

interface Props {
  windows: Map<string, TimeWindow>;
  anchorEvent: string;
  anchorTime: string;
}

function BoundCell({ offset, anchorTime }: { offset: number | null; anchorTime: string }) {
  if (offset === null) return <span className="muted">无界</span>;
  return (
    <>
      <div>{formatDateTime(addMinutes(anchorTime, offset))}</div>
      <div className="muted small">相对锚点 {formatRelative(offset)}</div>
    </>
  );
}

function Badge({ w, isAnchor }: { w: TimeWindow; isAnchor: boolean }) {
  if (isAnchor) return <span className="badge anchor">锚点</span>;
  if (!w.connected) return <span className="badge unknown">无法定时</span>;
  if (w.earliest !== null && w.latest !== null) return <span className="badge ok">可定时</span>;
  return <span className="badge partial">部分可定时</span>;
}

export default function WindowsTable({ windows, anchorEvent, anchorTime }: Props) {
  const rows = [...windows.entries()].sort((a, b) => {
    if (a[0] === anchorEvent) return -1;
    if (b[0] === anchorEvent) return 1;
    const ea = a[1].earliest ?? Number.POSITIVE_INFINITY;
    const eb = b[1].earliest ?? Number.POSITIVE_INFINITY;
    return ea - eb;
  });

  return (
    <div className="card">
      <h2>事件时间窗（相对锚点）</h2>
      <table className="windows">
        <thead>
          <tr>
            <th>事件</th>
            <th>最早时间</th>
            <th>最晚时间</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([name, w]) => {
            const isAnchor = name === anchorEvent;
            return (
              <tr key={name} className={isAnchor ? 'anchor-row' : w.connected ? '' : 'unknown-row'}>
                <td className="event-name">{name}</td>
                {w.connected ? (
                  <>
                    <td>
                      <BoundCell offset={w.earliest} anchorTime={anchorTime} />
                    </td>
                    <td>
                      <BoundCell offset={w.latest} anchorTime={anchorTime} />
                    </td>
                  </>
                ) : (
                  <td colSpan={2} className="muted">
                    与锚点事件在约束图中不连通，无法推算时间
                  </td>
                )}
                <td>
                  <Badge w={w} isAnchor={isAnchor} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
