// Run this script with...
// deno run --allow-env --allow-read --allow-run cp_admin_script.ts

interface Command {
  label: string;
  commands: string[];
}

const menu: { [key: string]: Command } = {
  "0": { label: "Exit", commands: [] },
  "1": { label: "Terraform Init", commands: ["terraform", "init"] },
};

const handleAction = async (selection: string) => {
  const p = Deno.run({ cwd: "./terraform", cmd: menu[selection].commands });
  const { code } = await p.status();
  console.log(`Process ${p.pid} exited with code ${code}.`);
};

while (true) {
  // Display menu.
  for (const [key, value] of Object.entries(menu)) {
    console.log(`${key}: ${value.label}`);
  }

  // Capture user input.
  const selection = prompt("Select an action:", "0") || "0";
  if (selection == "0") {
    break;
  }

  // Do stuff based on selection.
  if (selection in menu) {
    await handleAction(selection);
  }
}
