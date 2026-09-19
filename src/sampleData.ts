import type { Constraint, Relation } from './types';
import { newId } from './utils';

export interface Sample {
  anchorEvent: string;
  constraints: Constraint[];
}

function c(a: string, b: string, relation: Relation, min: number, max: number): Constraint {
  return { id: newId(), a, b, relation, minMinutes: min, maxMinutes: max };
}

/** 事故复盘示例：约束互相兼容 */
export function satisfiableSample(): Sample {
  return {
    anchorEvent: '报警触发',
    constraints: [
      c('值班员接警', '报警触发', 'after', 2, 5),
      c('现场断电', '值班员接警', 'after', 1, 3),
      c('消防到场', '报警触发', 'after', 8, 15),
      c('疏散完成', '现场断电', 'after', 4, 8),
      c('上报主管', '消防到场', 'after', 5, 10),
      c('媒体通报', '上报主管', 'after', 30, 60),
    ],
  };
}

/** 口供冲突示例：「现场断电 比 值班员接警 晚 2~4 分钟」与「现场断电 比 报警触发 晚 1~3 分钟」矛盾 */
export function contradictorySample(): Sample {
  return {
    anchorEvent: '报警触发',
    constraints: [
      c('值班员接警', '报警触发', 'after', 2, 5),
      c('现场断电', '值班员接警', 'after', 2, 4),
      c('现场断电', '报警触发', 'after', 1, 3),
      c('消防到场', '报警触发', 'after', 6, 10),
    ],
  };
}
