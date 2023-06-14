export function validateWeekDays(weekDays: Array<number>) {
  const validDays = [0, 1, 2, 3, 4, 5, 6];
  weekDays.forEach((day) => {
    if (!validDays.includes(day))
      throw { message: "The day must be a string number between 0 and 6" };
  });
  return weekDays;
}
