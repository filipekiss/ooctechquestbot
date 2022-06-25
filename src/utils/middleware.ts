import { NextFunction } from "grammy";
import { OocContext } from "../config";

export const withNext = (fn: (context: OocContext) => Promise<void>) => {
  return async (ctx: OocContext, next: NextFunction) => {
    await fn(ctx);
    await next();
  };
};
