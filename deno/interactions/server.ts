import "https://deno.land/x/dotenv@v3.2.0/load.ts";
import nacl from "https://cdn.skypack.dev/tweetnacl@@1.0.3?dts";
import {
  json,
  serve,
  validateRequest,
} from "https://deno.land/x/sift@0.6.0/mod.ts";
import { hexToUint8Array } from "./utils.ts";
import { afkAppCommandResponse } from "./afk/mod.ts";
import { InteractingMember, InteractionData } from "./types.ts";
import { PUBLIC_KEY } from "./config.ts";

serve(
  {
    "/": home,
  },
  {
    port: +(Deno.env.get("PORT") || "5000"),
  },
);

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
  } = JSON.parse(body) as {
    type: number;
    data: InteractionData;
    member: InteractingMember;
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
    if (data.name.includes("AFK")) {
      return json(afkAppCommandResponse({ data, member }));
    }

    return json({
      // Type 4 responds with the below message retaining the user's
      // input at the top.
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
    hexToUint8Array(PUBLIC_KEY),
  );

  return { valid, body };
}
