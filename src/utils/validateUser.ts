import { z } from "zod";
import { DiscordUser } from "../types/DiscordUser";
import { validateDiscordUsername } from "./validators/validateDiscordUsername";
import { validateEmail } from "./validators/validateEmail";

export function validateUser(userInfo: DiscordUser) {
  const validUserSchema = z.object({
    id: z.string(),
    name: z.string(),
    username: z.string(),
    email: z.string(),
    image: z.string(),
  });
  const validEntries = validUserSchema.parse(userInfo);

  const validUserInfo = {
    ...validEntries,
    username: validateDiscordUsername(validEntries.username),
    email: validateEmail(validEntries.email),
  };
  return validUserInfo;
}
