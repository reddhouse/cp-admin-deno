// Run this script with...
// deno run --allow-net --allow-read fileserver.ts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { contentType } from "https://deno.land/std@0.177.0/media_types/mod.ts";

const reqHandler = async (req: Request) => {
  const ts = new Date(Date.now()).toLocaleTimeString("en-US");
  console.log(`${req.method} request at ${ts} to url: ${req.url}`);

  const BASE_PATH = "./admin_panel.html";
  const filePath = BASE_PATH;
  // Future version could extract file path from url, relative to public dir.
  // const BASE_PATH = "./public";
  // const filePath = BASE_PATH + new URL(req.url).pathname;

  let fileSize;
  try {
    fileSize = (await Deno.stat(filePath)).size;
  } catch (error) {
    console.log(
      `There was a problem reading the file at "${filePath}" (CPKE).`
    );
    if (error instanceof Deno.errors.NotFound) {
      return new Response(null, { status: 404 });
    }
    return new Response(null, { status: 500 });
  }
  // Deno.open returns a Deno.FsFile object, containing a ReadableStream which
  // can be given directly to the body of the response object.
  const body = (await Deno.open(filePath)).readable;
  return new Response(body, {
    headers: {
      "content-length": fileSize.toString(),
      "content-type":
        contentType(filePath?.split(".")?.pop() ?? ".html") || "text/html",
    },
  });
};

serve(reqHandler, { port: 8080 });
