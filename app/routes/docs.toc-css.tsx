import { readFile } from "node:fs/promises";
import path from "node:path";

export async function loader() {
  const css = await readFile(
    path.join(process.cwd(), "extensions/toc-theme/assets/toc.css"),
    "utf8",
  );

  return new Response(css, {
    headers: {
      "Cache-Control": "public, max-age=60",
      "Content-Type": "text/css; charset=utf-8",
    },
  });
}
