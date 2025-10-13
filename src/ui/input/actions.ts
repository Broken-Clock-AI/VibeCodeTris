// src/ui/input/actions.ts
export type GameAction =
    | 'moveLeft'
    | 'moveLeft_release'
    | 'moveRight'
    | 'moveRight_release'
    | 'softDrop'
    | 'softDrop_release'
    | 'hardDrop'
    | 'rotateCW'
    | 'rotateCCW'
    | 'hold'
    | { type: 'setTimings', das: number, arr: number };
