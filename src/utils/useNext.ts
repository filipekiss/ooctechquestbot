export const useNext = (callback) => {
  return async (ctx, next) => {
    await callback(ctx);
    await next();
  };
};
