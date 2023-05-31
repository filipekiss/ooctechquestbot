import { Context } from "grammy";
import { OocContext } from "../config";

export type Line = [string];
export type Frame = Array<Line>;
export type Animation = Array<Frame>;
export type AnimationDefinition = {
  tick: number;
  frames: Animation;
};
export function isAnimationDefinition(
  x: Animation | AnimationDefinition
): x is AnimationDefinition {
  if ("tick" in x) {
    return true;
  }
  return false;
}

export function createAnimatedMessage(animation: Animation | AnimationDefinition) {
  let animationFrames: Animation;
  let animationSpeed = 1000;
  if (isAnimationDefinition(animation)) {
    animationFrames = animation.frames;
    animationSpeed = animation.tick;
  } else {
    animationFrames = animation;
  }
  return async function(ctx: OocContext) {
    const [firstFrame, ...restOfFrames] = animationFrames;
    const acendeMsg = await ctx.reply(firstFrame.join("\n"));
    restOfFrames.map((frame, index) => {
      setTimeout(async () => {
        await acendeMsg.editText(frame.join("\n"));
      }, (index + 1) * animationSpeed);
    });
  };
}

