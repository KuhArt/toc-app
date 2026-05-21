import { readFile } from "node:fs/promises";
import path from "node:path";

export async function loader() {
  const javascript = await readFile(
    path.join(process.cwd(), "extensions/toc-theme/assets/toc-animation-shared.js"),
    "utf8",
  );

  return new Response(javascript, {
    headers: {
      "Cache-Control": "public, max-age=60",
      "Content-Type": "application/javascript; charset=utf-8",
    },
  });
}
