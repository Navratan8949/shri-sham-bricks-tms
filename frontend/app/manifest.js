export default function manifest() {
  return {
    name: "Shri Shyam Bricks",
    short_name: "Shri Shyam Bricks",
    description: "Simple Material Supply & Own Fleet P&L Portal",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#fbf9f6",
    theme_color: "#f59e0b",
    icons: [
      {
        src: "/images/logo.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/images/logo.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
