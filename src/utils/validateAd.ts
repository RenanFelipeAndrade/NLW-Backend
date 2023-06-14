import { z } from "zod";
import { AdBody } from "../types/AdBody";
import { validateDiscordUsername } from "./validators/validateDiscordUsername";
import { validateStringHours } from "./validators/validateStringHours";
import { validateWeekDays } from "./validators/validateWeekDays";

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
    discord: validateDiscordUsername(validEntries.discord),
    weekDays: validateWeekDays(validEntries.weekDays),
  };

  return validBody;
}
