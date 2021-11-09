export const parseArguments = (message: string): [string, string[]] => {
  const [, action, ...msgArgs] = message.split(" ");
  return [action, msgArgs];
};
