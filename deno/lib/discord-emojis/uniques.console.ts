type Emoji = { n: string; c: string };

const __dirname = new URL(".", import.meta.url).pathname;

const decoder = new TextDecoder("utf-8");

const data = Deno.readFileSync(`${__dirname}data.json`);

const content = decoder.decode(data);

const emojis = JSON.parse(content) as Emoji[];

const uniques: Emoji[] = [];

for (const emoji of emojis) {
  if (uniques.find((x) => x.n === emoji.n)) continue;

  uniques.push(emoji);
}

const encoder = new TextEncoder();

Deno.writeFileSync(
  `${__dirname}uniques.json`,
  encoder.encode(JSON.stringify(uniques, null, 2)),
);
