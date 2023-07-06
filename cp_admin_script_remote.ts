// Run this script with...
// deno run --allow-env --allow-read --allow-run --allow-net cp_admin_script_remote.ts

import "https://deno.land/std@0.178.0/dotenv/load.ts";
import {
  bold,
  green,
  red,
  yellow,
} from "https://deno.land/std@0.178.0/fmt/colors.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const runCommands = async (cwd: string, cmd: string, args: string[]) => {
  const command = new Deno.Command(cmd, {
    cwd,
    args,
    stdout: "inherit",
    stderr: "inherit",
  });
  const child = command.spawn();
  const { code } = await child.status;
  console.log(yellow(`Process ${child.pid} exited with code ${code}.`));
};

const runPipedCommands = async (
  cwd: string,
  cmd: string,
  args: string[],
  setOutput: (x: string) => void
) => {
  const command = new Deno.Command(cmd, {
    cwd,
    args,
    stdout: "piped",
    stderr: "piped",
  });
  const child = command.spawn();
  const { code, stdout, stderr } = await command.output();

  if (code === 0) {
    const successString = new TextDecoder().decode(stdout);
    setOutput(successString);
    console.log(yellow(`Process ${child.pid} exited with code ${code}.`));
  } else {
    const errorString = new TextDecoder().decode(stderr);
    setOutput(errorString);
    console.log(errorString);
    console.log(red(`Process ${child.pid} exited with code ${code}.`));
  }
};

// Global variables to use throughout this session.
let ipAddress: string;

const menu: { [key: string]: string } = {
  "0": "Exit",
  "1": "Echo a message",
};

const handleAction = async (selection: string) => {
  switch (selection) {
    // Do something.
    case "1": {
      await runCommands("./", "echo", [
        "I am foobar message from remote script",
      ]);
      break;
    }
    default:
      throw new Error(`Unknown selection: ${selection} (CPKE).`);
  }
};

while (true) {
  // Display menu.
  for (const [key, value] of Object.entries(menu)) {
    console.log(`${key}: ${value}`);
  }

  // Capture user input.
  // If user inputs the empty string, prompt returns null.
  const selection = prompt(bold(green("Select an action:")));

  // Treat null case as an unintentional mistake (loop again).
  if (selection === null) {
    continue;
  }

  // Exit.
  if (selection == "0") {
    break;
  }

  // Selection not known. Show menu again.
  if (!(selection in menu)) {
    continue;
  }

  await handleAction(selection);
}
