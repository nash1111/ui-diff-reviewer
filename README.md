# Bun AI DOM Diff CLI

A CLI tool that compares two URLs or HTML files, extracts DOM structural differences, and provides semantic evaluation using Azure OpenAI API.

## Features

- **Lightweight**: Built with Bun and Node-compatible libraries only
- **Structural Comparison**: Custom DOM difference extraction
- **Semantic Evaluation**: AI-powered intent summarization via Azure OpenAI API
- **JSON Output**: Machine-readable format for blogs and CI/CD integration
- **Local Comparison**: Built-in development server for testing HTML files

## Installation

```bash
bun install
cp .env.example .env
# Configure Azure OpenAI credentials in .env
```

## Usage

### 1. Start Development Server

```bash
bun run dev
```

This starts two servers:
- `http://localhost:3000` - serves test/v1.html
- `http://localhost:3001` - serves test/v2.html

### 2. Compare with CLI

Compare URLs:
```bash
bun run compare -- --url1 http://localhost:3000 --url2 http://localhost:3001
```

JSON output:
```bash
bun run compare -- --url1 http://localhost:3000 --url2 http://localhost:3001 --json
```

Compare local HTML files directly:
```bash
bun run compare -- --file1 ./test/v1.html --file2 ./test/v2.html
```

## CLI Options

| Option | Type | Description |
|--------|------|-------------|
| `--url1` | string | URL of the first page to compare |
| `--url2` | string | URL of the second page to compare |
| `--file1` | string | Local HTML file 1 |
| `--file2` | string | Local HTML file 2 |
| `--json` | boolean | JSON output mode (default is colored) |
| `--model` | string | AI model to use (optional) |
| `--help`, `-h` | boolean | Show help message |

## Environment Variables

Configure in `.env` file:

```env
AZURE_OPENAI_ENDPOINT="https://your-resource.openai.azure.com/"
AZURE_OPENAI_API_KEY="your-api-key-here"
AZURE_OPENAI_DEPLOYMENT="gpt-4o"
AZURE_OPENAI_API_VERSION="2025-01-01-preview"
```

## Output Examples

### Colored Output

```
============================================================
  DOM Diff Comparison Result
============================================================

Source 1: http://localhost:3000
Source 2: http://localhost:3001

Structure Differences: 5 change(s)
+ Added: <A>: "Contact" at /BODY[1]/HEADER[3]/NAV[5]
~ Modified text: "We launched a new service." → "We launched a new service. See details here."
↔ Replaced <DIV> with <SECTION> at /BODY[3]/MAIN[3]

AI Evaluation:
Summary: New links were added to the page, service descriptions were detailed, and semantic element changes were made.
Change Types: Added, Modified, Replaced
Impacted Sections: header, article, footer
Likely Intent: Updates aimed at improving user convenience and keeping information current.

============================================================
```

### JSON Output

```json
{
  "source1": "http://localhost:3000",
  "source2": "http://localhost:3001",
  "diff": {
    "diffs": [...],
    "count": 5,
    "summary": "..."
  },
  "aiEvaluation": {
    "summary": "...",
    "change_types": ["Added", "Modified", "Replaced"],
    "impacted_sections": ["header", "article", "footer"],
    "likely_intent": "..."
  }
}
```

## Directory Structure

```
ui-diff-reviewer/
├── src/
│   ├── cli.ts          # CLI entry point
│   ├── fetch.ts        # HTML fetching
│   ├── diff.ts         # DOM difference extraction
│   ├── ai-eval.ts      # Semantic evaluation with Azure OpenAI
│   ├── types.ts        # Type definitions
│   └── server.ts       # Development server
├── test/
│   ├── v1.html         # Test HTML v1
│   └── v2.html         # Test HTML v2
├── .env                # Environment variables
├── .env.example        # Environment variables template
├── package.json
└── README.md
```

## Tech Stack

- **Runtime**: Bun
- **Language**: TypeScript
- **DOM Parsing**: jsdom
- **AI Evaluation**: Azure OpenAI API (openai SDK)
- **CLI Output**: chalk

## License

MIT
