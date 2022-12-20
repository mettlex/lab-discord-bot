import { tsOverHttpUrl } from "../config.ts";
import { InteractionData } from "../types.ts";

export const runTsSlashCommands = [
  {
    name: "run_ts",
    type: 1,
    description:
      "Send TypeScript or JavaScript code and receive the console output.",
  },
  {
    name: "run_typescript",
    type: 1,
    description:
      "Send TypeScript or JavaScript code and receive the console output.",
  },
];

export const sendTsCodeOutput = async (data: InteractionData) => {
  if (!("custom_id" in data)) {
    return {
      type: 4,
      data: {
        content: `Invalid Data.`,
        flags: 1 << 6,
      },
    };
  }

  const code = data.components[0].components[0].value;

  let result = "";

  try {
    result = await fetch(tsOverHttpUrl, {
      method: "POST",
      body: JSON.stringify({
        code,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    }).then(async (r) => {
      const text = await r.text().catch((_) => "");

      if (text.includes(`"message"`)) {
        try {
          return JSON.parse(text).message;
        } catch (_error) {
          return text;
        }
      } else {
        return text;
      }
    });
  } catch (error) {
    console.error(error);
    result = (error as Error).message;
  }

  return {
    type: 4,
    data: {
      content: `Code:\n\`\`\`ts\n${code}\n\`\`\`\nOutput:\n\`\`\`\n${result}\n\`\`\``,
    },
  };
};

export const runTsSlashCommandResponse = () => {
  return {
    type: 9,
    data: {
      title: "TypeScript or JavaScript",
      custom_id: "ts_code",
      components: [
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: "code",
              label: "Code",
              style: 2,
              min_length: 1,
              max_length: 1000,
              placeholder:
                "// write code here\n// include at least one console.log",
              required: true,
            },
          ],
        },
      ],
    },
  };
};
