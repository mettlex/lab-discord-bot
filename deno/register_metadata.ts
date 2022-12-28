import { appId, token } from "./config.ts";

/**
 * Register the metadata to be stored by Discord. This should be a one time action.
 * Note: uses a Bot token for authentication, not a user token.
 */
const url = `https://discord.com/api/v10/applications/${appId}/role-connections/metadata`;
// supported types: number_lt=1, number_gt=2, number_eq=3 number_neq=4, datetime_lt=5, datetime_gt=6, boolean_eq=7, boolean_neq=8
const body = [
  {
    key: "batch",
    name: "Batch",
    description: "Which batch you belong to",
    type: 3,
  },
];

const response = await fetch(url, {
  method: "PUT",
  body: JSON.stringify(body),
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bot ${token}`,
  },
});

if (response.ok) {
  const data = await response.json();
  console.log(data);
} else {
  const data = await response.text();
  console.log(data);
}
