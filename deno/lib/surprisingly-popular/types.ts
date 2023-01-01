export type Answer = {
  chosen: boolean | string;
  predicted: boolean | string;
};

export type Question = {
  id?: string;
  text: string;
};

export type SurprisinglyPopularAnswer = {
  answer: boolean | string | string[];
  question?: Question;
};
