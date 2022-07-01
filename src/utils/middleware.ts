import { NextFunction } from "grammy";
import { OocContext } from "../config";

export const withNext = <T extends OocContext>(
  fn: (context: T) => Promise<void>
) => {
  return async (ctx: T, next: NextFunction) => {
    await fn(ctx);
    await next();
  };
};
