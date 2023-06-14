export function validateStringHours(hourInString: string) {
  if (!hourInString.includes(":"))
    throw { message: "Insert a valid hour. Missing a :" };

  const hourParts = hourInString.split(":");

  if (
    // if there are hours and minutes, and both are 2 digits
    hourParts.length !== 2 ||
    hourParts[0].length !== 2 ||
    hourParts[1].length !== 2
  )
    throw { message: "Insert a valid hour. Expected hh:mm" };

  const [hours, minutes] = hourParts.map(Number);

  if (minutes >= 60 || minutes < 0 || hours >= 24 || hours < 0)
    throw {
      message: "Insert a valid hour",
    };
  return hourInString;
}
