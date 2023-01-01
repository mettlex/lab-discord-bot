import { getSpData, spStore, storeSpData } from "../../store.ts";
import {
  InteractedMessage,
  InteractingMember,
  InteractionData,
  SurprisinglyPopularVotingData,
} from "../../types.ts";
import spAnswer from "../../lib/surprisingly-popular/mod.ts";

export const spAppCommands = [
  {
    type: 2,
    name: "Surprisingly Popular",
  },
  {
    type: 3,
    name: "Surprisingly Popular",
  },
];

export const spSlashCommands = [
  {
    name: "surprisingly_popular",
    type: 1,
    description: "Poll to get the Surprisingly Popular Answer",
  },
];

export const getPopularChoices = (spData: SurprisinglyPopularVotingData) => {
  if (Object.values(spData.votes).length === 0) {
    return null;
  }

  const voteCounter = Object.values(spData.votes).reduce(
    (acc, curr) => {
      if (!acc[curr.chosen]) {
        acc[curr.chosen] = 0;
      }

      acc[curr.chosen]++;

      return {
        ...acc,
      };
    },
    {} as {
      [candidate: string]: number;
    },
  );

  const sorted = Object.entries(voteCounter).sort((a, b) => {
    return a[1] - b[1];
  });

  const highestVotes = sorted[sorted.length - 1][1];

  const popularChoices = sorted
    .filter((x) => x[1] === highestVotes)
    .map((x) => ({ candidate: x[0], votes: x[1] }));

  return popularChoices;
};

export const getSPCommandRespose = () => {
  return {
    type: 4,
    data: {
      content: `Provide candidate names by separating them with commas (\`,\`) in the form.`,
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              label: "Open Form",
              style: 1,
              custom_id: `button_form_for_sp`,
            },
          ],
        },
      ],
      flags: 1 << 6,
    },
  };
};

export const buildSelectMenusForSPVoting = (
  question: number,
  data: InteractionData,
  message: InteractedMessage,
  member: InteractingMember,
) => {
  const id = message.content.split("`")[1];

  let choice: string | undefined;

  if ("values" in data && data.values) {
    choice = data.values[0]?.trim();
  }

  const votes: Partial<SurprisinglyPopularVotingData["votes"][string]> = {};

  const existingData = getSpData(id);

  if (question === 2 && choice && existingData) {
    votes.chosen = choice;
    votes.predicted = choice;
    existingData.votes[member.user.id] = votes as Required<typeof votes>;
  } else if (
    question === 3 &&
    choice &&
    existingData &&
    existingData.votes[member.user.id]
  ) {
    votes.predicted = choice;
    existingData.votes[member.user.id] = {
      ...existingData.votes[member.user.id],
      ...votes,
    };
  }

  if (existingData) {
    storeSpData(id, { ...existingData });
  }

  const options = existingData?.candidates.map((c) => ({
    label: c,
    value: c,
  }));

  if (!options) {
    return {
      type: 4,
      data: {
        content: `There is no running election now.`,
        flags: 1 << 6,
      },
    };
  }

  return {
    type: 4,
    data: {
      content:
        question === 1
          ? `ID: \`${id}\`` + "\n\n> **Which one do you choose?**"
          : `ID: \`${id}\`` +
            "\n\n> **Which one do you think most people will choose?**",
      components: [
        {
          type: 1,
          components: [
            {
              type: 3,
              custom_id:
                question === 1
                  ? "select_menu_for_sp_2"
                  : "select_menu_done_for_sp",
              options,
              placeholder: "Choose only one",
              min_values: 1,
              max_values: 1,
            },
          ],
        },
      ],
      flags: 1 << 6,
    },
  };
};

export const buildMessageForSPVotingStart = (
  data: InteractionData,
  member: InteractingMember,
) => {
  if (!("components" in data)) {
    return {};
  }

  const memberName = member.nick ? member.nick : member.user.username;
  const candidates = Array.from(
    new Set(
      data.components[0].components[0].value
        ?.split(",")
        .filter((x) => x.trim()),
    ),
  );

  if (candidates.length > 10) {
    return {
      type: 4,
      data: {
        content: `Candidates can't be more than 10.`,
        flags: 1 << 6,
      },
    };
  } else if (candidates.length < 2) {
    return {
      type: 4,
      data: {
        content: `Candidates can't be less than 2.`,
        flags: 1 << 6,
      },
    };
  }

  const existingDataIterator = spStore.entries();

  let existingDataIterResult = existingDataIterator.next();

  let foundData: SurprisinglyPopularVotingData | undefined;
  let foundId: string | undefined;

  while (!existingDataIterResult.done) {
    foundId = existingDataIterResult.value[0]?.replace("discord-sp-", "");
    foundData = existingDataIterResult.value[1];

    if (!foundData || foundData.initiator !== member.user.id) {
      foundData = undefined;
    }

    existingDataIterResult = existingDataIterator.next();
  }

  if (foundData && !foundData.ended) {
    return {
      type: 4,
      data: {
        content: `ID: \`${foundId}\`\n\nYou need to end the previous election before starting a new one. Do you want to end the previous one?`,
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                label: "End & Show Result",
                style: 1,
                custom_id: `button_to_end_vote`,
              },
            ],
          },
        ],
        flags: 1 << 6,
      },
    };
  }

  const spData: SurprisinglyPopularVotingData = {
    initiator: member.user.id,
    ended: false,
    candidates,
    votes: {},
    winners: [],
  };

  const id = crypto.randomUUID();

  storeSpData(id, spData);

  return {
    type: 4,
    data: {
      content: `ID: \`${id}\`\n\n**${memberName}** started an election. Choose your action:`,
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              label: "Participate & Vote",
              style: 1,
              custom_id: `button_for_vote`,
            },
            {
              type: 2,
              label: "End & Show Result",
              style: 1,
              custom_id: `button_to_end_vote`,
            },
          ],
        },
      ],
    },
  };
};

export const buildMessageForEndVoting = (
  member: InteractingMember,
  message: InteractedMessage,
) => {
  const id = message.content.split("`")[1];

  let spData = getSpData(id);

  if (spData) {
    spData = { ...spData };
  } else {
    return {
      type: 4,
      data: {
        content: `There is no running election now.`,
        flags: 1 << 6,
      },
    };
  }

  if (spData.initiator !== member.user.id) {
    return {
      type: 4,
      data: {
        content: `You can't end an election which was started by someone else.`,
        flags: 1 << 6,
      },
    };
  }

  storeSpData(id, undefined);

  const popularChoices = getPopularChoices(spData);

  if (!popularChoices) {
    return {
      type: 4,
      data: {
        content: `There is no vote.`,
        flags: 1 << 6,
      },
    };
  }

  const result = spAnswer({
    answers: Object.values(spData.votes),
    question: {
      id: member.user.id,
      text: "Who are the winners?",
    },
  });

  return {
    type: 4,
    data: {
      content: `**Popular Answer: **\`${popularChoices
        .map((x) => `${x.candidate} (${x.votes})`)
        .join(", ")}\`\n**Surprisingly Popular Answer: **\`${
        (result?.answer instanceof Array && result.answer.join(", ")) ||
        result?.answer
      }\``,
    },
  };
};
