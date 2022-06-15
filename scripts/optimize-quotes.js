const compress_images = require("compress-images");

const imageFolders = [
  { input: "assets/quotes/", output: "build/assets/quotes/" },
  { input: "assets/", output: "build/assets/" },
];

const generateGlobFromPath = (path, recursive = false) => {
  const fileGlob = "*.{jpg,JPG,jpeg,JPEG,png,svg,gif}";
  if (recursive) {
    return `${path}**/${fileGlob}`;
  }
  return `${path}${fileGlob}`;
};

imageFolders.forEach((folder) => {
  console.log(`Scanning ${folder} for images...`);
  compress_images(
    generateGlobFromPath(folder.input),
    folder.output,
    { compress_force: false, statistic: true, autoupdate: true },
    false,
    { jpg: { engine: "mozjpeg", command: ["-quality", "60"] } },
    { png: { engine: "pngquant", command: ["--quality=20-50", "-o"] } },
    { svg: { engine: "svgo", command: "--multipass" } },
    {
      gif: { engine: "gifsicle", command: ["--colors", "64", "--use-col=web"] },
    },
    (error, completed, statistic) => {
      console.log("-------------");
      console.log(error);
      console.log(completed);
      console.log(statistic);
      console.log("-------------");
    }
  );
});
