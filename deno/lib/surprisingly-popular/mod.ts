import { Answer, Question, SurprisinglyPopularAnswer } from "./types.ts";

type FnParams = {
  question?: Question;
  answers: Answer[];
  threshold?: number;
};

const spAnswer = (params: FnParams): SurprisinglyPopularAnswer | null => {
  const question: Question = {
    text: (params.question && params.question.text) || "",
  };

  const answersCount = params.answers.length;

  const answers: Answer[] = params.answers;

  let threshold = 0;
  let answersAreBoolean = false;

  if (typeof params.threshold === "number") {
    threshold = params.threshold;
  }

  for (let i = 0; i < answersCount; i++) {
    if (
      params.answers &&
      typeof params.answers[i].chosen === "boolean" &&
      typeof params.answers[i].predicted === "boolean"
    ) {
      answersAreBoolean = true;
    } else {
      answersAreBoolean = false;
      break;
    }
  }

  if (answersAreBoolean) {
    let affirmatives = 0;
    let popularityOfAffirmatives = 0;
    let negatives = 0;
    let popularityOfNegatives = 0;

    for (const answer of answers) {
      if (answer.chosen === true) {
        affirmatives++;
      } else {
        negatives++;
      }

      if (answer.predicted === true) {
        popularityOfAffirmatives++;
      } else {
        popularityOfNegatives++;
      }
    }

    const differenceYes = affirmatives - popularityOfAffirmatives;
    const differenceNo = negatives - popularityOfNegatives;

    let result: SurprisinglyPopularAnswer;

    if (differenceYes - differenceNo >= threshold) {
      result = {
        answer: true,
        question,
      };
    } else {
      result = {
        answer: false,
        question,
      };
    }

    return result;
  } else if (
    !answers.find(
      (answer) =>
        typeof answer.chosen !== "string" ||
        typeof answer.predicted !== "string",
    )
  ) {
    const rightAnswerDistribution = answers.reduce<{ [key: string]: number }>(
      (acc: { [key: string]: number }, current: Answer) => {
        const key = (current.chosen && current.chosen.toString()) || "";

        if (typeof acc[key] == "undefined") {
          acc[key] = 1;
        } else {
          acc[key] += 1;
        }

        return acc;
      },
      {},
    );

    const popularAnswerDistribution = answers.reduce<{ [key: string]: number }>(
      (acc: { [key: string]: number }, current: Answer) => {
        const key = (current.predicted && current.predicted.toString()) || "";

        if (typeof acc[key] == "undefined") {
          acc[key] = 1;
        } else {
          acc[key] += 1;
        }

        return acc;
      },
      {},
    );

    let score: { [key: string]: number } = {};

    for (const key in popularAnswerDistribution) {
      if (key === "") {
        return null;
      }

      score = {
        ...score,
        [key]:
          (rightAnswerDistribution[key] || 0) - popularAnswerDistribution[key],
      };
    }

    for (const key in rightAnswerDistribution) {
      if (key === "") {
        return null;
      }

      score = {
        ...score,
        [key]:
          rightAnswerDistribution[key] - (popularAnswerDistribution[key] || 0),
      };
    }

    const positives: { answer: string; diff: number }[] = [];

    for (const answer in score) {
      for (const otherAnswer in score) {
        const diff = score[answer] - score[otherAnswer];

        if (diff >= threshold) {
          positives.push({ answer, diff });
        }
      }
    }

    const max = Math.max(...positives.map((x) => x.diff));

    const derivedAnswers = Array.from(
      new Set(
        positives.filter((x) => x && x.diff === max).map((x) => x && x.answer),
      ),
    );

    if (derivedAnswers.length === 1) {
      return {
        answer: derivedAnswers[0],
        question,
      };
    } else {
      return {
        answer: derivedAnswers,
        question,
      };
    }
  } else {
    return null;
  }
};

export default spAnswer;
