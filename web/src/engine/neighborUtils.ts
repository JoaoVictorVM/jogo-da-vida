export const NEIGHBOR_OFFSETS: readonly (readonly [number, number])[] = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
];

export function countLiveNeighbors(
  x: number,
  y: number,
  isAlive: (x: number, y: number) => boolean,
): number {
  let count = 0;
  for (const [dx, dy] of NEIGHBOR_OFFSETS) {
    if (isAlive(x + dx, y + dy)) {
      count += 1;
    }
  }
  return count;
}

export function survives(alive: boolean, liveNeighbors: number): boolean {
  return alive ? liveNeighbors === 2 || liveNeighbors === 3 : liveNeighbors === 3;
}
