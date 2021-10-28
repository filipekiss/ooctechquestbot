export type Line = [string];
export type Frame = Array<Line>;
export type Animation = Array<Frame>;
export type AnimationDefinition = {
  tick: number;
  frames: Animation;
};
export const fireworksAnimation: Animation = [[["🧨"]], [["🎆"]]];
