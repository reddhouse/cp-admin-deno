// Run this script with: deno run --allow-net webserver.ts

// Serve a handler function that will be called for each incoming request, and
// return a response (or a promise resolving to a response).
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const doServerStuff = (req: Request, topic: string) => {
  switch (topic) {
    case "USER_AGENT":
      return JSON.stringify({
        message: `Your user-agent is:\n\n${
          req.headers.get("user-agent") ?? "Unknown"
        }`,
      });
    case "FOO_BAR":
      return JSON.stringify({ message: "FooBar thing is complete." });
    default:
      throw new Error(`Unknown topic: ${topic} (CPKE).`);
  }
};

const handler = async (req: Request): Promise<Response> => {
  const ts = new Date(Date.now()).toLocaleTimeString("en-US");

  if (req.method === "OPTIONS") {
    console.log(`${req.method} request at ${ts}`);
  }

  let responseBody;

  if (req.method === "POST") {
    const requestBody = await req.json();
    const topic = requestBody.topic;
    console.log(`${req.method} request at ${ts} - Topic: ${topic}`);
    responseBody = doServerStuff(req, topic);
  }

  return new Response(responseBody, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "http://localhost:8080",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST",
    },
  });
};

// Serve will listen on port 8000 by default if second arg is absent.
serve(handler, { port: 8000 });
