import { z } from "zod";
import { AdBody } from "../@types/AdBody";

function validateWeekDays(weekDays: Array<number>) {
  const validDays = [0, 1, 2, 3, 4, 5, 6];
  return weekDays.forEach((day) => {
    if (!validDays.includes(day))
      throw { message: "The day must be a string number between 0 and 6" };
  });
}

function validateDiscord(discord: string) {
  if (!discord.includes("#"))
    throw { message: "Insert a valid discord username" };

  const discordParts = discord.split("#");
  const userNumber = discordParts[1].split("").map(Number);

  if (userNumber.length !== 4 || userNumber.includes(NaN))
    throw { message: "Insert a valid discord username" };

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
    discord: validateDiscord(validEntries.discord),
    weekDays: validateWeekDays(validEntries.weekDays),
  };

  return validBody;
}
