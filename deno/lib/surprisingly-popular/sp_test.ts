import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.170.0/testing/asserts.ts";
import spAnswer from "./mod.ts";
import { Answer } from "./types.ts";

let questionText = "Is Philadelphia the capital of Pennsylvania?";

Deno.test(`False for question: '${questionText}'`, () => {
  const answers = getAnswersForPhiladelphiaQuestion();

  const result = spAnswer({
    answers,
    question: {
      text: questionText,
    },
  });

  assert(result && result.answer === false);
});

Deno.test(
  `Supports string answers and returns answer === "no" for question: '${questionText}'`,
  () => {
    const answers = getStringAnswersForPhiladelphiaQuestion();

    const result = spAnswer({
      answers,
      question: {
        text: questionText,
      },
    });

    assert(result && result.answer === "no");
  },
);

questionText =
  "Is the all-postive & all-popular answer going to win by default (if threshold === 0)?";

Deno.test(`True for question: '${questionText}'`, () => {
  const answers: Answer[] = [];

  for (let i = 0; i < 100; i++) {
    const answer: Answer = {
      chosen: true,
      predicted: true,
    };

    answers.push(answer);
  }

  const result = spAnswer({
    answers,
    question: {
      text: questionText,
    },
  });

  assert(result && result.answer === true);
});

Deno.test(
  `Returns null if the given answers are not having boolean/string types for postive & popular`,
  () => {
    let result = spAnswer({
      answers: [
        {
          chosen: true,
          predicted: null!,
        },
      ],
      question: {
        text: questionText,
      },
    });

    assert(result === null);

    result = spAnswer({
      answers: [
        {
          chosen: null!,
          predicted: true,
        },
      ],
      question: {
        text: questionText,
      },
    });

    assert(result === null);
  },
);

Deno.test(`Threshold is applied if provided`, () => {
  const answers = getAnswersForPhiladelphiaQuestion();

  const result = spAnswer({
    answers,
    question: {
      text: questionText,
    },
    threshold: -21,
  });

  assert(result && result.answer === true);
});

Deno.test(
  `Returns empty string for question.text if question is not provided in args`,
  () => {
    const result = spAnswer({
      answers: [{ chosen: true, predicted: true }],
    });

    assert(result && result.question && result.question.text === "");
  },
);

Deno.test(`Returns null if one of the answers is an empty string`, () => {
  let result = spAnswer({
    answers: [
      {
        chosen: "",
        predicted: "test",
      },
    ],
    question: {
      text: questionText,
    },
  });

  assert(result === null);

  result = spAnswer({
    answers: [
      {
        chosen: "test",
        predicted: "",
      },
    ],
    question: {
      text: questionText,
    },
  });

  assert(result === null);
});

Deno.test(
  `Returns string[] for answer if there are multiple answers with the same score.`,
  () => {
    const answers = [];
    const options = ["heads", "tails"];

    for (let i = 0; i < 100; i++) {
      const answer: Answer = {
        chosen: "",
        predicted: "",
      };

      if (i < 50) {
        answer.chosen = options[0];
      } else {
        answer.chosen = options[1];
      }

      if (i < 50) {
        answer.predicted = options[0];
      } else {
        answer.predicted = options[1];
      }

      answers.push(answer);
    }

    const result = spAnswer({
      answers,
      question: {
        text: "Heads or Tails?",
      },
    });

    assertEquals(result && result.answer, options);
  },
);

Deno.test(`Sets popular score 0 if an answer has no popular vote.`, () => {
  const answers: Answer[] = [
    {
      chosen: "A",
      predicted: "A",
    },
    {
      chosen: "B",
      predicted: "A",
    },
  ];

  const result = spAnswer({ answers });

  assert(result && result.answer === "B");
});

Deno.test(`Sets positive score 0 if an answer has no positive vote.`, () => {
  const answers: Answer[] = [
    {
      chosen: "A",
      predicted: "B",
    },
    {
      chosen: "A",
      predicted: "C",
    },
  ];

  const result = spAnswer({ answers });

  assert(result && result.answer === "A");
});

function getAnswersForPhiladelphiaQuestion(): Answer[] {
  const answers: Answer[] = [];

  for (let i = 0; i < 100; i++) {
    const answer: Answer = {
      chosen: true,
      predicted: true,
    };

    if (i < 65) {
      answer.chosen = true;
    } else {
      answer.chosen = false;
    }

    if (i < 75) {
      answer.predicted = true;
    } else {
      answer.predicted = false;
    }

    answers.push(answer);
  }

  return answers;
}

function getStringAnswersForPhiladelphiaQuestion(): Answer[] {
  const answers: Answer[] = [];

  for (let i = 0; i < 100; i++) {
    const answer: Answer = {
      chosen: "yes",
      predicted: "yes",
    };

    if (i < 65) {
      answer.chosen = "yes";
    } else {
      answer.chosen = "no";
    }

    if (i < 75) {
      answer.predicted = "yes";
    } else {
      answer.predicted = "no";
    }

    answers.push(answer);
  }

  return answers;
}
