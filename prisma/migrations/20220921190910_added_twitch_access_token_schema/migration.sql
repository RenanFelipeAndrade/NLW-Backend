-- CreateTable
CREATE TABLE "TwitchAuth" (
    "accessToken" TEXT NOT NULL PRIMARY KEY,
    "expiresIn" INTEGER NOT NULL,
    "token_type" TEXT NOT NULL DEFAULT 'Bearer'
);
