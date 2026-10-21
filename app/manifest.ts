import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mirai",
    short_name: "Mirai",
    description:
      "Mirai helps teachers and parents notice early signs that a child may need extra support.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fdf3ea",
    theme_color: "#0a2a66",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
