export const tsRateLimit: {
  [key: string]: {
    requests: number;
    lastRequestAt: ReturnType<typeof Date.now>;
  };
} = {};
