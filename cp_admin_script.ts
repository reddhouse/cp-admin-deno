// Run this script with...
// deno run --allow-env --allow-read --allow-run cp_admin_script.ts

import "https://deno.land/std@0.178.0/dotenv/load.ts";
import {
  bold,
  green,
  red,
  yellow,
} from "https://deno.land/std@0.178.0/fmt/colors.ts";

const runCommands = async (commands: string[]) => {
  const p = Deno.run({ cwd: "./terraform", cmd: commands });
  const { code } = await p.status();
  console.log(yellow(`Process ${p.pid} exited with code ${code}.`));
};

const runPipedCommands = async (
  commands: string[],
  setOutput: (x: string) => void
) => {
  const p = Deno.run({
    cwd: "./terraform",
    cmd: commands,
    stdout: "piped",
    stderr: "piped",
  });

  const { code } = await p.status();
  const rawOutput = await p.output();
  const rawError = await p.stderrOutput();

  if (code === 0) {
    const successString = new TextDecoder().decode(rawOutput);
    setOutput(successString);
    console.log(yellow(`Process ${p.pid} exited with code ${code}.`));
  } else {
    const errorString = new TextDecoder().decode(rawError);
    setOutput(errorString);
    console.log(errorString);
    console.log(red(`Process ${p.pid} exited with code ${code}.`));
  }
};

// Global variables to use throughout this session.
let ipAddress: string;

const menu: { [key: string]: string } = {
  "0": "Exit",
  "1": "Terraform Init",
  "2": "Terraform Format",
  "3": "Terraform Validate",
  "4": "Terraform Plan",
  "5": "Terraform Apply",
  "6": "Set IP Address",
  "7": "SSH",
  "98": "Terraform Destroy",
  "99": "Remove Known Host",
};

const handleAction = async (selection: string) => {
  switch (selection) {
    // Terraform Init
    case "1": {
      await runCommands(["terraform", "init"]);
      break;
    }
    // Terraform Format
    case "2": {
      await runCommands(["terraform", "fmt"]);
      break;
    }
    // Terraform Validate
    case "3": {
      await runCommands(["terraform", "validate"]);
      break;
    }
    // Terraform Plan
    case "4": {
      await runCommands([
        "terraform",
        "plan",
        `-var=hcloud_token=${Deno.env.get("HETZNER_API_TOKEN")}`,
      ]);
      break;
    }
    // Terraform Apply
    case "5": {
      await runCommands([
        "terraform",
        "apply",
        `-var=hcloud_token=${Deno.env.get("HETZNER_API_TOKEN")}`,
      ]);
      break;
    }
    // Set IP Address (after terraform apply)
    case "6": {
      const setIpAddress = (x: string) => {
        ipAddress = x;
      };
      await runPipedCommands(
        ["terraform", "output", "-raw", "coopar-server-1-ip"],
        setIpAddress
      );
      break;
    }
    // SSH into Remote Host
    case "7": {
      await runCommands(["ssh", `jmt@${ipAddress}`]);
      break;
    }
    // Terraform Destroy
    case "98": {
      // First, grab IP Address in case previous step was missed or this is a new session.
      const setIpAddress = (x: string) => {
        ipAddress = x;
      };
      await runPipedCommands(
        ["terraform", "output", "-raw", "coopar-server-1-ip"],
        setIpAddress
      );
      // Second, process with spinning down Hetzner resources.
      await runCommands([
        "terraform",
        "destroy",
        `-var=hcloud_token=${Deno.env.get("HETZNER_API_TOKEN")}`,
      ]);
      break;
    }
    // Remove Known Host (after terraform destroy)
    case "99": {
      await runCommands(["ssh-keygen", "-R", ipAddress]);
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
