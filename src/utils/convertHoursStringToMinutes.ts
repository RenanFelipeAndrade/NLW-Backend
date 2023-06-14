export function convertHoursStringToMinutes(hoursString: string): number {
  const [hours, minutes] = hoursString.split(":").map(Number);
  return hours * 60 + minutes;
}
