import { headers } from "../../config.ts";
import { InteractingMember, WebHook } from "../../types.ts";

export type Emoji = { n: string; c: string };

export const sendEmoji = async ({
  emoji,
  member,
  channel_id,
}: {
  emoji: Emoji;
  member: InteractingMember;
  channel_id: string;
}) => {
  let foundWebhook: WebHook | undefined;

  try {
    const response = await fetch(
      `https://discord.com/api/channels/${channel_id}/webhooks`,
      {
        method: "GET",
        headers,
      },
    );

    const webhooks = (await response.json()) as WebHook[];

    if (webhooks instanceof Array) {
      foundWebhook = webhooks.find((x) => x.token);
    }
  } catch (e) {
    console.error(e);
  }

  if (!foundWebhook) {
    return false;
  }

  try {
    const r = await fetch(
      `https://discord.com/api/webhooks/${foundWebhook.id}/${foundWebhook.token}`,
      {
        method: "POST",
        body: JSON.stringify({
          content: `<${emoji.c.includes(".gif") ? "a" : ""}${emoji.n}${emoji.c
            .replace(/.+emojis\//g, "")
            .replace(/\..+/g, "")}>`,
          username: member.nick ? member.nick : member.user.username,
          avatar_url: `https://cdn.discordapp.com/avatars/${member.user.id}/${
            member.avatar ? member.avatar : member.user.avatar
          }`,
        }),
        headers: {
          "content-type": "application/json",
        },
      },
    );
    console.log(await r.text());

    return true;
  } catch (e) {
    console.error(e);
  }

  return false;
};
