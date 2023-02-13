import "https://deno.land/x/dotenv@v3.2.0/load.ts";

export const appId = Deno.env.get("DISCORD_CLIENT_ID");
export const token = Deno.env.get("DISCORD_BOT_TOKEN");
export const clientSecret = Deno.env.get("DISCORD_CLIENT_SECRET");
export const redirectUri = Deno.env.get("DISCORD_REDIRECT_URI");
export const PUBLIC_KEY = Deno.env.get("DISCORD_PUBLIC_KEY");
export const webHookUrlForUserToken = Deno.env.get(
  "DISCORD_WEBHOOK_FOR_USER_TOKEN",
);

export const headers = {
  "Content-Type": "application/json",
  Authorization: `Bot ${token}`,
};

export const isDictatorModeOn = Deno.env.get("DICTATOR_MODE") === "true";

export const dictators = Deno.env
  .get("DICTATORS")
  ?.trim()
  ?.split(",")
  .map((x) => x.trim());

export const tsOverHttpUrl = Deno.env.get("TS_OVER_HTTP_URL") || "";
