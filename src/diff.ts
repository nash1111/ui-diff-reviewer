import { JSDOM } from "jsdom";
import type { DiffResult } from "./types";

/**
 * Extract DOM differences between two HTML strings
 */
export function extractDiff(html1: string, html2: string): DiffResult {
  // Parse HTML using JSDOM
  const dom1 = new JSDOM(html1);
  const dom2 = new JSDOM(html2);

  const doc1 = dom1.window.document.body;
  const doc2 = dom2.window.document.body;

  // Extract structural differences manually
  const diffs = extractStructuralDifferences(doc1, doc2);

  // Generate human-readable summary
  const summary = generateDiffSummary(diffs);

  return {
    diffs,
    count: diffs.length,
    summary,
  };
}

interface SimpleDiff {
  action: string;
  element?: string;
  content?: string;
  oldValue?: string;
  newValue?: string;
  path?: string;
}

/**
 * Extract structural differences between two DOM elements
 */
function extractStructuralDifferences(
  node1: Element | Document | ChildNode,
  node2: Element | Document | ChildNode,
  path: string = ""
): SimpleDiff[] {
  const diffs: SimpleDiff[] = [];

  // Compare node types
  if (node1.nodeType !== node2.nodeType) {
    diffs.push({
      action: "replaceNode",
      path,
      oldValue: node1.nodeName,
      newValue: node2.nodeName,
    });
    return diffs;
  }

  // Compare text nodes
  if (node1.nodeType === 3) {
    // TEXT_NODE
    const text1 = node1.textContent?.trim() || "";
    const text2 = node2.textContent?.trim() || "";
    if (text1 !== text2 && text1 && text2) {
      diffs.push({
        action: "modifyTextElement",
        path,
        oldValue: text1,
        newValue: text2,
      });
    }
    return diffs;
  }

  // Compare element nodes
  if (node1.nodeType === 1 && node2.nodeType === 1) {
    // ELEMENT_NODE
    const el1 = node1 as Element;
    const el2 = node2 as Element;

    // Compare tag names
    if (el1.nodeName !== el2.nodeName) {
      diffs.push({
        action: "replaceElement",
        path,
        oldValue: el1.nodeName,
        newValue: el2.nodeName,
      });
      return diffs;
    }

    // Compare attributes
    const attrs1 = Array.from(el1.attributes || []);
    const attrs2 = Array.from(el2.attributes || []);

    const attrMap1 = new Map(attrs1.map((a) => [a.name, a.value]));
    const attrMap2 = new Map(attrs2.map((a) => [a.name, a.value]));

    // Check for added/modified attributes
    for (const [name, value] of attrMap2) {
      if (!attrMap1.has(name)) {
        diffs.push({
          action: "addAttribute",
          element: el1.nodeName,
          path,
          content: `${name}="${value}"`,
        });
      } else if (attrMap1.get(name) !== value) {
        diffs.push({
          action: "modifyAttribute",
          element: el1.nodeName,
          path,
          oldValue: `${name}="${attrMap1.get(name)}"`,
          newValue: `${name}="${value}"`,
        });
      }
    }

    // Check for removed attributes
    for (const [name, value] of attrMap1) {
      if (!attrMap2.has(name)) {
        diffs.push({
          action: "removeAttribute",
          element: el1.nodeName,
          path,
          content: `${name}="${value}"`,
        });
      }
    }

    // Compare children
    const children1 = Array.from(el1.childNodes);
    const children2 = Array.from(el2.childNodes);

    const maxLen = Math.max(children1.length, children2.length);

    for (let i = 0; i < maxLen; i++) {
      const child1 = children1[i];
      const child2 = children2[i];

      if (!child1 && child2) {
        diffs.push({
          action: "addElement",
          element: child2.nodeName,
          path: `${path}/${el1.nodeName}[${i}]`,
          content: child2.textContent?.substring(0, 50),
        });
      } else if (child1 && !child2) {
        diffs.push({
          action: "removeElement",
          element: child1.nodeName,
          path: `${path}/${el1.nodeName}[${i}]`,
          content: child1.textContent?.substring(0, 50),
        });
      } else if (child1 && child2) {
        diffs.push(
          ...extractStructuralDifferences(
            child1,
            child2,
            `${path}/${el1.nodeName}[${i}]`
          )
        );
      }
    }
  }

  return diffs;
}

/**
 * Generate a human-readable summary of the differences
 */
function generateDiffSummary(diffs: SimpleDiff[]): string {
  const summaryParts: string[] = [];

  for (const diff of diffs) {
    switch (diff.action) {
      case "addElement":
        const addContent = diff.content ? `: "${diff.content}"` : "";
        summaryParts.push(`+ Added: <${diff.element}>${addContent} at ${diff.path}`);
        break;
      case "removeElement":
        const removeContent = diff.content ? `: "${diff.content}"` : "";
        summaryParts.push(`- Removed: <${diff.element}>${removeContent} at ${diff.path}`);
        break;
      case "modifyTextElement":
        summaryParts.push(`~ Modified text: "${diff.oldValue}" → "${diff.newValue}"`);
        break;
      case "addAttribute":
        summaryParts.push(`+ Added attribute on <${diff.element}>: ${diff.content}`);
        break;
      case "removeAttribute":
        summaryParts.push(`- Removed attribute on <${diff.element}>: ${diff.content}`);
        break;
      case "modifyAttribute":
        summaryParts.push(`~ Modified attribute on <${diff.element}>: ${diff.oldValue} → ${diff.newValue}`);
        break;
      case "replaceElement":
        summaryParts.push(`↔ Replaced <${diff.oldValue}> with <${diff.newValue}> at ${diff.path}`);
        break;
      case "replaceNode":
        summaryParts.push(`↔ Replaced node ${diff.oldValue} with ${diff.newValue} at ${diff.path}`);
        break;
      default:
        summaryParts.push(`? Unknown action: ${diff.action}`);
    }
  }

  return summaryParts.join("\n");
}

/**
 * Format diff for AI consumption
 */
export function formatDiffForAI(diffResult: DiffResult): string {
  const { diffs, count, summary } = diffResult;

  return `
Number of differences: ${count}

Detailed changes:
${summary}

Raw diff data (for detailed analysis):
${JSON.stringify(diffs, null, 2)}
`.trim();
}
