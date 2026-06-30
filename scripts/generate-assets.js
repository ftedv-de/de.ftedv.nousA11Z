'use strict';

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');

const jobs = [
  {
    input: path.join(root, 'drivers/a11z/assets/icon.svg'),
    output: path.join(root, 'drivers/a11z/assets/icon-small.png'),
    size: 75,
  },
  {
    input: path.join(root, 'drivers/a11z/assets/icon.svg'),
    output: path.join(root, 'drivers/a11z/assets/icon-large.png'),
    size: 500,
  },
];

(async () => {
  for (const job of jobs) {
    fs.mkdirSync(path.dirname(job.output), { recursive: true });
    await sharp(job.input)
      .resize(job.size, job.size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(job.output);
    console.log(`Generated ${path.relative(root, job.output)}`);
  }
})().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
