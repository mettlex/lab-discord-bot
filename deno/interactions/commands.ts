import { appId, headers } from "./config.ts";
import { afkAppCommands } from "./afk/mod.ts";
import { runTsAppCommands, runTsSlashCommands } from "./run_typescript/mod.ts";
import { sleep } from "./utils.ts";

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

const createCommands = async ({ guildId }: CreateCommandsParams) => {
  const commandUrl = `https://discord.com/api/v10/applications/${appId}/guilds/${guildId}/commands`;

  const commands = [
    ...afkAppCommands,
    ...runTsSlashCommands,
    ...runTsAppCommands,
  ];

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

    await sleep(4000);
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
