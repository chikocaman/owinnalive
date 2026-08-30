export function canStartRefresh(inFlight: boolean): boolean {
  return !inFlight;
}
