import fs from "node:fs";
import path from "node:path";

const configPath = process.argv[2];
const pluginPath = (process.argv[3] || "").replace(/\\/g, "/");

if (!configPath || !pluginPath) {
  console.error("usage: node merge-config.mjs <config-path> <plugin-path>");
  process.exit(2);
}

const entry = {
  package: pluginPath,
  options: {
    lang: "ru",
    threshold: 50,
    live: true,
  },
};

function timestamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function isWs(ch) {
  return ch === " " || ch === "\t" || ch === "\r" || ch === "\n";
}

function scanString(text, start) {
  let i = start + 1;
  while (i < text.length) {
    if (text[i] === "\\") {
      i += 2;
      continue;
    }
    if (text[i] === '"') return i + 1;
    i++;
  }
  return -1;
}

function skipWsAndComments(text, start) {
  let i = start;
  while (i < text.length) {
    if (isWs(text[i])) {
      i++;
      continue;
    }
    if (text[i] === "/" && text[i + 1] === "/") {
      i += 2;
      while (i < text.length && text[i] !== "\n") i++;
      continue;
    }
    if (text[i] === "/" && text[i + 1] === "*") {
      i += 2;
      while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) i++;
      i += 2;
      continue;
    }
    break;
  }
  return i;
}

function findMatching(text, start, open, close) {
  let depth = 0;
  let i = start;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '"') {
      const end = scanString(text, i);
      if (end < 0) return -1;
      i = end;
      continue;
    }
    if (ch === "/" && text[i + 1] === "/") {
      i += 2;
      while (i < text.length && text[i] !== "\n") i++;
      continue;
    }
    if (ch === "/" && text[i + 1] === "*") {
      i += 2;
      while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) i++;
      i += 2;
      continue;
    }
    if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return i;
    }
    i++;
  }
  return -1;
}

function indentOfLine(text, pos) {
  let start = pos;
  while (start > 0 && text[start - 1] !== "\n") start--;
  let end = start;
  while (end < text.length && (text[end] === " " || text[end] === "\t")) end++;
  return text.slice(start, end);
}

function findTopLevelKey(text, key) {
  let i = skipWsAndComments(text, 0);
  if (text[i] !== "{") return null;
  const rootEnd = findMatching(text, i, "{", "}");
  if (rootEnd < 0) return null;

  i++;
  while (i < rootEnd) {
    i = skipWsAndComments(text, i);
    if (i >= rootEnd) break;
    if (text[i] === ",") {
      i++;
      continue;
    }
    if (text[i] !== '"') return null;

    const keyEnd = scanString(text, i);
    if (keyEnd < 0) return null;
    let parsedKey;
    try {
      parsedKey = JSON.parse(text.slice(i, keyEnd));
    } catch {
      return null;
    }

    i = skipWsAndComments(text, keyEnd);
    if (text[i] !== ":") return null;
    i++;
    i = skipWsAndComments(text, i);

    const valueStart = i;
    let valueEnd;
    if (text[i] === "[") {
      valueEnd = findMatching(text, i, "[", "]");
    } else if (text[i] === "{") {
      valueEnd = findMatching(text, i, "{", "}");
    } else if (text[i] === '"') {
      valueEnd = scanString(text, i) - 1;
    } else {
      while (i < rootEnd && text[i] !== "," && text[i] !== "}") i++;
      valueEnd = i - 1;
    }
    if (valueEnd < 0) return null;

    if (parsedKey === key) {
      return { found: true, valueStart, valueEnd: valueEnd + 1, rootEnd };
    }
    i = valueEnd + 1;
  }
  return { found: false, valueStart: -1, valueEnd: -1, rootEnd };
}

function stripJsonc(text) {
  let out = "";
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '"') {
      const end = scanString(text, i);
      if (end < 0) throw new Error("Unterminated string");
      out += text.slice(i, end);
      i = end;
      continue;
    }
    if (ch === "/" && text[i + 1] === "/") {
      i += 2;
      while (i < text.length && text[i] !== "\n") i++;
      continue;
    }
    if (ch === "/" && text[i + 1] === "*") {
      i += 2;
      while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) i++;
      i += 2;
      continue;
    }
    out += ch;
    i++;
  }

  let cleaned = "";
  let inString = false;
  for (let j = 0; j < out.length; j++) {
    const c = out[j];
    if (inString) {
      cleaned += c;
      if (c === "\\") {
        cleaned += out[j + 1] ?? "";
        j++;
      } else if (c === '"') {
        inString = false;
      }
      continue;
    }
    if (c === '"') {
      inString = true;
      cleaned += c;
      continue;
    }
    if (c === ",") {
      let k = j + 1;
      while (k < out.length && isWs(out[k])) k++;
      if (out[k] === "]" || out[k] === "}") continue;
    }
    cleaned += c;
  }
  return cleaned;
}

