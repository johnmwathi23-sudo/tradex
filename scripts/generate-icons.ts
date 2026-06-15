import sharp from "sharp"
import fs from "fs"
import path from "path"

const SVG_PATH = path.resolve("public/images/primestone-logo.svg")
const OUT_DIR = path.resolve("public/images")

const SIZES = [192, 512]

async function generateIcons() {
  const svgBuffer = fs.readFileSync(SVG_PATH)

  for (const size of SIZES) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(OUT_DIR, `primestone-logo-${size}x${size}.png`))

    const maskableSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="none">
  <rect x="0" y="0" width="80" height="80" rx="0" fill="#0A0B0F"/>
  <rect x="4" y="4" width="72" height="72" rx="14" stroke="url(#goldGrad)" stroke-width="3" fill="#0A0B0F"/>
  <defs>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#D4A843"/>
      <stop offset="100%" stop-color="#E5C05A"/>
    </linearGradient>
  </defs>
  <text x="40" y="54" font-family="'Inter', 'Segoe UI', sans-serif" font-size="36" font-weight="700" text-anchor="middle" fill="url(#goldGrad)" letter-spacing="2">PM</text>
</svg>`

    await sharp(Buffer.from(maskableSvg))
      .resize(size, size)
      .png()
      .toFile(path.join(OUT_DIR, `primestone-logo-maskable-${size}x${size}.png`))
  }

  console.log("Icons generated successfully!")
}

generateIcons().catch(console.error)
