import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { NextFunction, Request, Response } from "express";
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
  _request: Request,
  response: Response,
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

    if (isTokenExpired)
      await prisma.twitchAuth
        .delete({
          where: { accessToken: tokenInDb.accessToken },
        })
        .catch((error: unknown) => {
          if (
            error! instanceof PrismaClientKnownRequestError &&
            // if token does not exist in db
            error.code !== "P2025"
          ) {
            console.log(error);
          }
        });

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
    return response
      .status(500)
      .send("It was not possible to communicate with Twitch");
  }
}
