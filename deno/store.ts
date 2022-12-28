import { Tokens } from "./types.ts";

export const tsRateLimit: {
  [key: string]: {
    requests: number;
    lastRequestAt: ReturnType<typeof Date.now>;
  };
} = {};

const tokenStore = new Map<string, Tokens>();

export function storeDiscordTokens(userId: string, tokens: Tokens) {
  tokenStore.set(`discord-${userId}`, tokens);
}

export function getDiscordTokens(userId: string) {
  return tokenStore.get(`discord-${userId}`);
}
