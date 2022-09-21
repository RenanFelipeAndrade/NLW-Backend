import { PrismaClient } from "@prisma/client";
import express from "express";
import { convertHoursStringToMinutes } from "./utils/convertHoursStringToMinutes";
import { convertMinutesToHourString } from "./utils/convertMinutesToHourString";
import cors from "cors";
import { AdBody } from "./@types/AdBody";
import { validateAd } from "./utils/validate";
import { ZodError } from "zod";

const app = express();
const prisma = new PrismaClient();

app.use(cors());

app.use(express.json());

app.get("/games", async (request, response) => {
  const games = await prisma.game.findMany({
    include: {
      _count: {
        select: {
          ads: true,
        },
      },
    },
  });
  return response.json(games);
});

app.post("/games/:id/ads", async (request, response) => {
  const gameId = request.params.id;
  const body: AdBody = request.body;

  try {
    const validatedAd = validateAd(body);
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
        hoursEnd: convertMinutesToHourString(ad.hoursEnd),
        hoursStart: convertMinutesToHourString(ad.hoursStart),
        weekDays: ad.weekDays.split(","),
      };
    })
  );
});

app.get("/ads/:id/discord", async (request, response) => {
  const adId = request.params.id;
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
