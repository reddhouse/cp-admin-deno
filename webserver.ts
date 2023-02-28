// Run this script with: deno run --allow-run --allow-net webserver.ts

// Serve a handler function that will be called for each incoming request, and
// return a response (or a promise resolving to a response).
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const listTerraformCommands = async () => {
  const p = Deno.run({
    cmd: ["terraform", "-help"],
    stdout: "piped",
    stderr: "piped",
  });

  const { code } = await p.status();

  // Reading the outputs closes these pipes.
  const rawOutput = await p.output();
  const rawError = await p.stderrOutput();

  if (code === 0) {
    const successString = new TextDecoder().decode(rawOutput);
    return successString;
  } else {
    const errorString = new TextDecoder().decode(rawError);
    return errorString;
  }
};

const doServerStuff = async (req: Request, topic: string) => {
  let reply;
  switch (topic) {
    case "USER_AGENT":
      reply = `Your user-agent is:\n\n${
        req.headers.get("user-agent") ?? "Unknown"
      }`;
      break;
    case "FOO_BAR":
      reply = "FooBar thing is complete.";
      break;
    case "TERRAFORM_HELP": {
      reply = await listTerraformCommands();
      break;
    }
    default:
      throw new Error(`Unknown topic: ${topic} (CPKE).`);
  }

  return JSON.stringify({ message: reply });
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
    responseBody = await doServerStuff(req, topic);
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
