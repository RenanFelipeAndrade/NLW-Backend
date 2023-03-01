import { NextFunction } from "express";
import { axiosInstance } from "../global/axios";
import prisma from "../global/prismaClient";

const clientSecret = process.env.TWITCH_CLIENT_SECRET;
const clientId = process.env.TWITCH_CLIENT_ID;

interface Token {
  access_token: string;
  expires_in: number;
  token_type: string;
}

async function getTokenFromApi() {
  return await axiosInstance
    .post(`https://id.twitch.tv/oauth2/token`, {
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    })
    .then((response) => response);
}

async function saveTokenInDb(token: Token) {
  return prisma.twitchAuth.create({
    data: {
      accessToken: token.access_token,
      expiresIn: token.expires_in,
      tokenType: token.token_type,
    },
  });
}

export async function validAccessToken(
  request: Express.Request,
  response: Express.Response,
  next: NextFunction
) {
  try {
    const tokenInDb = await prisma.twitchAuth.findFirst({});
    const isTokenExpired =
      tokenInDb !== null && tokenInDb.expiresIn < Math.floor(Date.now() / 1000);

    if (!isTokenExpired && tokenInDb) {
      axiosInstance.defaults.headers.common = {
        // unecessary optional chainning
        Authorization: `Bearer ${tokenInDb.accessToken}`,
        "Client-Id": clientId ? clientId : false,
      };
      next();
      return;
    }

    if (isTokenExpired) await prisma.twitchAuth.deleteMany();

    const response = await getTokenFromApi();
    const token = await saveTokenInDb(response.data);
    axiosInstance.defaults.headers.common = {
      // unecessary optional chainning
      Authorization: `Bearer ${token.accessToken}`,
      "Client-Id": clientId ? clientId : false,
    };

    next();
  } catch (error) {
    console.log(error);
    return null;
  }
}
