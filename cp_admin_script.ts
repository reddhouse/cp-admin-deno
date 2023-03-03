// Run this script with...
// deno run --allow-env --allow-read --allow-run cp_admin_script.ts

import "https://deno.land/std@0.178.0/dotenv/load.ts";
import {
  bold,
  green,
  yellow,
} from "https://deno.land/std@0.178.0/fmt/colors.ts";
interface Command {
  label: string;
  commands: string[];
}

const menu: { [key: string]: Command } = {
  "0": { label: "Exit", commands: [] },
  "1": { label: "Terraform Init", commands: ["terraform", "init"] },
  "2": { label: "Terraform Format", commands: ["terraform", "fmt"] },
  "3": { label: "Terraform Validate", commands: ["terraform", "validate"] },
  "4": {
    label: "Terraform Plan",
    commands: [
      "terraform",
      "plan",
      `-var=hcloud_token=${Deno.env.get("HETZNER_API_TOKEN")}`,
    ],
  },
  "5": {
    label: "Terraform Apply",
    commands: [
      "terraform",
      "apply",
      `-var=hcloud_token=${Deno.env.get("HETZNER_API_TOKEN")}`,
    ],
  },
  "6": {
    label: "Terraform Destroy",
    commands: [
      "terraform",
      "destroy",
      `-var=hcloud_token=${Deno.env.get("HETZNER_API_TOKEN")}`,
    ],
  },
};

const handleAction = async (selection: string) => {
  const p = Deno.run({ cwd: "./terraform", cmd: menu[selection].commands });
  const { code } = await p.status();
  console.log(yellow(`Process ${p.pid} exited with code ${code}.`));
};

while (true) {
  // Display menu.
  for (const [key, value] of Object.entries(menu)) {
    console.log(`${key}: ${value.label}`);
  }

  // Capture user input.
  const selection = prompt(bold(green("Select an action:")), "0") || "0";
  if (selection == "0") {
    break;
  }

  // Do stuff based on selection.
  if (selection in menu) {
    await handleAction(selection);
  }
}
