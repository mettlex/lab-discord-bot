import { tsOverHttpUrl } from "../config.ts";
import { InteractionData } from "../types.ts";

export const runTsAppCommands = [
  {
    type: 2,
    name: "Run TypeScript",
  },
  {
    type: 3,
    name: "Run TypeScript",
  },
];

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

export const sendTsCodeOutput = async (
  data: InteractionData,
  state?: {
    code: string;
    logPrefix: string;
    promptValue: string;
    promptSkips: number;
  },
) => {
  if (!("custom_id" in data)) {
    return {
      type: 4,
      data: {
        content: `Invalid Data.`,
        flags: 1 << 6,
      },
    };
  }

  const code = state?.code || data.components[0].components[0].value;

  let result = "";

  const bodyWithState = state
    ? JSON.stringify({
        code: code.toString(),
        state: {
          logPrefix: "",
          promptValue: state.promptValue,
          promptSkips: state.promptSkips,
        },
      })
    : "";

  console.log(bodyWithState);

  try {
    result = await fetch(tsOverHttpUrl, {
      method: "POST",
      body: state ? bodyWithState : `{"code": "${encodeURIComponent(code)}"}`,
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

  if (
    result.includes(`{"state":{`) &&
    result.trim().endsWith("}") &&
    result.includes("prompt")
  ) {
    const lastLine = result.trim().split("\n").slice(-1)[0];
    const { state: parsedState } = JSON.parse(lastLine) as {
      state: { prompt: { title: string; count: number } };
    };

    const logPrefix = result.replace(lastLine, "");

    return {
      type: 4,
      data: {
        content: `Code:\n\`\`\`ts\n${code}\`\`\`\nLog:\n${
          logPrefix.length > 0 ? `\`\`\`${logPrefix}\`\`\`\n` : ""
        }${parsedState.prompt.title}`,
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                label: "Open Prompt",
                style: 1,
                custom_id: `button_prompt_${
                  state?.promptSkips || parsedState.prompt.count
                }`,
              },
            ],
          },
        ],
      },
    };
  }

  return {
    type: 4,
    data: {
      content: `Code:\n\`\`\`ts\n${code}\n\`\`\`\nOutput:\n\`\`\`\n${result.replace(
        `[0m[1m[31merror[0m: `,
        "error: ",
      )}\n\`\`\``,
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
