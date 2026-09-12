/** Shared BaZi/Ziwei step size, using the chart's virtual hour rather than its input clock. */
export function birthHourShiftMinutes(direction, virtualHour, ratHourMode) {
  const splitRatHour = ratHourMode === 'current-day' || ratHourMode === 'current-day-tomorrow-stem';
  if (!splitRatHour || virtualHour === undefined) return direction * 120;
  const oneHourBoundary = direction > 0
    ? [22, 23, 0].includes(virtualHour)
    : [23, 0, 1].includes(virtualHour);
  return direction * (oneHourBoundary ? 60 : 120);
}
