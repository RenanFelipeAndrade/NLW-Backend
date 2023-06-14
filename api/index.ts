import express from "express";
import { convertHoursStringToMinutes } from "../src/utils/convertHoursStringToMinutes";
import { convertMinutesToHourString } from "../src/utils/convertMinutesToHourString";
import cors from "cors";
import { AdBody } from "../src/types/AdBody";
import { validateAd } from "../src/utils/validateAd";
import { ZodError } from "zod";
import prisma from "../src/global/prismaClient";
import { validAccessToken } from "../src/middleware/validAccessToken";
import { axiosInstance } from "../src/global/axios";
import { AxiosResponse } from "axios";
import { validateUser } from "../src/utils/validateUser";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { DiscordUser } from "@prisma/client";

const app = express();
app.use(cors());
app.use(express.json());
app.use(validAccessToken);

interface TwitchGame {
  id: string;
  name: string;
  box_art_url: string;
  ads: number;
}
interface TopGamesData {
  data: TwitchGame[];
  pagination: {
    cursor: string;
  };
}

app.get("/games", validAccessToken, async (_request, response) => {
  // top twitch games
  const twitchApiCall: AxiosResponse = await axiosInstance
    .get("/games/top?first=12")
    .then((res) => res)
    .catch((error) => {
      console.log(error);
      return error;
    });
  const topGames: TopGamesData = twitchApiCall.data;

  if (topGames.data.length === 0)
    return response.status(400).send("No games were available");

  // creates a array of game ids
  const gamesIds = topGames.data.reduce(
    (previousGame, currentGame) => [...previousGame, currentGame.id],
    [topGames.data[0].id]
  );

  // find games registered in db, get the ads counter
  const games = await prisma.game.findMany({
    where: {
      id: { in: gamesIds },
    },
    include: {
      _count: {
        select: {
          ads: true,
        },
      },
    },
  });
  // put the ads counter in top games array
  const topGamesAndAds = topGames.data.map((game) => {
    const ads = games.find((gameInDb) => gameInDb.id === game.id);
    if (ads) {
      game.ads = ads._count.ads;
    } else {
      game.ads = 0;
    }
    return game;
  });

  return response.json(topGamesAndAds);
});

app.post("/games/:id/ads", async (request, response) => {
  const gameId = request.params.id;
  const body: AdBody = request.body;

  try {
    const validatedAd = validateAd(body);
    const isUserRegistered = await prisma.discordUser.findUnique({
      where: { id: validatedAd.discord },
    });

    if (!isUserRegistered)
      return response.status(400).send("The discord user does not exist");

    const gameInDb = await prisma.game.findUnique({ where: { id: gameId } });

    if (gameInDb === null)
      // register the game if it doesn't exist
      await prisma.game.create({
        data: {
          id: gameId,
        },
      });

    const ad = await prisma.ad.create({
      data: {
        gameId,
        name: validatedAd.name,
        weekDays: validatedAd.weekDays.join(","),
        discord: validatedAd.discord,
        hoursEnd: convertHoursStringToMinutes(validatedAd.hoursEnd),
        hoursStart: convertHoursStringToMinutes(validatedAd.hoursStart),
        useVoiceChannel: validatedAd.useVoiceChannel,
        yearsPlaying: validatedAd.yearsPlaying,
      },
    });

    return response.status(201).json(ad);
  } catch (error) {
    if (error instanceof ZodError) {
      return response.status(400).json(error.issues);
    }
    if (error instanceof PrismaClientKnownRequestError) {
      return response
        .status(400)
        .json({ message: error.message, name: error.name, code: error.code });
    }
    return response.status(400).json(error);
  }
});

app.get("/games/:id/ads", async (request, response) => {
  const gameId: string = request.params.id;
  // get all ads in db
  const ads = await prisma.ad.findMany({
    select: {
      id: true,
      name: true,
      weekDays: true,
      useVoiceChannel: true,
      yearsPlaying: true,
      hoursStart: true,
      hoursEnd: true,
    },
    where: {
      gameId: gameId,
    },
    orderBy: { createdAt: "desc" },
  });

  return response.json(
    ads.map((ad) => {
      return {
        ...ad,
        hoursEnd: convertMinutesToHourString(ad.hoursEnd), // hh:mm
        hoursStart: convertMinutesToHourString(ad.hoursStart), // hh:mm
        weekDays: ad.weekDays.split(","),
      };
    })
  );
});

app.get("/ads/:id/discord", validAccessToken, async (request, response) => {
  const adId = request.params.id;
  // find discord id in the ad
  const ad = await prisma.ad.findUniqueOrThrow({
    select: {
      discord: true,
    },
    where: {
      id: adId,
    },
  });
  return response.json({
    discord: ad.discord,
  });
});

app.post("/users", async (request, response) => {
  const userInfo: DiscordUser = request.body;
  try {
    const validUser = validateUser(userInfo);
    const user = await prisma.discordUser.create({
      data: {
        id: validUser.id,
        name: validUser.name,
        username: validUser.username,
        email: validUser.email,
        image: validUser.image,
      },
    });
    return response.status(201).json(user);
  } catch (error) {
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const user = await prisma.discordUser.findUnique({
        where: { id: userInfo.id },
      });
      return response.status(200).json(user);
    }
    if (error instanceof ZodError) {
      return response.status(400).json(error.issues);
    }
    console.log(error);
    return response.status(500).json(error);
  }
});

app.listen(8000);
