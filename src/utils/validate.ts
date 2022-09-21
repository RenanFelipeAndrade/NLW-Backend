import { z } from "zod";
import { AdBody } from "../@types/AdBody";

function validateStringHours(hourInString: string) {
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

function validateWeekDays(weekDays: Array<number>) {
  const validDays = [0, 1, 2, 3, 4, 5, 6];
  weekDays.forEach((day) => {
    if (!validDays.includes(day))
      throw { message: "The day must be a string number between 0 and 6" };
  });
  return weekDays;
}

function validateDiscord(discord: string) {
  if (!discord.includes("#"))
    throw { message: "Insert a valid discord username. Missing a #" };

  const discordParts = discord.split("#");
  const userNumber = discordParts[1].split("").map(Number);

  if (userNumber.length !== 4 || userNumber.includes(NaN))
    throw {
      message: "Insert a discord username. The digits are invalid",
    };

  return discord;
}

export function validateAd(body: AdBody) {
  const validBodySchema = z.object({
    name: z.string(),
    discord: z.string(),
    useVoiceChannel: z.boolean(),
    yearsPlaying: z.number(),
    hoursEnd: z.string(),
    hoursStart: z.string(),
    weekDays: z.array(z.number()).nonempty().max(7),
  });

  const validEntries = validBodySchema.parse(body);
  const validBody = {
    ...validEntries,
    hoursStart: validateStringHours(validEntries.hoursStart),
    hoursEnd: validateStringHours(validEntries.hoursEnd),
    discord: validateDiscord(validEntries.discord),
    weekDays: validateWeekDays(validEntries.weekDays),
  };

  return validBody;
}
