import { appId, dictators, isDictatorModeOn } from "../../config.ts";
import { InteractingMember, InteractionData } from "../../types.ts";

export const setBatchSlashCommands = [
  {
    name: "set_batch",
    type: 1,
    description: "Set a batch serial number for a user",
    options: [
      {
        required: true,
        type: 3,
        name: "token",
        description: "User Access Token",
      },
      {
        required: true,
        type: 4,
        name: "batch",
        description: "Batch number",
      },
    ],
  },
];

export const setBatchSlashCommandResponse = async (
  data: InteractionData,
  member: InteractingMember,
) => {
  if (!isDictatorModeOn || !dictators?.includes(member?.user?.id)) {
    return {
      type: 4,
      data: {
        content: "You can't perform this action.",
      },
    };
  }

  console.log(JSON.stringify(data));

  // GET/PUT /users/@me/applications/:id/role-connection
  const url = `https://discord.com/api/v10/users/@me/applications/${appId!}/role-connection`;
  const accessToken =
    "options" in data && data.options && (data.options[0].value as string);
  const body = {
    platform_name: "Lab Bot",
    metadata: {
      batch:
        "options" in data && data.options && (data.options[1].value as number),
    },
  };

  const response = await fetch(url, {
    method: "PUT",
    body: JSON.stringify(body),
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    console.log(
      `Error pushing discord metadata: [${response.status}] ${response.statusText}`,
    );

    return {
      type: 4,
      data: {
        content: "Error!",
        flags: 1 << 6,
      },
    };
  }

  console.log(await response.text());

  return {
    type: 4,
    data: {
      content: "Done!",
      flags: 1 << 6,
    },
  };
};
