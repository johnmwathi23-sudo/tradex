import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Primestone Markets",
    short_name: "Primestone",
    description: "Copy the Best Traders In The Market",
    start_url: "/",
    display: "standalone",
    background_color: "#0A0B0F",
    theme_color: "#0A0B0F",
    icons: [
      { src: "/images/primestone-logo-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/images/primestone-logo-512x512.png", sizes: "512x512", type: "image/png" },
      { src: "/images/primestone-logo-maskable-192x192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/images/primestone-logo-maskable-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }
}
