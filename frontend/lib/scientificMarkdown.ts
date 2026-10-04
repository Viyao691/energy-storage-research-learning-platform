const SCIENTIFIC_CODE = /(?:\\(?:frac|dfrac|tfrac|rightarrow|leftarrow|leftrightarrow|rightleftharpoons|mathrm|text|cdot|times|Delta|mu|alpha|beta|gamma|,)|(?<!\w)(?:[A-Z][A-Za-z0-9]{0,3}|[a-z])(?:[_^](?:\{[^}\n]+\}|[A-Za-z0-9+\-]+))+(?!\w)|[⇌→←])/;
const HTML_SCRIPTED_SCIENTIFIC_TOKEN = /((?:[A-Z][a-z]?\d*|e|\([A-Za-z0-9]+\)))((?:(?:<sup>[A-Za-z0-9+\-−–(). ]{1,16}<\/sup>)|(?:<sub>[A-Za-z0-9+\-−–(). ]{1,16}<\/sub>))+)/g;
const HTML_SCIENTIFIC_SCRIPT = /<(sup|sub)>([A-Za-z0-9+\-−–(). ]{1,16})<\/\1>/g;

const DIAGRAM_SUBSCRIPT: Record<string, string> = Object.fromEntries([..."0123456789+-x"].map((char, index) => [char, [..."₀₁₂₃₄₅₆₇₈₉₊₋ₓ"][index]]));
const DIAGRAM_SUPERSCRIPT: Record<string, string> = Object.fromEntries([..."0123456789+-"].map((char, index) => [char, [..."⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻"][index]]));

/** Display-only chemical notation; stored titles and search identities stay unchanged. */
export function normalizeChemicalText(text: string): string {
  const script = (value: string, superscript = false) => [...value].map(char => (superscript ? DIAGRAM_SUPERSCRIPT : DIAGRAM_SUBSCRIPT)[char] ?? char).join("");
  return text.replace(
    /(?<![A-Za-z0-9_])(?:(?:[A-Z][a-z]?|\((?:[A-Z][a-z]?[0-9]*)+\))(?:(?:[0-9]+(?:[./][0-9]+)?)|(?:[_^](?:\{[0-9x+\-./]+\}|[0-9x+\-./]+))|(?:<(?:sub|sup)>[0-9x+\-./]+<\/(?:sub|sup)>))?)+(?:[+−-])?(?![A-Za-z0-9_])/g,
    token => {
      if (/^[PO][23]$/.test(token)) return token;
      const explicit = /[_^]|<(?:sub|sup)>/.test(token);
      const elements = token.replace(/<(sub|sup)>.*?<\/\1>|[_^](?:\{[^}]+\}|[0-9x+\-./]+)/g, "").match(/[A-Z][a-z]?/g) ?? [];
      // Single-letter variables and bare O2 can be phase labels or mathematics.
      if (elements.some(element => !/^(?:H|He|Li|Be|B|C|N|O|F|Ne|Na|Mg|Al|Si|P|S|Cl|K|Ca|Ti|V|Cr|Mn|Fe|Co|Ni|Cu|Zn|Zr|Nb|Mo|Sn|La|W|M|T)$/.test(element))) return token;
      if (!explicit && elements.length < 2 && !/[+−-]$/.test(token)) return token;
      return token
        .replace(/<(sub|sup)>([0-9x+\-./]+)<\/\1>/g, (_match, kind: string, value: string) => script(value, kind === "sup"))
        .replace(/([_^])(?:\{([0-9x+\-./]+)\}|([0-9x+\-./]+))/g, (_match, kind: string, braced: string, bare: string) => script(braced ?? bare, kind === "^"))
        .replace(/([0-9]*)([+−-])$/, (_match, count: string, charge: string) => script(count + charge.replace("−", "-"), true))
        .replace(/[0-9]+(?:[./][0-9]+)?/g, value => script(value));
    },
  );
}

