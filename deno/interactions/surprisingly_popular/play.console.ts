import { SurprisinglyPopularVotingData } from "../../types.ts";
import { getPopularChoices } from "./mod.ts";

const data: SurprisinglyPopularVotingData = {
  candidates: [],
  ended: true,
  initiator: "",
  votes: {
    1: {
      chosen: "a",
      predicted: "a",
    },
    2: {
      chosen: "a",
      predicted: "a",
    },
    3: {
      chosen: "b",
      predicted: "a",
    },
    4: {
      chosen: "b",
      predicted: "a",
    },
  },
  winners: [],
};

console.log(getPopularChoices(data));
