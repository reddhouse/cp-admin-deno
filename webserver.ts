// Run this script with...
// deno run --allow-env --allow-read --allow-run --allow-net webserver.ts

// Serve a handler function that will be called for each incoming request, and
// return a response (or a promise resolving to a response).
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import "https://deno.land/std@0.178.0/dotenv/load.ts";

const doProcessStuff = async (commandList: string[]) => {
  const p = Deno.run({
    cmd: commandList,
    stdin: "piped",
    stdout: "piped",
    stderr: "piped",
  });

  // A subprocess that requires user input may hang. Close stdin to troubleshoot.
  // await p.stdin.close();

  const { code } = await p.status();

  // Reading the outputs closes these pipes.
  const rawOutput = await p.output();
  const rawError = await p.stderrOutput();

  if (code === 0) {
    const successString = new TextDecoder().decode(rawOutput);
    // Handle silent completion + remove ANSI escape codes (terminal text colors)
    // https://stackoverflow.com/questions/25245716/remove-all-ansi-colors-styles-from-strings
    const betterSuccessString =
      successString.replace(
        // deno-lint-ignore no-control-regex
        /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
        ""
      ) || "Done, silently.";
    return betterSuccessString;
  } else {
    const errorString = new TextDecoder().decode(rawError);
    return errorString;
  }
};

const doServerStuff = async (req: Request, topic: string) => {
  let reply;
  switch (topic) {
    case "TERRAFORM_INIT": {
      reply = await doProcessStuff(["terraform", "init"]);
      break;
    }
    case "TERRAFORM_FMT": {
      reply = await doProcessStuff(["terraform", "fmt"]);
      break;
    }
    case "TERRAFORM_VALIDATE": {
      reply = await doProcessStuff(["terraform", "validate"]);
      break;
    }
    case "TERRAFORM_PLAN": {
      reply = await doProcessStuff([
        "terraform",
        "plan",
        `-var=hcloud_token=${Deno.env.get("HETZNER_API_TOKEN")}`,
      ]);
      break;
    }
    case "TERRAFORM_APPLY": {
      reply = `Sorry, needs user input. Run the following command in the same directory as main.tf\nterraform apply -var='hcloud_token=${Deno.env.get(
        "HETZNER_API_TOKEN"
      )}'`;
      break;
    }
    case "TERRAFORM_DESTROY": {
      reply = `Sorry, needs user input. Run the following command in the same directory as main.tf\nterraform destroy -var='hcloud_token=${Deno.env.get(
        "HETZNER_API_TOKEN"
      )}'`;
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
