import { PrismaClient } from "@prisma/client";
import express from "express";
import { convertHoursStringToMinutes } from "./utils/convertHoursStringToMinutes";
import { convertMinutesToHourString } from "./utils/convertMinutesToHourString";
import cors from "cors";

const app = express();
const prisma = new PrismaClient();

app.use(cors());

interface AdBody {
  name: string;
  yearsPlaying: number;
  discord: string;
  weekDays: number[] | string[];
  hoursStart: string;
  hoursEnd: string;
  useVoiceChannel: boolean;
}

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
  const ad = await prisma.ad.create({
    data: {
      gameId,
      name: body.name,
      weekDays: body.weekDays.join(","),
      discord: body.discord,
      hourEnd: convertHoursStringToMinutes(body.hoursEnd),
      hoursStart: convertHoursStringToMinutes(body.hoursStart),
      useVoiceChannel: body.useVoiceChannel,
      yearsPlaying: body.yearsPlaying,
    },
  });
  return response.json(ad);
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
      hourEnd: true,
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
        hourEnd: convertMinutesToHourString(ad.hourEnd),
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
