/*
  Warnings:

  - You are about to drop the column `token_type` on the `TwitchAuth` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TwitchAuth" (
    "accessToken" TEXT NOT NULL PRIMARY KEY,
    "expiresIn" INTEGER NOT NULL,
    "tokenType" TEXT NOT NULL DEFAULT 'Bearer'
);
INSERT INTO "new_TwitchAuth" ("accessToken", "expiresIn") SELECT "accessToken", "expiresIn" FROM "TwitchAuth";
DROP TABLE "TwitchAuth";
ALTER TABLE "new_TwitchAuth" RENAME TO "TwitchAuth";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