function formatEntry(indent) {
  return JSON.stringify(entry, null, 2).replace(/\n/g, "\n" + indent);
}

function alreadyPresent(text) {
  if (text.includes(pluginPath)) return true;
  const escaped = pluginPath.replace(/\//g, "\\\\");
  return text.includes(escaped);
}

function insertIntoArray(text, valueStart, valueEnd) {
  const arrayText = text.slice(valueStart, valueEnd);
  const arrayEnd = valueEnd - 1;
  const closeIndent = indentOfLine(text, arrayEnd);
  const itemIndent = closeIndent + "  ";
  const inner = text.slice(valueStart + 1, arrayEnd);
  const trimmed = inner.replace(/\s+$/, "");

  let newInner;
  if (!trimmed.trim()) {
    newInner = "\n" + itemIndent + formatEntry(itemIndent) + "\n" + closeIndent;
  } else {
    const needsComma = !trimmed.trimEnd().endsWith(",");
    newInner =
      trimmed +
      (needsComma ? "," : "") +
      "\n" +
      itemIndent +
      formatEntry(itemIndent) +
      "\n" +
      closeIndent;
  }

  return text.slice(0, valueStart) + "[" + newInner + "]" + text.slice(valueEnd);
}

function insertNewKey(text, rootEnd) {
  const rootCloseIndent = indentOfLine(text, rootEnd);
  const propIndent = rootCloseIndent + "  ";
  const itemIndent = propIndent + "  ";

  let i = rootEnd - 1;
  while (i > 0 && isWs(text[i])) i--;
  const isEmpty = text.slice(0, i + 1).trimEnd().endsWith("{");
  const insertPos = i + 1;

  const block =
    (isEmpty ? "" : ",") +
    "\n" +
    propIndent +
    '"plugins": [\n' +
    itemIndent +
    formatEntry(itemIndent) +
    "\n" +
    propIndent +
    "]\n" +
    rootCloseIndent;

  return text.slice(0, insertPos) + block + text.slice(rootEnd);
}

function main() {
  fs.mkdirSync(path.dirname(configPath), { recursive: true });

  if (!fs.existsSync(configPath)) {
    const doc = {
      $schema: "https://opencode.ai/config.json",
      plugins: [entry],
    };
    fs.writeFileSync(configPath, JSON.stringify(doc, null, 2) + "\n", "utf8");
    console.log("created: " + configPath);
    console.log("plugin: " + pluginPath);
    return;
  }

  let text = fs.readFileSync(configPath, "utf8").replace(/^\uFEFF/, "");
  if (!text.trim()) {
    const doc = {
      $schema: "https://opencode.ai/config.json",
      plugins: [entry],
    };
    fs.writeFileSync(configPath, JSON.stringify(doc, null, 2) + "\n", "utf8");
    console.log("created (empty file): " + configPath);
    console.log("plugin: " + pluginPath);
    return;
  }

  if (alreadyPresent(text)) {
    console.log("already present: " + pluginPath);
    return;
  }

  const location = findTopLevelKey(text, "plugins");
  if (!location) {
    throw new Error("Cannot parse config as a JSON object");
  }

  let updated;
  if (location.found) {
    if (text[location.valueStart] !== "[") {
      throw new Error('"plugins" in config is not an array');
    }
    updated = insertIntoArray(text, location.valueStart, location.valueEnd);
  } else {
    updated = insertNewKey(text, location.rootEnd);
  }

  let parsed;
  try {
    parsed = JSON.parse(stripJsonc(updated));
  } catch (error) {
    throw new Error("Resulting config is not valid JSON/JSONC: " + error.message);
  }
  if (!Array.isArray(parsed.plugins)) {
    throw new Error("Resulting config has no plugins array");
  }

  const backup = configPath + ".bak-" + timestamp();
  fs.copyFileSync(configPath, backup);
  fs.writeFileSync(configPath, updated, "utf8");
  console.log("updated: " + configPath);
  console.log("backup: " + backup);
  console.log("plugin: " + pluginPath);
}

try {
  main();
} catch (error) {
  console.error("config update failed: " + error.message);
  process.exit(1);
}
