import { InteractionData } from "../types.ts";

export const afkAppCommands = [
  {
    type: 2,
    name: "AFK On",
  },
  {
    type: 2,
    name: "AFK Off",
  },
];

const token = Deno.env.get("DISCORD_BOT_TOKEN");

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bot ${token}`,
};

const prefix = `[AFK] `;

const makeUserAfk = async (data: InteractionData) => {
  const user = Object.values(data.resolved.users)[0];

  const url = `https://discord.com/api/v10/guilds/${data.guild_id}/members/${user.id}`;

  const member =
    (data.resolved.members &&
      Object.keys(data.resolved.members).length > 0 &&
      Object.values(data.resolved.members)[0]) ||
    null;

  const body = JSON.stringify({
    nick: `${prefix}${member?.nick ? member?.nick : user.username}`,
  });

  const response = await fetch(url, {
    method: "PATCH",
    headers,
    body,
  })
    .then((res) => res.text())
    .catch((e) => {
      console.error(e);
      return null;
    });

  console.log(response);
};

const removeAfk = async (data: InteractionData) => {
  const user = Object.values(data.resolved.users)[0];

  const url = `https://discord.com/api/v10/guilds/${data.guild_id}/members/${user.id}`;

  const member =
    (data.resolved.members &&
      Object.keys(data.resolved.members).length > 0 &&
      Object.values(data.resolved.members)[0]) ||
    null;

  const body = JSON.stringify({
    nick: `${member?.nick ? member?.nick : user.username}`.replace(prefix, ""),
  });

  const response = await fetch(url, {
    method: "PATCH",
    headers,
    body,
  })
    .then((res) => res.text())
    .catch((e) => {
      console.error(e);
      return null;
    });

  console.log(response);
};

export const afkAppCommandResponse = (data: InteractionData) => {
  if (data.name.toLocaleLowerCase().includes("on")) {
    makeUserAfk(data);

    return {
      type: 4,
      data: {
        content: `Your nickname has AFK now.`,
        flags: 1 << 6,
      },
    };
  } else if (data.name.toLocaleLowerCase().includes("off")) {
    removeAfk(data);

    return {
      type: 4,
      data: {
        content: `AFK has been removed now.`,
        flags: 1 << 6,
      },
    };
  }
};
