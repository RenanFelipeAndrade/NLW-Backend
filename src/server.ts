import express from "express";
import { convertHoursStringToMinutes } from "./utils/convertHoursStringToMinutes";
import { convertMinutesToHourString } from "./utils/convertMinutesToHourString";
import cors from "cors";
import { AdBody } from "./@types/AdBody";
import { validateAd } from "./utils/validate";
import { ZodError } from "zod";
import prisma from "./global/prismaClient";
import { validAccessToken } from "./middleware/validAccessToken";
import { axiosInstance } from "./global/axios";
import { AxiosResponse } from "axios";

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
    .get("https://api.twitch.tv/helix/games/top")
    .then((res) => res)
    .catch((error) => {
      console.log(error);
      return error;
    });
  const topGames: TopGamesData = twitchApiCall.data;

  // creates a array of game ids
  const gamesIds = topGames.data.reduce(
    (previousGame, currentGame) => [...previousGame, currentGame.id],
    [topGames.data.shift()!.id]
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

app.listen(8000);
