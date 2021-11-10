function isQuote(character: string): boolean {
  return character === `"` || character === `'`;
}

export function removeSurroundingQuotes(text: string): string {
  const [first, ...rest] = text.split("");
  const [last] = rest.reverse();
  if (isQuote(first) && isQuote(last)) {
    return text.slice(1, -1);
  }
  return text;
}
