/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `DiscordUser` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `DiscordUser` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "DiscordUser_username_key" ON "DiscordUser"("username");

-- CreateIndex
CREATE UNIQUE INDEX "DiscordUser_email_key" ON "DiscordUser"("email");
