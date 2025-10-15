#!/usr/bin/env bun

import chalk from "chalk";
import { fetchHTML } from "./fetch";
import { extractDiff, formatDiffForAI } from "./diff";
import { evaluateDifferences } from "./ai-eval";
import type { CLIOptions, ComparisonResult } from "./types";

/**
 * Parse command-line arguments
 */
function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  const options: CLIOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case "--url1":
        options.url1 = nextArg;
        i++;
        break;
      case "--url2":
        options.url2 = nextArg;
        i++;
        break;
      case "--file1":
        options.file1 = nextArg;
        i++;
        break;
      case "--file2":
        options.file2 = nextArg;
        i++;
        break;
      case "--json":
        options.json = true;
        break;
      case "--puppeteer":
        options.puppeteer = true;
        break;
      case "--model":
        options.model = nextArg;
        i++;
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
    }
  }

  return options;
}

/**
 * Print help message
 */
function printHelp() {
  console.log(`
${chalk.bold("Bun AI DOM Diff CLI")}

${chalk.yellow("Usage:")}
  bun run src/cli.ts [options]

${chalk.yellow("Options:")}
  --url1 <url>       URL of the first page to compare
  --url2 <url>       URL of the second page to compare
  --file1 <path>     Path to the first HTML file to compare
  --file2 <path>     Path to the second HTML file to compare
  --json             Output in JSON format
  --puppeteer        Enable JavaScript rendering (SPA support)
  --model <name>     AI model to use (optional)
  --help, -h         Show this help message

${chalk.yellow("Examples:")}
  bun run src/cli.ts --url1 http://localhost:3000 --url2 http://localhost:3001
  bun run src/cli.ts --file1 ./test/v1.html --file2 ./test/v2.html --json
  `);
}

/**
 * Validate CLI options
 */
function validateOptions(options: CLIOptions): void {
  const hasSource1 = options.url1 || options.file1;
  const hasSource2 = options.url2 || options.file2;

  if (!hasSource1 || !hasSource2) {
    console.error(chalk.red("Error: You must specify both sources to compare."));
    console.error("Use --url1/--url2 or --file1/--file2");
    printHelp();
    process.exit(1);
  }

  if (options.url1 && options.file1) {
    console.error(chalk.red("Error: Cannot specify both --url1 and --file1"));
    process.exit(1);
  }

  if (options.url2 && options.file2) {
    console.error(chalk.red("Error: Cannot specify both --url2 and --file2"));
    process.exit(1);
  }
}

/**
 * Main comparison logic
 */
async function compare(options: CLIOptions): Promise<ComparisonResult> {
  // Fetch HTML from both sources
  const source1 = options.url1 || options.file1!;
  const source2 = options.url2 || options.file2!;
  const isFile1 = !!options.file1;
  const isFile2 = !!options.file2;

  if (!options.json) {
    console.log(chalk.blue("Fetching HTML from sources..."));
  }

  const [result1, result2] = await Promise.all([
    fetchHTML(source1, isFile1),
    fetchHTML(source2, isFile2),
  ]);

  if (!options.json) {
    console.log(chalk.green("HTML fetched successfully"));
    console.log(chalk.blue("Calculating differences..."));
  }

  // Calculate differences
  const diffResult = extractDiff(result1.html, result2.html);

  if (!options.json) {
    console.log(chalk.green(`Found ${diffResult.count} difference(s)`));
    console.log(chalk.blue("Evaluating with AI..."));
  }

  // Evaluate with AI
  const diffDescription = formatDiffForAI(diffResult);
  const aiEvaluation = await evaluateDifferences(diffDescription, options.model);

  if (!options.json) {
    console.log(chalk.green("AI evaluation complete"));
  }

  return {
    source1: result1.source,
    source2: result2.source,
    diff: diffResult,
    aiEvaluation,
  };
}

/**
 * Format output for display
 */
function formatOutput(result: ComparisonResult, asJSON: boolean): void {
  if (asJSON) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  // Colorful CLI output
  console.log("\n" + chalk.bold.cyan("=".repeat(60)));
  console.log(chalk.bold.cyan("  DOM Diff Comparison Result"));
  console.log(chalk.bold.cyan("=".repeat(60)) + "\n");

  console.log(chalk.yellow("Source 1:") + " " + result.source1);
  console.log(chalk.yellow("Source 2:") + " " + result.source2);

  console.log("\n" + chalk.bold.magenta("Structure Differences:") + " " + result.diff.count + " change(s)");
  if (result.diff.summary) {
    console.log(chalk.gray(result.diff.summary));
  }

  console.log("\n" + chalk.bold.green("AI Evaluation:"));
  console.log(chalk.white("Summary: ") + result.aiEvaluation.summary);
  console.log(chalk.white("Change Types: ") + result.aiEvaluation.change_types.join(", "));
  console.log(chalk.white("Impacted Sections: ") + result.aiEvaluation.impacted_sections.join(", "));
  console.log(chalk.white("Likely Intent: ") + result.aiEvaluation.likely_intent);

  console.log("\n" + chalk.bold.cyan("=".repeat(60)) + "\n");
}

/**
 * Main entry point
 */
async function main() {
  try {
    const options = parseArgs();
    validateOptions(options);

    const result = await compare(options);
    formatOutput(result, !!options.json);
  } catch (error) {
    console.error(chalk.red("Error:"), error);
    process.exit(1);
  }
}

// Run the CLI
main();
