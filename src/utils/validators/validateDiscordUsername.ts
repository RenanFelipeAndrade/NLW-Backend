export function validateDiscordUsername(discord: string) {
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
