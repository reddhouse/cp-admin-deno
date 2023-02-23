// Run this script with: deno run --allow-net webserver2.ts

// Serve a handler function that will be called for each incoming request, and
// is expected to return a response (or a promise resolving to a response).
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

async function handler(req: Request): Promise<Response> {
  console.log(
    `Incoming request at ${new Date(Date.now()).toLocaleTimeString(
      "en-US"
    )} \n`,
    req
  );

  try {
    if (req.method === "POST") {
      const requestBody = await req.json();
      console.log("Body:", requestBody);
    }
  } catch (error) {
    console.log(
      "CPKE There was a problem reading/parsing the Response stream: ",
      error
    );
  }

  const responseBody = JSON.stringify({
    message: `Your user-agent is:\n\n${
      req.headers.get("user-agent") ?? "Unknown"
    }`,
  });

  return new Response(responseBody, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "http://localhost:8080",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST",
    },
  });
}

// Serve will listen on port 8000 by default if second arg is absent.
serve(handler, { port: 8000 });
