// Run this script with...
// deno run --allow-env --allow-read --allow-run --allow-net cp_admin_script_remote.ts

import "https://deno.land/std@0.178.0/dotenv/load.ts";
import {
  bold,
  green,
  red,
  yellow,
} from "https://deno.land/std@0.178.0/fmt/colors.ts";

const runBashCommand = async (
  cwd: string,
  bashCommand: string,
  env?: Record<string, string>
) => {
  const bashCommandBytes = new TextEncoder().encode(bashCommand);
  const command = new Deno.Command("bash", {
    cwd,
    env,
    stdin: "piped",
    stdout: "inherit",
    stderr: "inherit",
  });
  const child = command.spawn();
  const writer = await child.stdin.getWriter();
  writer.write(bashCommandBytes);
  writer.releaseLock();
  await child.stdin.close();
  const { code } = await child.status;
  console.log(yellow(`Process ${child.pid} exited with code ${code}.`));
};

const runExecutableCommand = async (
  cwd: string,
  cmd: string,
  args: string[],
  env?: Record<string, string>
) => {
  const command = new Deno.Command(cmd, {
    cwd,
    args,
    env,
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });
  const child = command.spawn();
  const { code } = await child.status;
  console.log(yellow(`Process ${child.pid} exited with code ${code}.`));
};

const runPipedCommand = async (
  cwd: string,
  cmd: string,
  args: string[],
  setOutput: (x: string) => void
) => {
  const command = new Deno.Command(cmd, {
    cwd,
    args,
    stdin: "inherit",
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
let coopWebCommitHash: string;

const menu: { [key: string]: string } = {
  "0": "Exit",
  "1": "Delete nginx's default-enabled sites",
  "2": "Enable deno site in nginx (pre-configured in cloud-config)",
  "3": "Restart nginx service",
  "4": "Git clone cooperative-web",
  "5": "Delete deno.lock file",
  "6": "Grab git commit hash to use in subsequent commands (EVERY SESSION)",
  "7": "Cache main.ts (before Fresh deployment)",
  "8": "Run Fresh app, back-grounded, and disowned",
  "20": "Install certbot && symlink",
  "21": "Get and install SSL certificates",
  "30": "Pull latest cooperative-admin code",
  "31": "Pull latest cooperative-web code",
  "99": "Test with echo",
};

const handleAction = async (selection: string) => {
  switch (selection) {
    // Delete nginx's default-enabled sites.
    case "1": {
      await runBashCommand("./", `sudo rm /etc/nginx/sites-enabled/default`);
      break;
    }
    // Enable deno site in nginx (pre-configured in cloud-config).
    case "2": {
      await runBashCommand(
        "./",
        `sudo ln -s /etc/nginx/sites-available/deno /etc/nginx/sites-enabled/deno`
      );
      break;
    }
    // Delete nginx's default-enabled sites.
    case "3": {
      await runBashCommand("./", `sudo service nginx restart`);
      break;
    }
    // Git clone cooperative-web.
    case "4": {
      await runExecutableCommand("/home/jmt", "git", [
        "clone",
        "https://github.com/reddhouse/cooperative-web.git",
      ]);
      break;
    }
    // Delete deno.lock file.
    case "5": {
      await runBashCommand("./", `rm /home/jmt/cooperative-web/deno.lock`);
      break;
    }
    // Grab git commit hash to use in script.
    case "6": {
      const setCommitHash = (x: string) => {
        coopWebCommitHash = x;
      };
      await runPipedCommand(
        "./",
        "git",
        ["-C", "/home/jmt/cooperative-web", "rev-parse", "HEAD"],
        setCommitHash
      );
      break;
    }
    // Cache main.ts (before Fresh deployment).
    case "7": {
      await runExecutableCommand(
        "/home/jmt/cooperative-web",
        "deno",
        ["cache", "main.ts"],
        {
          DENO_DEPLOYMENT_ID: coopWebCommitHash,
        }
      );
      break;
    }
    // Run Fresh app in background (&), and disowned!
    case "8": {
      await runBashCommand(
        "/home/jmt/cooperative-web",
        `deno run --allow-env --allow-read --allow-net main.ts & disown`,
        {
          DENO_DEPLOYMENT_ID: coopWebCommitHash,
        }
      );
      break;
    }
    // Install certbot && symlink.
    case "20": {
      await runBashCommand(
        "./",
        `sudo snap install --classic certbot && sudo ln -s /snap/bin/certbot /usr/bin/certbot`
      );
      break;
    }
    // Get and install SSL certificates.
    case "21": {
      const cmdBytes1 = new TextEncoder().encode("sudo certbot --nginx");
      const command = new Deno.Command("bash", { stdin: "piped" });
      const child = command.spawn();
      const writer = await child.stdin.getWriter();
      const reader = await child.stdout.getReader();
      writer.write(cmdBytes1);
      const output1 = await reader.read();
      console.log("Here is some output: ", output1);
      writer.releaseLock();
      await child.stdin.close();
      const { code } = await child.status;
      console.log(yellow(`Process ${child.pid} exited with code ${code}.`));
      break;
    }
    // Test automatic SSL cert renewal.
    case "22": {
      await runExecutableCommand("./", "certbot", ["renew", "--dry-run"]);
      break;
    }
    // Pull down new changes in cooperative-admin.
    case "30": {
      await runExecutableCommand("/home/jmt/cooperative-admin", "git", [
        "pull",
      ]);
      break;
    }
    // Pull down new changes in cooperative-web.
    case "31": {
      await runExecutableCommand("/home/jmt/cooperative-web", "git", ["pull"]);
      break;
    }
    // Do something (Test).
    case "99": {
      await runBashCommand("./", `echo $DENO_DEPLOYMENT_ID`, {
        DENO_DEPLOYMENT_ID: coopWebCommitHash || "",
      });
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