/** Unicode scripts survive Mermaid's strict security mode; only flowchart labels are edited. */
export function normalizeMermaidChemicalLabels(source: string): string {
  return source.split("\n").map(line => {
    if (/^\s*%%/.test(line)) return line;
    return line.replace(/(\b[A-Za-z_][\w-]*[\[({]{1,2})("[^"\n]*"|(?:[_^]\{[^}\n]*\}|[^\])}\n])*)([\])}]{1,2})|(\|)([^|\n]*)(\|)/g,
      (_match, node: string, text: string, end: string, edge: string, edgeText: string, edgeEnd: string) => (
        node ? node + normalizeChemicalText(text) + end : edge + normalizeChemicalText(edgeText) + edgeEnd
      ));
  }).join("\n");
}

/** Removes page locators from diagram labels without changing surrounding prose. */
export function stripMermaidPageReferences(source: string): string {
  const page = String.raw`(?:第\s*\d+(?:\s*[-–—、,，]\s*\d+)*\s*页|(?:pp?\.|pages?)\s*\d+(?:\s*[-–—,，]\s*\d+)*|页码\s*[:：]?\s*\d+(?:\s*[-–—、,，]\s*\d+)*)`;
  return source
    .replace(new RegExp(String.raw`[（(]\s*${page}\s*[)）]`, "gi"), "")
    .replace(new RegExp(String.raw`(?:<br\s*/?>\s*)?${page}`, "gi"), "");
}

/**
 * Normalizes the limited scientific notation variants commonly returned by
 * model providers. It deliberately leaves ordinary prose and code untouched.
 * KaTeX still performs the actual parsing and escapes unsafe HTML.
 */
export function normalizeScientificMarkdown(content: string): string {
  const markdownWithMermaid = normalizeUnfencedMermaid(content);
  return normalizeBareScientificTokens(
    wrapUnwrappedDisplayMath(normalizeEquationTags(normalizeLegacyScientificScripts(markdownWithMermaid)))
      .replace(/\\\[((?:.|\n)*?)\\\]/g, (_match, equation: string) => `$$${equation}$$`)
      .replace(/\\\((.*?)\\\)/g, (_match, equation: string) => `$${equation}$`)
      .replace(/`([^`\n]+)`/g, (match, code: string) => (
        SCIENTIFIC_CODE.test(code) ? `$${code}$` : match
      ))
  );
}

function normalizeUnfencedMermaid(content: string): string {
  return content.replace(
    /^([ \t]*)mermaid(?:[ \t]+|\r?\n[ \t]*)((?:flowchart|graph)[ \t]+(?:TB|TD|BT|RL|LR)\b[^\n]*(?:\n(?![ \t]*(?:#{1,6}\s|阅读主线[:：]|证据边界[:：]|[-*]\s|\d+\.\s))[^\n]+)*)/gim,
    (_match, indent: string, source: string) => {
      const diagram = source
        .replace(/^((?:flowchart|graph)[ \t]+(?:TB|TD|BT|RL|LR))[ \t]+/i, "$1\n")
        .replace(/([)\]])[ \t]+(?=[A-Za-z][A-Za-z0-9_-]*[ \t]*-->)/g, "$1\n");
      return `${indent}\`\`\`mermaid\n${diagram.trim()}\n\`\`\``;
    },
  );
}

function normalizeEquationTags(content: string): string {
  return content.replace(/\\tag\{([^}\n]+)\}/g, (_match, label: string) => `\\text{(${label})}`);
}

function wrapUnwrappedDisplayMath(content: string): string {
  return splitProtectedMarkdownSegments(content).map(segment => {
    if (segment.startsWith("$") || segment.startsWith("`")) {
      return segment;
    }
    return wrapUnwrappedDisplayMathSegment(segment);
  }).join("");
}

function wrapUnwrappedDisplayMathSegment(content: string): string {
  return content
    .replace(
      /(\\begin\{(aligned|align\*?|alignedat|array|cases|equation\*?|gather\*?|split)\}[\s\S]*?\\end\{\2\})/g,
      (_match, equation: string) => `\n\n$$\n${equation.trim()}\n$$\n\n`
    )
    .replace(
      /(^|\n)(\\(?:min|max|sum|prod|int|iint|iiint|lim)(?=[_{\\\s])[\s\S]*?\\text\{\([^\n]+\)\})(?=\n|$)/g,
      (_match, prefix: string, equation: string) => `${prefix}$$\n${equation.trim()}\n$$`
    );
}

function normalizeLegacyScientificScripts(content: string): string {
  return content.replace(
    HTML_SCRIPTED_SCIENTIFIC_TOKEN,
    (match, base: string, scripts: string) => {
      let converted = "";
      let count = 0;
      for (const script of scripts.matchAll(HTML_SCIENTIFIC_SCRIPT)) {
        const kind = script[1];
        const value = script[2].trim().replace(/[−–]/g, "-");
        converted += kind === "sup" ? `^{${value}}` : `_{${value}}`;
        count += 1;
      }
      return count > 0 ? `$${base}${converted}$` : match;
    }
  );
}

function normalizeBareScientificTokens(content: string): string {
  const segments = splitProtectedMarkdownSegments(content);
  return segments.map(segment => {
    if (segment.startsWith("$") || segment.startsWith("`")) {
      return segment;
    }
    return segment.replace(
      /(?<![$\\\w])((?:[A-Z][A-Za-z0-9]{0,3}|[a-z])(?:\^\{[^}\n]+\}|_\{[^}\n]+\}|\^[A-Za-z0-9+\-]+|_[A-Za-z0-9+\-]+)+)(?![$\w])/g,
      (_match, formula: string) => `$${formula}$`
    );
  }).join("");
}

function splitProtectedMarkdownSegments(content: string): string[] {
  return content.split(/(```[\s\S]*?```|\$\$[\s\S]*?\$\$|\$[^\n$]+?\$|`[^`\n]*`)/g);
}

/** Hides explicit evidence labels in generated paper prose without touching code or math. */
export function stripPaperEvidenceAnnotations(content: string): string {
  const labels = "作者事实|作者结论|原始数据|AI归纳|AI推断|AI质疑|AI假设|尚不确定";
  const page = String.raw`第\s*\d+(?:\s*[-–—－、,，]\s*\d+)*\s*页`;
  const label = String.raw`(?:${labels})(?:\s*[,，]\s*${page})?`;
  const annotation = new RegExp(String.raw`(?:\[\s*${label}\s*\]|【\s*${label}\s*】|\(\s*${label}\s*\)|（\s*${label}\s*）)`, "g");
  return splitProtectedMarkdownSegments(content).map(segment => {
    if (segment.startsWith("`") || segment.startsWith("$")) return segment;
    return segment.replace(annotation, (match: string, offset: number, source: string) => {
      // Inline Markdown links are ordinary content.
      return /^[\[【]/.test(match) && /^\s*\(/.test(source.slice(offset + match.length)) ? match : "";
    });
  }).join("");
}
