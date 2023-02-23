// Run this script with: deno run --allow-net --allow-read fileserver.ts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { contentType } from "https://deno.land/std@0.177.0/media_types/mod.ts";

// const BASE_PATH = "./public";
const BASE_PATH = "./admin_panel.html";

const reqHandler = async (req: Request) => {
  console.log(
    `Incoming request at ${new Date(Date.now()).toLocaleTimeString(
      "en-US"
    )} \n`,
    req
  );

  // const filePath = BASE_PATH + new URL(req.url).pathname;
  const filePath = BASE_PATH;
  let fileSize;
  try {
    fileSize = (await Deno.stat(filePath)).size;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return new Response(null, { status: 404 });
    }
    return new Response(null, { status: 500 });
  }
  const body = (await Deno.open(filePath)).readable;
  return new Response(body, {
    headers: {
      "content-length": fileSize.toString(),
      "content-type": contentType("text/html"),
    },
  });
};

serve(reqHandler, { port: 8080 });
