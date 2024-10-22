import { execSync } from "node:child_process";
import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { green, red, reset } from "kolorist";
import ora from "ora";
import prompts, { type Answers } from "prompts";

async function init() {
  let result: Answers<
    "projectName" | "version" | "packageManager" | "publishRepo"
  >;

  const spinner = ora("Fetching versions").start();
  const versions = ["3.0", "3.655"]; // does aws has methods to list all available versions?
  spinner.succeed("Fetched versions");

  const NOT_FOUND_INDEX = 0;

  try {
    result = await prompts([
      {
        type: "text",
        name: "projectName",
        message: reset("Project name:"),
        initial: `aws-sdk-repro-${Date.now()}`, // change to aws sdk js repro
      },
      {
        type: versions !== undefined ? "autocomplete" : "text",
        name: "version",
        message: reset("AWS JS SDK version:"),
        choices: versions?.map((version) => {
          return {
            title: version,
            value: version,
          };
        }),
        initial: async () => {
          const latestVersion = await getLatestVersion();
          const index =
            versions?.findIndex((version) => version === latestVersion) ??
            NOT_FOUND_INDEX;
          return index;
        },
      },
      {
        type: "select",
        name: "packageManager",
        message: reset("Package manager:"),
        choices: [
          {
            title: "npm",
            value: "npm",
          },
          {
            title: "pnpm",
            value: "pnpm",
          },
          {
            title: "bun",
            value: "bun",
          },
          {
            title: "yarn",
            value: "yarn",
          },
        ],
      },
      {
        type: "select",
        name: "publishRepo",
        message: reset(
          "Do you want to create a new repository on GitHub for this?",
        ),
        choices: [
          {
            title: "Yes",
            value: "yes",
          },
          {
            title: "No",
            value: "no",
          },
        ],
      },
    ]);

    const {
      projectName,
      version,
      packageManager,
      publishRepo: publishRepoRaw,
    } = result;
    const cwd = process.cwd();
    const targetDir = projectName;
    const root = join(cwd, targetDir);

    mkdirSync(root, { recursive: true });
    console.log(`\nScaffolding project in ${root}...`);

    // Copies template files from a predefined template directory to the new project directory.ate
    cpSync(join(__dirname, "../templates/js-sdk"), root, { recursive: true }); // change to aws
    const packageJsonContents = readFileSync(
      join(root, "package.json"),
      "utf-8",
    );
    const packageJson = JSON.parse(packageJsonContents);

    packageJson.devDependencies["@aws-sdk"] = version;
    writeFileSync(
      join(root, "package.json"),
      JSON.stringify(packageJson, null, "\t"),
    );

    const shouldPublishRepo = publishRepoRaw === "yes";
    // leave as is
    if (shouldPublishRepo) {
      try {
        process.chdir(root);
        console.log("Initializing git repository...");
        initRepoAndCommit();
        if (isGithubCliInstalled()) {
          execSync(
            "gh repo create --public --disable-wiki --disable-issues --source=.",
            { stdio: "inherit" },
          );
        } else {
          console.log(
            red(
              "GitHub CLI is not installed, so we can't create the repo on GitHub for you. Install it from here: https://cli.github.com/",
            ),
          );
        }
      } catch (error) {
        console.log(red("Failed to initialize git repository"));
      } finally {
        process.chdir(cwd);
      }
    }

    console.log("\nDone. Now run:\n");

    if (root !== cwd) {
      console.log(
        green(
          `  cd ${projectName.includes(" ") ? `"${projectName}"` : projectName}`,
        ),
      );
    }

    switch (packageManager) {
      case "yarn":
        console.log(green(`  ${packageManager}`));
        break;
      default:
        console.log(green(`  ${packageManager} install`));
        break;
    }

    console.log();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

function isGithubCliInstalled() {
  try {
    execSync("gh");
    return true;
  } catch (error) {
    return false;
  }
}

function initRepoAndCommit() {
  execSync("git init");
  execSync("git add .");
  execSync('git commit -m "Initial commit"');
}

init().catch((e) => {
  console.error(e);
});
