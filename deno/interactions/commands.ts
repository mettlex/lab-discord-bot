import "https://deno.land/x/dotenv@v3.2.0/load.ts";
import { afkAppCommands } from "./afk/mod.ts";

type Guild = {
  id: string;
  name: string;
  icon: string;
  owner: boolean;
  permissions: string;
  features: string[];
};

type CreateCommandsParams = {
  guildId: string;
};

const appId = Deno.env.get("DISCORD_CLIENT_ID");
const token = Deno.env.get("DISCORD_BOT_TOKEN");

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bot ${token}`,
};

const createCommands = async ({ guildId }: CreateCommandsParams) => {
  const commandUrl = `https://discord.com/api/v10/applications/${appId}/guilds/${guildId}/commands`;

  const commands = [...afkAppCommands];

  for (const command of commands) {
    const body = JSON.stringify(command);

    const response = await fetch(commandUrl, {
      method: "POST",
      headers,
      body,
    })
      .then((res) => res.text())
      .catch((e) => {
        console.error(e);
        return null;
      });

    console.log(guildId, response);
  }
};

const run = async () => {
  const getGuildsUrl = "https://discord.com/api/v10/users/@me/guilds";

  const guilds = await fetch(getGuildsUrl, {
    method: "GET",
    headers,
  })
    .then((res) => res.json() as Promise<Guild[]>)
    .catch((e) => {
      console.error(e);
      return null;
    });

  if (!guilds) return;

  for (const guild of guilds) {
    await createCommands({ guildId: guild.id });
  }
};

run();
