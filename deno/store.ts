import { SurprisinglyPopularVotingData, Tokens } from "./types.ts";

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

export const spStore = new Map<string, SurprisinglyPopularVotingData | undefined>();

export function storeSpData(
  id: string,
  data: SurprisinglyPopularVotingData | undefined,
) {
  spStore.set(`discord-sp-${id}`, data);
}

export function getSpData(id: string) {
  return spStore.get(`discord-sp-${id}`);
}
