import { Emoji, sendEmoji } from "../../lib/discord-emojis/mod.ts";
import { InteractingMember, InteractionData } from "../../types.ts";

const __dirname = new URL(".", import.meta.url).pathname;

const decoder = new TextDecoder("utf-8");

let emojis: Emoji[] | undefined;

if (typeof Deno.readFileSync === "function") {
  const data = Deno.readFileSync(
    `${__dirname}../../lib/discord-emojis/uniques.json`,
  );

  const content = decoder.decode(data);

  emojis = JSON.parse(content);
}

export const emojiAppCommands = [
  // {
  //   type: 2,
  //   name: "Emoji - Get Link",
  // },
  // {
  //   type: 3,
  //   name: "Emoji - Get Link",
  // },
];

export const emojiSlashCommands = [
  {
    name: "emoji_get_link",
    type: 1,
    description: "Get emoji link from the collection by giving an emoji name.",
    options: [
      {
        required: true,
        type: 3,
        name: "emoji_name",
        description: "Name to search without : colon",
      },
    ],
  },
  {
    name: "emoji_send_single",
    type: 1,
    description: "Send the emoji from the collection by giving an emoji name.",
    options: [
      {
        required: true,
        type: 3,
        name: "emoji_name",
        description: "Name to search without : colon",
      },
    ],
  },
];

export const sendEmojiSlashCommand = async (
  data: InteractionData,
  member: InteractingMember,
  channel_id: string,
) => {
  const name =
    "options" in data && data.options && (data.options[0].value as string);

  if (!name || !emojis) {
    return {
      type: 4,
      data: {
        content: "No emoji found!",
        flags: 1 << 6,
      },
    };
  }

  const foundEmoji = emojis.find(
    (x) =>
      x.n.toLowerCase().replace(/:/g, "") ===
      name.replace(/:/g, "").toLowerCase(),
  );

  if (foundEmoji) {
    const response = await sendEmoji({ emoji: foundEmoji, channel_id, member });

    if (response) {
      return {
        type: 4,
        data: {
          content: `Found **${foundEmoji.n}** emoji. It's gonna be sent.`,
          flags: 1 << 6,
        },
      };
    } else {
      return {
        type: 4,
        data: {
          content: `No webhook found! Ask the server manager to create a channel webhook.`,
          flags: 1 << 6,
        },
      };
    }
  }

  return {
    type: 4,
    data: {
      content: "No emoji found!",
      flags: 1 << 6,
    },
  };
};

export const setEmojiGetLinkSlashCommandResponse = (
  data: InteractionData,
  _member: InteractingMember,
) => {
  const name =
    "options" in data && data.options && (data.options[0].value as string);

  if (!name || !emojis) {
    return {
      type: 4,
      data: {
        content: "No emoji found!",
        flags: 1 << 6,
      },
    };
  }

  const foundEmoji = emojis.find(
    (x) =>
      x.n.toLowerCase().replace(/:/g, "") ===
      name.replace(/:/g, "").toLowerCase(),
  );

  if (foundEmoji) {
    return {
      type: 4,
      data: {
        content: `\`\`\`\n${foundEmoji.c}\n\`\`\``,
        flags: 1 << 6,
      },
    };
  }

  return {
    type: 4,
    data: {
      content: "No emoji found!",
      flags: 1 << 6,
    },
  };
};
