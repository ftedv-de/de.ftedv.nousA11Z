'use strict';

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const driverIcon = path.join(root, 'drivers/a11z/assets/icon.svg');
const appIcon = path.join(root, 'assets/icon.svg');

const jobs = [
  {
    name: 'Driver small image',
    input: driverIcon,
    output: path.join(root, 'drivers/a11z/assets/icon-small.png'),
    width: 75,
    height: 75,
  },
  {
    name: 'Driver large image',
    input: driverIcon,
    output: path.join(root, 'drivers/a11z/assets/icon-large.png'),
    width: 500,
    height: 500,
  },
  {
    name: 'App small image',
    input: appIcon,
    output: path.join(root, 'assets/images/small.png'),
    width: 250,
    height: 175,
  },
  {
    name: 'App large image',
    input: appIcon,
    output: path.join(root, 'assets/images/large.png'),
    width: 500,
    height: 350,
  },
];

async function generateImage({ name, input, output, width, height }) {
  fs.mkdirSync(path.dirname(output), { recursive: true });

  const metadata = await sharp(input).metadata();
  const svgBuffer = await sharp(input)
    .resize(width, height, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: svgBuffer, gravity: 'center' }])
    .png()
    .toFile(output);

  console.log(`Generated ${name}: ${path.relative(root, output)} (${width}x${height}, source ${metadata.width || '?'}x${metadata.height || '?'})`);
}

(async () => {
  for (const job of jobs) {
    await generateImage(job);
  }
})().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
