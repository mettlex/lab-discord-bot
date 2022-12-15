import { dictators, headers, isDictatorModeOn } from "../config.ts";
import { InteractingMember, InteractionData } from "../types.ts";

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

const prefix = `[AFK] `;

const makeUserAfk = async (data: InteractionData) => {
  const user = Object.values(data.resolved.users)[0];

  const member =
    (data.resolved.members &&
      Object.keys(data.resolved.members).length > 0 &&
      Object.values(data.resolved.members)[0]) ||
    null;

  const name = member?.nick ? member?.nick : user.username;

  if (name.startsWith(prefix)) {
    return;
  }

  const body = JSON.stringify({
    nick: `${prefix}${name}`,
  });

  const url = `https://discord.com/api/v10/guilds/${data.guild_id}/members/${user.id}`;

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

  const member =
    (data.resolved.members &&
      Object.keys(data.resolved.members).length > 0 &&
      Object.values(data.resolved.members)[0]) ||
    null;

  const name = member?.nick ? member?.nick : user.username;

  if (!name.startsWith(prefix)) {
    return;
  }

  const body = JSON.stringify({
    nick: `${name}`.replace(prefix, ""),
  });

  const url = `https://discord.com/api/v10/guilds/${data.guild_id}/members/${user.id}`;

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

export const afkAppCommandResponse = ({
  data,
  member,
}: {
  data: InteractionData;
  member: InteractingMember;
}) => {
  if (data.name.toLocaleLowerCase().includes("on")) {
    if (!hasPermission({ data, member })) {
      return {
        type: 4,
        data: {
          content: `You don't have the permission to do it.`,
          flags: 1 << 6,
        },
      };
    }

    makeUserAfk(data);

    return {
      type: 4,
      data: {
        content: `Your nickname has AFK now.`,
        flags: 1 << 6,
      },
    };
  } else if (data.name.toLocaleLowerCase().includes("off")) {
    if (!hasPermission({ data, member })) {
      return {
        type: 4,
        data: {
          content: `You don't have the permission to do it.`,
          flags: 1 << 6,
        },
      };
    }

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

function hasPermission({
  data,
  member,
}: {
  data: InteractionData;
  member: InteractingMember;
}) {
  if (isDictatorModeOn && dictators?.includes(member?.user?.id)) {
    return true;
  }

  return member?.user?.id === Object.values(data.resolved.users)[0]?.id;
}
