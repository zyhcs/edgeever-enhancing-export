/**
 * EdgeEver Enhancing Export Plugin
 * 专业级多格式增强导出插件 (Inspired by obsidian-enhancing-export)
 * 深度适配 EdgeEver 笔记系统，提供纯净白色优雅排版、Mac 风格全语法高亮代码块、全量图片 Base64 内嵌与自适应版心、Word (.doc)、独立 HTML、纯净与博客 Markdown、高保真无弹窗 PDF 打印、页面排版自定义（宽度/页边距/页头独立开关/页尾独立开关/系统变量与多样化水印）及 Pandoc 智能检测指引。
 */

// ==================== 1. 专业级代码语法高亮引擎 ====================
const GRAMMARS = {
  abap: [
    { type: "comment", pattern: /(?:^\*|\n\*)[^\r\n]*|"[^\r\n]*/g },
    { type: "string", pattern: /'(?:''|[^'\r\n])*'|`(?:``|[^`\r\n])*`|\|(?:\\\||[^|\r\n])*\|/g },
    { type: "abap-system-var", pattern: /\b(?:SY|SYST)-[A-Z0-9_]+\b/gi },
    { type: "number", pattern: /\b\d+(?:\.\d+)?\b/g },
    {
      type: "keyword",
      pattern:
        /\b(?:REPORT|PROGRAM|DATA|TYPES|CONSTANTS|STATICS|PARAMETERS|SELECT-OPTIONS|FIELD-SYMBOLS|CLASS|ENDCLASS|INTERFACE|ENDINTERFACE|METHOD|ENDMETHOD|MODULE|ENDMODULE|FORM|ENDFORM|FUNCTION|ENDFUNCTION|DO|ENDDO|WHILE|ENDWHILE|LOOP|ENDLOOP|AT|ENDAT|IF|ELSEIF|ELSE|ENDIF|CASE|WHEN|ENDCASE|TRY|CATCH|CLEANUP|ENDTRY|CHECK|EXIT|CONTINUE|RETURN|REJECT|STOP|CALL|RECEIVING|IMPORTING|EXPORTING|CHANGING|TABLES|EXCEPTIONS|PERFORM|SUBMIT|LEAVE|RAISE|MESSAGE|SELECT|SINGLE|FROM|INTO|CORRESPONDING|FIELDS|WHERE|GROUP|BY|HAVING|ORDER|APPENDING|INSERT|UPDATE|MODIFY|DELETE|COMMIT|WORK|ROLLBACK|OPEN|FETCH|CLOSE|READ|TABLE|APPEND|SORT|ASSIGN|UNASSIGN|CLEAR|FREE|MOVE|MOVE-CORRESPONDING|CONCATENATE|SPLIT|CONDENSE|TRANSLATE|REPLACE|SEARCH|SHIFT|DESCRIBE|COMPUTE|ADD|SUBTRACT|MULTIPLY|DIVIDE|TYPE|LIKE|REF|TO|VALUE|INITIAL|OPTIONAL|DEFAULT|STANDARD|SORTED|HASHED|INDEX|KEY|WITH|TRANSPORTING|NO|UP|ROWS|EQ|NE|LT|LE|GT|GE|AND|OR|NOT|BETWEEN|IN|IS|ASSIGNED|BOUND|DEFINITION|IMPLEMENTATION|PUBLIC|PROTECTED|PRIVATE|ABSTRACT|FINAL|FOR|TESTING|INHERITING|INTERFACES|EVENTS|ALIASES|CREATE|OBJECT|SET|GET|HANDLER|ACTIVATION|STATUS|TITLEBAR)\b/gi,
    },
    { type: "operator", pattern: /->|=>|[-+*\/=<>~]|&&|\|\|/g },
  ],
  javascript: [
    { type: "comment", pattern: /\/\*[\s\S]*?\*\/|\/\/[^\r\n]*/g },
    { type: "string", pattern: /(["'`])(?:\\[\s\S]|(?!\1)[^\\])*\1/g },
    {
      type: "keyword",
      pattern:
        /\b(?:async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|export|extends|finally|for|from|function|get|if|import|in|instanceof|let|new|of|return|set|static|super|switch|this|throw|try|typeof|var|void|while|with|yield|type|interface|enum|implements)\b/g,
    },
    { type: "number", pattern: /\b(?:0[xX][0-9a-fA-F]+|0[bB][01]+|\d+(?:\.\d+)?)\b/g },
    { type: "function", pattern: /\b[a-zA-Z_$][a-zA-Z0-9_$]*(?=\s*\()/g },
    { type: "operator", pattern: /[-+*\/%=!&|<>^?~:]+/g },
  ],
  python: [
    { type: "comment", pattern: /#[^\r\n]*/g },
    { type: "string", pattern: /(?:"""[\s\S]*?"""|'''[\s\S]*?'''|(["'])(?:\\[\s\S]|(?!\1)[^\\])*\1)/g },
    {
      type: "keyword",
      pattern:
        /\b(?:and|as|assert|async|await|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield|True|False|None)\b/g,
    },
    { type: "number", pattern: /\b\d+(?:\.\d+)?\b/g },
    { type: "function", pattern: /\b[a-zA-Z_][a-zA-Z0-9_]*(?=\s*\()/g },
    { type: "operator", pattern: /[-+*\/%=!&|<>^~:]+/g },
  ],
  sql: [
    { type: "comment", pattern: /--[^\r\n]*|\/\*[\s\S]*?\*\//g },
    { type: "string", pattern: /'(?:''|[^'\r\n])*'/g },
    {
      type: "keyword",
      pattern:
        /\b(?:SELECT|FROM|WHERE|INSERT|INTO|UPDATE|DELETE|JOIN|LEFT|RIGHT|INNER|OUTER|FULL|CROSS|ON|ORDER|BY|GROUP|HAVING|LIMIT|OFFSET|UNION|ALL|AS|DISTINCT|CREATE|TABLE|INDEX|VIEW|DROP|ALTER|PRIMARY|KEY|FOREIGN|REFERENCES|CHECK|DEFAULT|NULL|NOT|AND|OR|IN|BETWEEN|LIKE|IS|EXISTS|CASE|WHEN|THEN|ELSE|END)\b/gi,
    },
    { type: "number", pattern: /\b\d+(?:\.\d+)?\b/g },
    { type: "function", pattern: /\b(?:COUNT|SUM|AVG|MIN|MAX|COALESCE|NOW|CONCAT|SUBSTRING|TRIM)\b/gi },
    { type: "operator", pattern: /[-+*\/=<>!&|]+/g },
  ],
  json: [
    { type: "keyword", pattern: /"(?:\\.|[^\\"\r\n])*"(?=\s*:)/g },
    { type: "string", pattern: /"(?:\\.|[^\\"\r\n])*"/g },
    { type: "number", pattern: /-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/g },
    { type: "keyword", pattern: /\b(?:true|false|null)\b/g },
    { type: "operator", pattern: /[{}[\]:,]/g },
  ],
  bash: [
    { type: "comment", pattern: /#[^\r\n]*/g },
    { type: "string", pattern: /(["'])(?:\\[\s\S]|(?!\1)[^\\])*\1/g },
    {
      type: "keyword",
      pattern: /\b(?:if|then|else|elif|fi|for|while|until|do|done|in|case|esac|function|return|exit|export|local)\b/g,
    },
    { type: "abap-system-var", pattern: /\$[a-zA-Z0-9_?*#@!$-]+/g },
    { type: "function", pattern: /\b[a-zA-Z_][a-zA-Z0-9_-]*(?=\s*\()/g },
  ],
};

GRAMMARS.typescript = GRAMMARS.javascript;
GRAMMARS.ts = GRAMMARS.javascript;
GRAMMARS.js = GRAMMARS.javascript;
GRAMMARS.py = GRAMMARS.python;
GRAMMARS.sh = GRAMMARS.bash;
GRAMMARS.shell = GRAMMARS.bash;

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function highlightCode(code, lang) {
  const normLang = (lang || "").toLowerCase().trim();
  const rules = GRAMMARS[normLang] || (normLang === "abap" ? GRAMMARS.abap : null);

  if (!rules) {
    return escapeHtml(code);
  }

  const matches = [];
  for (const rule of rules) {
    let match;
    const re = new RegExp(rule.pattern.source, rule.pattern.flags);
    while ((match = re.exec(code)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[0],
        type: rule.type,
      });
    }
  }

  matches.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));

  const nonOverlapping = [];
  let lastEnd = 0;
  for (const m of matches) {
    if (m.start >= lastEnd) {
      nonOverlapping.push(m);
      lastEnd = m.end;
    }
  }

  let result = "";
  let curIndex = 0;
  for (const m of nonOverlapping) {
    if (m.start > curIndex) {
      result += escapeHtml(code.slice(curIndex, m.start));
    }
    result += `<span class="hl-${m.type}">${escapeHtml(m.text)}</span>`;
    curIndex = m.end;
  }
  if (curIndex < code.length) {
    result += escapeHtml(code.slice(curIndex));
  }

  return result;
}

// ==================== 2. 标准白色排版与系统变量/多样化水印 ====================
const WHITE_STYLE = {
  bg: "#ffffff",
  text: "#1f2328",
  muted: "#64748b",
  border: "#e2e8f0",
  codeBg: "#1e1e24",
  accent: "#059669",
  blockquoteBorder: "#10b981",
  tableHeaderBg: "#f8fafc",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif',
};

// 系统变量解析器：支持 {date}, {time}, {datetime}, {title}, {user} 等动态占位符
function resolveWatermarkVariables(template, article) {
  if (!template) return "";
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const dateStr = `${year}-${month}-${day}`;

  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const timeStr = `${hours}:${minutes}`;
  const dtStr = `${dateStr} ${timeStr}`;

  const titleStr = article?.title || "未命名笔记";

  return template
    .replace(/\{\{\s*date\s*\}\}|\{\s*date\s*\}/gi, dateStr)
    .replace(/\{\{\s*time\s*\}\}|\{\s*time\s*\}/gi, timeStr)
    .replace(/\{\{\s*datetime\s*\}\}|\{\s*datetime\s*\}/gi, dtStr)
    .replace(/\{\{\s*title\s*\}\}|\{\s*title\s*\}/gi, titleStr)
    .replace(/\{\{\s*(?:user|author)\s*\}\}|\{\s*(?:user|author)\s*\}/gi, "EdgeEver");
}

// 多样化水印生成器：支持密集平铺、稀疏平铺、水平平铺与居中大印章
function generateWatermarkBackground(text, mode = "tile-dense") {
  if (!text || !text.trim() || mode === "center-stamp") return "";
  const clean = escapeHtml(text.trim());

  if (mode === "tile-sparse") {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='440' height='260'><text x='40' y='160' fill='rgba(100,116,139,0.08)' font-size='18' font-family='sans-serif' font-weight='600' transform='rotate(-26 220 130)'>${clean}</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  } else if (mode === "horizontal") {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='150'><text x='30' y='90' fill='rgba(100,116,139,0.08)' font-size='16' font-family='sans-serif' font-weight='600'>${clean}</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  } else {
    // 默认密集倾斜平铺 (tile-dense)
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='250' height='150'><text x='25' y='95' fill='rgba(100,116,139,0.09)' font-size='16' font-family='sans-serif' font-weight='600' transform='rotate(-28 125 75)'>${clean}</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }
}

// ==================== 3. 文本清洗与反斜杠下划线还原 ====================
function cleanEscapedUnderscores(markdown) {
  if (!markdown) return "";
  const codeBlocks = [];
  let text = markdown.replace(/(```[\s\S]*?```|`[^`\n]+`)/g, (match) => {
    const placeholder = `__EE_CODE_CLEAN_PROTECT_${codeBlocks.length}__`;
    codeBlocks.push(match);
    return placeholder;
  });

  // 将所有 \_ 还原为纯净原生的下划线 _
  text = text.replace(/\\_/g, "_");

  return text.replace(/__EE_CODE_CLEAN_PROTECT_(\d+)__/g, (_m, idx) => codeBlocks[Number(idx)] || "");
}

// ==================== 4. 图片提取与 Base64 转换器 ====================
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function resolveImageToDataUrl(src, context) {
  if (!src) return "";
  const trimmed = src.trim();

  if (trimmed.startsWith("data:")) {
    return trimmed;
  }

  const resMatch = trimmed.match(/(res_[a-f0-9]{24,40})/);
  if (resMatch) {
    const resId = resMatch[1];
    if (context.resources && typeof context.resources.read === "function") {
      try {
        const blob = await context.resources.read(resId);
        if (blob) {
          const b64 = await blobToBase64(blob);
          if (b64 && b64.startsWith("data:")) return b64;
        }
      } catch (e) {
        console.warn(`[Enhancing Export] resources.read failed for ${resId}:`, e);
      }
    }

    try {
      const domImgs = document.querySelectorAll("img");
      for (const img of domImgs) {
        if (img.src && (img.src.includes(resId) || img.getAttribute("src")?.includes(resId))) {
          if (img.complete && img.naturalWidth > 0) {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL("image/png");
            if (dataUrl && dataUrl.startsWith("data:")) return dataUrl;
          }
        }
      }
    } catch (e) {
      console.warn(`[Enhancing Export] DOM image extraction failed for ${resId}:`, e);
    }

    if (trimmed.startsWith("/")) {
      const baseUrl =
        window.location.origin && window.location.origin !== "null" && window.location.origin !== "file://"
          ? window.location.origin
          : "https://edgeever.zyh-cjs.workers.dev";
      return `${baseUrl}${trimmed}`;
    }
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const domImgs = document.querySelectorAll("img");
      for (const img of domImgs) {
        if (img.src === trimmed || img.getAttribute("src") === trimmed) {
          if (img.complete && img.naturalWidth > 0) {
            try {
              const canvas = document.createElement("canvas");
              canvas.width = img.naturalWidth;
              canvas.height = img.naturalHeight;
              const ctx = canvas.getContext("2d");
              ctx.drawImage(img, 0, 0);
              const dataUrl = canvas.toDataURL("image/png");
              if (dataUrl && dataUrl.startsWith("data:")) return dataUrl;
            } catch (corsErr) {}
          }
        }
      }
    } catch (e) {}

    return trimmed;
  }

  if (trimmed.startsWith("/")) {
    const baseUrl =
      window.location.origin && window.location.origin !== "null" && window.location.origin !== "file://"
        ? window.location.origin
        : "https://edgeever.zyh-cjs.workers.dev";
    return `${baseUrl}${trimmed}`;
  }

  return trimmed;
}

async function resolveAllImagesInMarkdown(rawMarkdown, context) {
  if (!rawMarkdown) return "";
  let result = rawMarkdown;

  const mdImgMatches = [...rawMarkdown.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)];
  for (const m of mdImgMatches) {
    const fullMatch = m[0];
    const alt = m[1];
    const rawSrc = m[2];
    const resolved = await resolveImageToDataUrl(rawSrc, context);
    if (resolved && resolved !== rawSrc) {
      result = result.split(fullMatch).join(`![${alt}](${resolved})`);
    }
  }

  const htmlImgMatches = [...rawMarkdown.matchAll(/<img\s+[^>]*src=["']([^"']+)["'][^>]*>/gi)];
  for (const m of htmlImgMatches) {
    const fullTag = m[0];
    const rawSrc = m[1];
    const resolved = await resolveImageToDataUrl(rawSrc, context);
    if (resolved && resolved !== rawSrc) {
      const newTag = fullTag.replace(rawSrc, resolved);
      result = result.split(fullTag).join(newTag);
    }
  }

  return result;
}

// ==================== 5. 高保真 Markdown 解析与渲染引擎 ====================
function renderMarkdownToHtml(markdown) {
  if (!markdown) return "";

  let md = cleanEscapedUnderscores(markdown.replace(/\r\n/g, "\n"));

  // 1. 抽取并保护代码块
  const codeBlocks = [];
  md = md.replace(/```([a-zA-Z0-9_\-+]*)\n([\s\S]*?)```/g, (_m, lang, code) => {
    const placeholder = `__EE_CODE_BLOCK_${codeBlocks.length}__`;
    codeBlocks.push({ lang: (lang || "").trim(), code });
    return placeholder;
  });

  // 2. 抽取并保护数学公式
  const mathBlocks = [];
  md = md.replace(/\$\$([\s\S]*?)\$\$/g, (_m, math) => {
    const placeholder = `__EE_MATH_BLOCK_${mathBlocks.length}__`;
    mathBlocks.push(math.trim());
    return placeholder;
  });

  const mathInlines = [];
  md = md.replace(/\$([^\$\n]+?)\$/g, (_m, math) => {
    const placeholder = `__EE_MATH_INLINE_${mathInlines.length}__`;
    mathInlines.push(math.trim());
    return placeholder;
  });

  // 3. 逐行块级解析
  const lines = md.split("\n");
  const htmlParts = [];
  let inList = false;
  let listType = "ul";
  let inBlockquote = false;
  let inTable = false;
  let tableRows = [];

  function flushList() {
    if (inList) {
      htmlParts.push(`</${listType}>`);
      inList = false;
    }
  }

  function flushBlockquote() {
    if (inBlockquote) {
      htmlParts.push("</blockquote>");
      inBlockquote = false;
    }
  }

  function flushTable() {
    if (inTable) {
      if (tableRows.length > 0) {
        let tableHtml = '<div class="ee-table-wrapper"><table>';
        const header = tableRows[0];
        tableHtml += "<thead><tr>";
        header.forEach((c) => (tableHtml += `<th>${renderInline(c)}</th>`));
        tableHtml += "</tr></thead><tbody>";

        for (let i = 1; i < tableRows.length; i++) {
          tableHtml += "<tr>";
          tableRows[i].forEach((c) => (tableHtml += `<td>${renderInline(c)}</td>`));
          tableHtml += "</tr>";
        }
        tableHtml += "</tbody></table></div>";
        htmlParts.push(tableHtml);
      }
      tableRows = [];
      inTable = false;
    }
  }

  function renderInline(text) {
    let s = escapeHtml(text);

    s = s.replace(/__EE_MATH_INLINE_(\d+)__/g, (_m, idx) => {
      const code = mathInlines[Number(idx)] || "";
      return `<span class="ee-math-inline">${escapeHtml(code)}</span>`;
    });

    s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, alt, src) => {
      return `<img src="${src}" alt="${alt}" class="ee-img" loading="lazy" style="max-width: 100%; height: auto; display: block; margin: 1.2em auto;" />`;
    });

    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label, href) => {
      return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="ee-link">${label}</a>`;
    });

    s = s.replace(/`([^`]+)`/g, (_m, code) => {
      return `<code class="ee-inline-code">${code}</code>`;
    });

    s = s.replace(/\*\*\*([^*]+)\*\*\*/g, "<strong><em>$1</em></strong>");
    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>");

    // 严谨匹配斜体：禁止匹配单词内部下划线（如 WS_REVERSE_GOODS_ISSUE 绝不触发斜体！）
    s = s.replace(/(?:^|\s)_([^_]+)_(?=\s|$)/g, " <em>$1</em> ");

    s = s.replace(/~~([^~]+)~~/g, "<del>$1</del>");
    s = s.replace(/==([^=]+)==/g, "<mark>$1</mark>");
    s = s.replace(/(?:^|\s)#([a-zA-Z0-9_\u4e00-\u9fa5]+)/g, ' <span class="ee-tag">#$1</span>');

    return s;
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      flushList();
      flushBlockquote();
      flushTable();
      continue;
    }

    if (/^\|?(\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?$/.test(trimmed)) {
      continue;
    }

    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      flushList();
      flushBlockquote();
      inTable = true;
      const cells = trimmed
        .slice(1, -1)
        .split("|")
        .map((c) => c.trim());
      tableRows.push(cells);
      continue;
    } else {
      flushTable();
    }

    const headerMatch = rawLine.match(/^(#{1,6})\s+(.*)$/);
    if (headerMatch) {
      flushList();
      flushBlockquote();
      const level = headerMatch[1].length;
      const content = headerMatch[2].trim();
      const id = content.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, "-");
      htmlParts.push(`<h${level} id="${id}">${renderInline(content)}</h${level}>`);
      continue;
    }

    if (/^(\*{3,}|-{3,}|_{3,})$/.test(trimmed)) {
      flushList();
      flushBlockquote();
      htmlParts.push("<hr />");
      continue;
    }

    if (trimmed.startsWith(">")) {
      flushList();
      if (!inBlockquote) {
        htmlParts.push("<blockquote>");
        inBlockquote = true;
      }
      const bqContent = trimmed.replace(/^>\s?/, "");
      htmlParts.push(`<p>${renderInline(bqContent)}</p>`);
      continue;
    } else {
      flushBlockquote();
    }

    const taskMatch = trimmed.match(/^[-*+]\s+\[([ xX])\]\s+(.*)$/);
    if (taskMatch) {
      if (!inList || listType !== "ul") {
        flushList();
        htmlParts.push('<ul class="ee-task-list">');
        inList = true;
        listType = "ul";
      }
      const isChecked = taskMatch[1].toLowerCase() === "x";
      htmlParts.push(
        `<li class="ee-task-item"><input type="checkbox" ${isChecked ? "checked" : ""} disabled /> <span>${renderInline(
          taskMatch[2]
        )}</span></li>`
      );
      continue;
    }

    const ulMatch = trimmed.match(/^[-*+]\s+(.*)$/);
    if (ulMatch) {
      if (!inList || listType !== "ul") {
        flushList();
        htmlParts.push("<ul>");
        inList = true;
        listType = "ul";
      }
      htmlParts.push(`<li>${renderInline(ulMatch[1])}</li>`);
      continue;
    }

    const olMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (olMatch) {
      if (!inList || listType !== "ol") {
        flushList();
        htmlParts.push("<ol>");
        inList = true;
        listType = "ol";
      }
      htmlParts.push(`<li>${renderInline(olMatch[2])}</li>`);
      continue;
    }

    flushList();

    if (trimmed.startsWith("__EE_CODE_BLOCK_") && trimmed.endsWith("__")) {
      htmlParts.push(trimmed);
      continue;
    }

    if (trimmed.startsWith("__EE_MATH_BLOCK_") && trimmed.endsWith("__")) {
      htmlParts.push(trimmed);
      continue;
    }

    htmlParts.push(`<p>${renderInline(rawLine)}</p>`);
  }

  flushList();
  flushBlockquote();
  flushTable();

  let finalHtml = htmlParts.join("\n");

  // 还原代码块：注入 Mac 三色圆点 + 语言徽标 + 语法高亮着色
  finalHtml = finalHtml.replace(/__EE_CODE_BLOCK_(\d+)__/g, (_m, idx) => {
    const item = codeBlocks[Number(idx)];
    if (!item) return "";
    const lang = item.lang || "plaintext";
    const highlightedCode = highlightCode(item.code, lang);

    return `
      <div class="ee-code-block-wrapper">
        <div class="ee-code-header">
          <div class="ee-code-dots">
            <span class="ee-dot ee-dot-red"></span>
            <span class="ee-dot ee-dot-yellow"></span>
            <span class="ee-dot ee-dot-green"></span>
          </div>
          <span class="ee-code-lang">${escapeHtml(lang.toUpperCase())}</span>
        </div>
        <pre class="ee-code-pre"><code class="language-${escapeHtml(lang)}">${highlightedCode}</code></pre>
      </div>
    `;
  });

  finalHtml = finalHtml.replace(/__EE_MATH_BLOCK_(\d+)__/g, (_m, idx) => {
    const math = mathBlocks[Number(idx)] || "";
    return `
      <div class="ee-math-block">
        <div class="ee-math-tex">\\[ ${escapeHtml(math)} \\]</div>
      </div>
    `;
  });

  return finalHtml;
}

// ==================== 6. 打印与 Office 辅助生成器 ====================

// 针对 PDF 打印的 CSS Paged Media 计数器生成器
function generateCssPrintCounterContent(footerText) {
  if (!footerText) return '""';
  let text = footerText.trim();
  if (/第\s*1\s*页\s*\/\s*共\s*1\s*页/.test(text)) {
    text = "第 {page} 页 / 共 {pages} 页";
  }

  if (text.includes("{page}") || text.includes("{pages}")) {
    const parts = text.split(/(\{page\}|\{pages\})/);
    const cssParts = parts
      .filter((p) => p.length > 0)
      .map((p) => {
        if (p === "{page}") return "counter(page)";
        if (p === "{pages}") return "counter(pages)";
        return JSON.stringify(p);
      });
    return cssParts.join(" ");
  }

  return JSON.stringify(text);
}

// 针对 Word (.doc) 的原生 VML 底层防选中只读水印生成器
function generateWordVmlWatermark(watermarkText, watermarkMode) {
  if (!watermarkText) return "";
  const cleanText = escapeHtml(watermarkText);

  const shapetype = `
    <!--[if gte vml 1]>
    <v:shapetype id="WordWatermarkShape" coordsize="21600,21600" o:spt="136" adj="10800" path="m@7,l@8,m@5,21600l@6,21600e">
      <v:path textpathok="t" o:connecttype="rect"/>
      <v:textpath on="t" fitshape="t"/>
      <v:handles>
        <v:h position="#0,bottomRight" xrange="6629,14971"/>
      </v:handles>
      <o:lock v:ext="edit" text="t" shapetype="t"/>
    </v:shapetype>
  `;

  let shapes = "";
  if (watermarkMode === "center-stamp") {
    shapes = `
      <v:shape id="WM_Center" type="#WordWatermarkShape"
        style='position:absolute;left:0;top:0;width:480pt;height:140pt;z-index:-251657216;mso-position-horizontal:center;mso-position-horizontal-relative:margin;mso-position-vertical:center;mso-position-vertical-relative:margin;rotation:-28'
        fillcolor="#94a3b8" stroked="f">
        <v:fill opacity="0.18"/>
        <v:textpath style='font-family:"Microsoft YaHei","SimSun",sans-serif;font-size:38pt;font-weight:bold' string="${cleanText}"/>
      </v:shape>
    `;
  } else if (watermarkMode === "horizontal") {
    const tops = ["150pt", "380pt", "610pt"];
    shapes = tops
      .map(
        (top, idx) => `
      <v:shape id="WM_H_${idx}" type="#WordWatermarkShape"
        style='position:absolute;left:0;top:${top};width:460pt;height:65pt;z-index:-251657216;mso-position-horizontal:center;mso-position-horizontal-relative:margin;rotation:0'
        fillcolor="#94a3b8" stroked="f">
        <v:fill opacity="0.15"/>
        <v:textpath style='font-family:"Microsoft YaHei","SimSun",sans-serif;font-size:22pt;font-weight:bold' string="${cleanText}"/>
      </v:shape>
    `
      )
      .join("\n");
  } else if (watermarkMode === "tile-dense") {
    const points = [
      { top: "80pt", left: "-60pt" },
      { top: "80pt", left: "240pt" },
      { top: "320pt", left: "-60pt" },
      { top: "320pt", left: "240pt" },
      { top: "560pt", left: "-60pt" },
      { top: "560pt", left: "240pt" },
    ];
    shapes = points
      .map(
        (p, idx) => `
      <v:shape id="WM_Dense_${idx}" type="#WordWatermarkShape"
        style='position:absolute;left:${p.left};top:${p.top};width:250pt;height:70pt;z-index:-251657216;rotation:-28'
        fillcolor="#94a3b8" stroked="f">
        <v:fill opacity="0.13"/>
        <v:textpath style='font-family:"Microsoft YaHei","SimSun",sans-serif;font-size:18pt;font-weight:bold' string="${cleanText}"/>
      </v:shape>
    `
      )
      .join("\n");
  } else {
    const points = [
      { top: "180pt", left: "10pt" },
      { top: "500pt", left: "60pt" },
    ];
    shapes = points
      .map(
        (p, idx) => `
      <v:shape id="WM_Sparse_${idx}" type="#WordWatermarkShape"
        style='position:absolute;left:${p.left};top:${p.top};width:380pt;height:90pt;z-index:-251657216;rotation:-26'
        fillcolor="#94a3b8" stroked="f">
        <v:fill opacity="0.14"/>
        <v:textpath style='font-family:"Microsoft YaHei","SimSun",sans-serif;font-size:24pt;font-weight:bold' string="${cleanText}"/>
      </v:shape>
    `
      )
      .join("\n");
  }

  return `${shapetype}\n${shapes}\n<![endif]-->`;
}

// 针对 Word (.doc) 的原生域代码页码转换器
function formatWordFooterWithFields(footerText) {
  if (!footerText) return "";
  let text = footerText.trim();
  if (/第\s*1\s*页\s*\/\s*共\s*1\s*页/.test(text)) {
    text = "第 {page} 页 / 共 {pages} 页";
  }

  const pageField = `<span style='mso-field-code:" PAGE "'>1</span>`;
  const pagesField = `<span style='mso-field-code:" NUMPAGES "'>1</span>`;

  return escapeHtml(text)
    .replace(/\{page\}/g, pageField)
    .replace(/\{pages\}/g, pagesField);
}

// ==================== 7. 独立 HTML 与 PDF 打印生成器 ====================
function generateStandaloneHtml(article, options = {}) {
  const { title, contentHtml } = article;
  const fontSize = options.fontSize || 15;
  const contentWidth = options.contentWidth || "820px";

  // 水印与显示方式
  const watermarkText = (options.watermarkResolved || "").trim();
  const watermarkMode = options.watermarkMode || "tile-dense";
  const watermarkSvg = generateWatermarkBackground(watermarkText, watermarkMode);
  const isCenterStamp = watermarkMode === "center-stamp" && Boolean(watermarkText);
  const hasWatermark = Boolean(watermarkText);

  // 页头与页尾：有就有，没有就没有
  const hasHeader = Boolean(options.enableHeader && options.headerText && options.headerText.trim());
  const headerText = hasHeader ? options.headerText.trim() : "";

  const hasFooter = Boolean(options.enableFooter && options.footerText && options.footerText.trim());
  const footerText = hasFooter ? options.footerText.trim() : "";

  // 网页浏览时将 {page} 和 {pages} 格式化
  const displayFooterText = footerText
    .replace(/\{page\}/g, "1")
    .replace(/\{pages\}/g, "1");

  // 打印专用的 CSS 计数器语法
  const printFooterCssContent = generateCssPrintCounterContent(footerText);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title || "无标题笔记")}</title>
  <style>
    :root {
      --ee-bg: ${WHITE_STYLE.bg};
      --ee-text: ${WHITE_STYLE.text};
      --ee-muted: ${WHITE_STYLE.muted};
      --ee-border: ${WHITE_STYLE.border};
      --ee-code-bg: ${WHITE_STYLE.codeBg};
      --ee-accent: ${WHITE_STYLE.accent};
      --ee-font: ${WHITE_STYLE.fontFamily};
    }
    *, *::before, *::after { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background-color: var(--ee-bg);
      color: var(--ee-text);
      font-family: var(--ee-font);
      font-size: ${fontSize}px;
      line-height: 1.75;
      -webkit-font-smoothing: antialiased;
      ${!isCenterStamp && watermarkSvg ? `background-image: url("${watermarkSvg}"); background-repeat: repeat;` : ""}
    }
    .ee-container {
      max-width: ${contentWidth};
      margin: 0 auto;
      padding: 48px 28px 80px 28px;
      position: relative;
    }
    .ee-header {
      border-bottom: 1px solid var(--ee-border);
      padding-bottom: 8px;
      margin-bottom: 24px;
      font-size: 0.85em;
      color: var(--ee-muted);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .ee-title {
      font-size: 2.1em;
      font-weight: 750;
      line-height: 1.25;
      margin: 0 0 24px 0;
      color: var(--ee-text);
      letter-spacing: -0.02em;
      border-bottom: 1px solid var(--ee-border);
      padding-bottom: 16px;
    }
    h1, h2, h3, h4, h5, h6 {
      color: var(--ee-text);
      font-weight: 650;
      line-height: 1.35;
      margin-top: 1.6em;
      margin-bottom: 0.6em;
    }
    h1 { font-size: 1.7em; border-bottom: 1px solid var(--ee-border); padding-bottom: 0.3em; }
    h2 { font-size: 1.4em; border-bottom: 1px solid var(--ee-border); padding-bottom: 0.25em; }
    h3 { font-size: 1.18em; }
    h4 { font-size: 1.05em; }
    p { margin: 0.85em 0; }
    a { color: var(--ee-accent); text-decoration: none; border-bottom: 1px solid transparent; }
    a:hover { border-bottom-color: var(--ee-accent); }
    blockquote {
      margin: 1.3em 0;
      padding: 10px 18px;
      border-left: 4px solid ${WHITE_STYLE.blockquoteBorder};
      background: #f8fafc;
      color: #475569;
      border-radius: 0 8px 8px 0;
    }
    blockquote p { margin: 0.4em 0; }
    ul, ol { padding-left: 26px; margin: 0.9em 0; }
    li { margin: 0.3em 0; }
    .ee-task-list { list-style: none; padding-left: 4px; }
    .ee-task-item { display: flex; align-items: baseline; gap: 8px; margin: 0.4em 0; }
    .ee-task-item input { accent-color: var(--ee-accent); }
    hr { border: none; border-top: 1px solid var(--ee-border); margin: 2.2em 0; }
    .ee-img {
      max-width: 100% !important;
      height: auto !important;
      border-radius: 8px;
      margin: 1.4em auto;
      border: 1px solid var(--ee-border);
      display: block;
      object-fit: contain;
    }
    .ee-inline-code {
      font-family: SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.88em;
      background: #f1f5f9;
      color: #0f172a;
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid var(--ee-border);
    }
    /* 代码块与高亮 */
    .ee-code-block-wrapper {
      margin: 1.4em 0;
      background: #1e1e24;
      border: 1px solid #33333d;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    }
    .ee-code-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 14px;
      background: rgba(0, 0, 0, 0.25);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .ee-code-dots {
      display: flex;
      gap: 6px;
      align-items: center;
    }
    .ee-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      display: inline-block;
    }
    .ee-dot-red { background: #ff5f56; }
    .ee-dot-yellow { background: #ffbd2e; }
    .ee-dot-green { background: #27c93f; }
    .ee-code-lang {
      font-family: SFMono-Regular, Menlo, monospace;
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 600;
      color: #8b949e;
      letter-spacing: 0.05em;
    }
    pre.ee-code-pre {
      margin: 0;
      padding: 16px 18px;
      overflow-x: auto;
      font-family: SFMono-Regular, Menlo, Monaco, Consolas, "Courier New", monospace;
      font-size: 13px;
      line-height: 1.6;
      background: transparent;
      color: #e6edf3;
    }
    pre.ee-code-pre code { background: none; border: none; padding: 0; font-family: inherit; }
    .hl-keyword { color: #d2a8ff; font-weight: 600; }
    .hl-string { color: #a5d6ff; }
    .hl-comment { color: #8b949e; font-style: italic; }
    .hl-number { color: #79c0ff; }
    .hl-function { color: #f0883e; }
    .hl-abap-system-var { color: #ff7b72; font-weight: 600; }
    .hl-operator { color: #79c0ff; }
    .ee-table-wrapper { overflow-x: auto; margin: 1.4em 0; }
    table { width: 100%; border-collapse: collapse; font-size: 0.94em; }
    th, td { border: 1px solid var(--ee-border); padding: 8px 14px; text-align: left; }
    th { background: ${WHITE_STYLE.tableHeaderBg}; font-weight: 600; }
    .ee-math-block {
      margin: 1.4em 0;
      padding: 14px;
      background: #f8fafc;
      border-radius: 8px;
      text-align: center;
      overflow-x: auto;
      font-family: "Cambria Math", "Times New Roman", serif;
    }
    .ee-tag {
      display: inline-block;
      padding: 1px 6px;
      border-radius: 4px;
      font-size: 0.82em;
      color: var(--ee-accent);
      background: rgba(16, 185, 129, 0.08);
      margin: 0 2px;
    }
    .ee-footer {
      margin-top: 56px;
      padding-top: 14px;
      border-top: 1px solid var(--ee-border);
      text-align: center;
      font-size: 0.85em;
      color: var(--ee-muted);
    }
    .ee-center-stamp-watermark {
      position: absolute;
      top: 42%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-24deg);
      font-size: 42px;
      font-weight: 800;
      color: rgba(100, 116, 139, 0.12);
      border: 3.5px dashed rgba(100, 116, 139, 0.16);
      padding: 10px 30px;
      border-radius: 12px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      pointer-events: none;
      user-select: none;
      white-space: nowrap;
      z-index: 1;
    }

    /* 打印专用水印全屏固定图层（默认隐藏，打印时激活） */
    .ee-print-watermark-overlay {
      display: none;
    }

    @media print {
      @page {
        size: A4;
        margin: ${options.marginMm ? `${options.marginMm}mm` : "20mm"};
        ${hasHeader ? `@top-right { content: "${escapeHtml(headerText)}"; font-size: 8.5pt; color: #64748b; font-family: sans-serif; }` : ""}
        ${hasFooter ? `@bottom-center { content: ${printFooterCssContent}; font-size: 8.5pt; color: #64748b; font-family: sans-serif; }` : ""}
      }
      html, body {
        background: #ffffff !important;
        color: #111827 !important;
        font-size: 10.5pt !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      .ee-container {
        max-width: 100% !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      /* 打印时正文流中的页头和页尾彻底隐藏，防止与 @page margin boxes 重复！ */
      .ee-header,
      .ee-footer {
        display: none !important;
      }
      /* 打印专用水印全屏固定层：position: fixed 使其在每一页自动被打印机重复渲染！ */
      .ee-print-watermark-overlay {
        display: block !important;
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        pointer-events: none !important;
        z-index: -9999 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .ee-print-watermark-tile {
        width: 100% !important;
        height: 100% !important;
        background-repeat: repeat !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .ee-print-watermark-stamp {
        position: fixed !important;
        top: 50% !important;
        left: 50% !important;
        transform: translate(-50%, -50%) rotate(-28deg) !important;
        font-size: 38pt !important;
        font-weight: 800 !important;
        color: rgba(100, 116, 139, 0.16) !important;
        border: 3.5pt dashed rgba(100, 116, 139, 0.2) !important;
        padding: 12pt 36pt !important;
        border-radius: 12pt !important;
        text-transform: uppercase !important;
        letter-spacing: 0.1em !important;
        white-space: nowrap !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      /* 超长代码块平滑断页 */
      .ee-code-block-wrapper {
        page-break-inside: auto !important;
        break-inside: auto !important;
      }
      blockquote, table, img {
        page-break-inside: avoid;
        break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <!-- 打印与屏幕通用全屏背景水印层 -->
  ${hasWatermark ? `
  <div class="ee-print-watermark-overlay" aria-hidden="true">
    ${isCenterStamp 
      ? `<div class="ee-print-watermark-stamp">${escapeHtml(watermarkText)}</div>` 
      : `<div class="ee-print-watermark-tile" style="background-image: url('${watermarkSvg}');"></div>`
    }
  </div>
  ` : ""}

  <div class="ee-container">
    ${isCenterStamp ? `<div class="ee-center-stamp-watermark">${escapeHtml(watermarkText)}</div>` : ""}
    ${hasHeader ? `<header class="ee-header"><span>${escapeHtml(headerText)}</span></header>` : ""}
    <h1 class="ee-title">${escapeHtml(title || "无标题笔记")}</h1>
    <main class="ee-content">
      ${contentHtml}
    </main>
    ${hasFooter ? `<footer class="ee-footer"><span>${escapeHtml(displayFooterText)}</span></footer>` : ""}
  </div>
</body>
</html>`;
}

// ==================== 8. Word (.doc) 兼容导出与原生 VML 水印 ====================
function adaptImagesForWord(html) {
  if (!html) return "";
  return html.replace(/<img\b([^>]*?)>/gi, (_match, attrs) => {
    let cleanAttrs = attrs.replace(/\b(width|height)=["'][^"']*["']/gi, "");
    cleanAttrs = cleanAttrs.replace(/\bstyle=["'][^"']*["']/gi, "");
    return `<div style="text-align: center; margin: 12pt 0; max-width: 100%;">
      <table border="0" cellspacing="0" cellpadding="0" style="width: 100%; max-width: 100%; border: none;">
        <tr>
          <td align="center" style="border: none; padding: 0;">
            <img ${cleanAttrs} style="max-width: 100%; width: auto; max-height: 520pt; height: auto; border: 1pt solid #e2e8f0; display: block;" width="520" />
          </td>
        </tr>
      </table>
    </div>`;
  });
}

function generateWordDocument(article, htmlContent, options = {}) {
  const { title } = article;
  const wordSafeHtml = adaptImagesForWord(htmlContent);
  const marginPt = options.marginPt || 56.7;

  // 水印与显示方式
  const watermarkText = (options.watermarkResolved || "").trim();
  const watermarkMode = options.watermarkMode || "tile-dense";
  const hasWatermark = Boolean(watermarkText);

  // 页头与页尾：有就有，没有就没有
  const hasHeader = Boolean(options.enableHeader && options.headerText && options.headerText.trim());
  const headerText = hasHeader ? options.headerText.trim() : "";

  const hasFooter = Boolean(options.enableFooter && options.footerText && options.footerText.trim());
  const footerText = hasFooter ? options.footerText.trim() : "";

  return `<!DOCTYPE html>
<html xmlns:v="urn:schemas-microsoft-com:vml"
      xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns:m="http://schemas.microsoft.com/office/2004/12/omml"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset='utf-8'>
  <title>${escapeHtml(title || "Word 导出")}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    <!--
    v\\:* {behavior:url(#default#VML);}
    o\\:* {behavior:url(#default#VML);}
    w\\:* {behavior:url(#default#VML);}
    .shape {behavior:url(#default#VML);}

    @page Section1 {
      size: 595.3pt 841.9pt;
      margin: ${marginPt}pt ${marginPt}pt ${marginPt}pt ${marginPt}pt;
      mso-header-margin: 36.0pt;
      mso-footer-margin: 36.0pt;
      mso-paper-source: 0;
      mso-header: h1;
      mso-footer: f1;
    }
    div.Section1 { page: Section1; position: relative; }
    p.MsoHeader, li.MsoHeader, div.MsoHeader {
      margin: 0;
      margin-bottom: .0001pt;
      font-size: 9.0pt;
      font-family: 'Calibri', 'Microsoft YaHei', sans-serif;
    }
    p.MsoFooter, li.MsoFooter, div.MsoFooter {
      margin: 0;
      margin-bottom: .0001pt;
      font-size: 9.0pt;
      font-family: 'Calibri', 'Microsoft YaHei', sans-serif;
    }
    body {
      font-family: 'Calibri', 'Microsoft YaHei', 'SimSun', sans-serif;
      font-size: 11.0pt;
      line-height: 1.6;
      color: #111111;
    }
    h1.doc-title {
      font-size: 22.0pt;
      font-weight: bold;
      color: #0f172a;
      margin-top: 6.0pt;
      margin-bottom: 18.0pt;
      border-bottom: 1.5pt solid #cbd5e0;
      padding-bottom: 8.0pt;
    }
    h1 { font-size: 18.0pt; font-weight: bold; color: #1a202c; margin-top: 16.0pt; margin-bottom: 8.0pt; }
    h2 { font-size: 14.5pt; font-weight: bold; color: #2d3748; margin-top: 13.0pt; margin-bottom: 6.0pt; }
    h3 { font-size: 12.5pt; font-weight: bold; color: #4a5568; margin-top: 10.0pt; margin-bottom: 4.0pt; }
    p { margin: 6.0pt 0; }
    table { width: 100%; border-collapse: collapse; margin: 12.0pt 0; }
    th, td { border: 1.0pt solid #cbd5e0; padding: 6.0pt 9.0pt; text-align: left; }
    th { background: #edf2f7; font-weight: bold; }
    blockquote {
      border-left: 3.0pt solid #10b981;
      padding-left: 9.0pt;
      margin: 10.0pt 0;
      color: #4a5568;
      background: #f7fafc;
    }
    .ee-code-block-wrapper {
      margin: 12.0pt 0;
      background: #1e1e24;
      border: 1.0pt solid #33333d;
      padding: 8.0pt;
    }
    .ee-code-header { color: #888888; font-size: 9.0pt; margin-bottom: 4.0pt; }
    pre.ee-code-pre {
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 9.5pt;
      line-height: 1.4;
      color: #e6edf3;
    }
    .hl-keyword { color: #d2a8ff; font-weight: bold; }
    .hl-string { color: #a5d6ff; }
    .hl-comment { color: #8b949e; font-style: italic; }
    .hl-number { color: #79c0ff; }
    .hl-function { color: #f0883e; }
    .hl-abap-system-var { color: #ff7b72; font-weight: bold; }
    img {
      max-width: 100% !important;
      width: auto !important;
      height: auto !important;
    }
    -->
  </style>
</head>
<body>
  <!-- Word 真实后台页眉：包含 Word 原生底层 VML 锁定水印 + 独立页眉文字 -->
  <div style='mso-element:header' id=h1>
    ${hasHeader ? `
    <table border="0" cellspacing="0" cellpadding="0" style="width:100%; border:none; border-bottom:0.75pt solid #cbd5e0; margin-bottom:12pt;">
      <tr>
        <td style="border:none; padding-bottom:4pt; text-align:right; font-size:9.0pt; color:#718096; font-family:'Microsoft YaHei',Calibri,sans-serif;">
          ${escapeHtml(headerText)}
        </td>
      </tr>
    </table>
    ` : `<p class="MsoHeader" style="margin:0; line-height:0; font-size:1pt;">&nbsp;</p>`}

    ${hasWatermark ? generateWordVmlWatermark(watermarkText, watermarkMode) : ""}
  </div>

  <!-- Word 真实后台页脚：包含独立页脚文字与 Word 原生动态页码域 -->
  <div style='mso-element:footer' id=f1>
    ${hasFooter ? `
    <table border="0" cellspacing="0" cellpadding="0" style="width:100%; border:none; border-top:0.75pt solid #cbd5e0; margin-top:12pt;">
      <tr>
        <td style="border:none; padding-top:6pt; text-align:center; font-size:9.0pt; color:#718096; font-family:'Microsoft YaHei',Calibri,sans-serif;">
          ${formatWordFooterWithFields(footerText)}
        </td>
      </tr>
    </table>
    ` : `<p class="MsoFooter" style="margin:0; line-height:0; font-size:1pt;">&nbsp;</p>`}
  </div>

  <!-- 正文区域：纯粹干净，首个元素直接为大标题，无任何多余占位元素 -->
  <div class="Section1">
    <h1 class="doc-title">${escapeHtml(title || "无标题笔记")}</h1>
    ${wordSafeHtml}
  </div>
</body>
</html>`;
}

// ==================== 8. 博客 Markdown 导出生成器 ====================
function generateHugoMarkdown(article, rawMarkdown) {
  const { title, tags, createdAt, updatedAt } = article;
  const nowStr = new Date().toISOString();
  const dateStr = createdAt || nowStr;
  const lastmodStr = updatedAt || nowStr;

  const tagList = tags && tags.length > 0 ? tags.map((t) => JSON.stringify(t)).join(", ") : "";

  const frontmatter = `---
title: ${JSON.stringify(title || "无标题笔记")}
date: ${dateStr}
lastmod: ${lastmodStr}
draft: false
tags: [${tagList}]
categories: []
---

`;

  const cleaned = cleanEscapedUnderscores(rawMarkdown.replace(/^---\n[\s\S]*?\n---\n/, ""));
  return frontmatter + cleaned;
}

// ==================== 9. 文件下载、隐式 IFrame 打印与剪贴板 ====================
function downloadFile(content, fileName, mimeType = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 300);
}

function triggerPrintViaIframe(printHtml, context) {
  let oldFrame = document.getElementById("ee-export-print-frame");
  if (oldFrame) oldFrame.remove();

  const iframe = document.createElement("iframe");
  iframe.id = "ee-export-print-frame";
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.style.opacity = "0";
  iframe.style.pointerEvents = "none";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(printHtml);
  doc.close();

  iframe.contentWindow.focus();
  setTimeout(() => {
    try {
      iframe.contentWindow.print();
      context.ui?.showNotice?.("已唤起系统打印，请在打印选项中选择「另存为 PDF」！");
    } catch (e) {
      console.warn("[Enhancing Export] iframe print failed, fallback to window.print:", e);
      window.print();
    }
    setTimeout(() => iframe.remove(), 2500);
  }, 400);
}

async function copyToClipboard(text, context) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      context.ui?.showNotice?.("已成功复制导出内容到剪贴板！");
      return true;
    }
  } catch (e) {
    console.warn("Clipboard API writeText failed:", e);
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand("copy");
    context.ui?.showNotice?.("已成功复制到剪贴板！");
    return true;
  } catch (e) {
    context.ui?.showNotice?.("复制失败，请重试！");
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}

// ==================== 10. 导出预设格式定义 ====================
const EXPORT_FORMATS = [
  {
    id: "html",
    name: "独立离线网页",
    ext: ".html",
    engine: "builtin",
    icon: "🌐",
    desc: "将排版、样式与图片全部内嵌 Base64，离线随处双击完美自适应打开。",
    mime: "text/html;charset=utf-8",
  },
  {
    id: "doc",
    name: "Word 文档",
    ext: ".doc",
    engine: "builtin",
    icon: "📄",
    desc: "高保真 Word 规范文档，图片严格缩放自适应版心不超页，Word/WPS 完美打开。",
    mime: "application/msword;charset=utf-8",
  },
  {
    id: "pdf",
    name: "高保真 PDF 打印",
    ext: ".pdf",
    engine: "builtin",
    icon: "🖨️",
    desc: "针对 A4 纸张排版优化，白底黑字、高亮代码块，直接打印或存为 PDF。",
    mime: "application/pdf",
  },
  {
    id: "md",
    name: "纯净标准 Markdown",
    ext: ".md",
    engine: "builtin",
    icon: "📝",
    desc: "符合通用规范的 Markdown 文本，自动清洗反斜杠，保留纯正下划线与内容。",
    mime: "text/markdown;charset=utf-8",
  },
  {
    id: "hugo",
    name: "博客文章 (Hugo/Hexo)",
    ext: ".md",
    engine: "builtin",
    icon: "🚀",
    desc: "自动补充 YAML Frontmatter（标题、时间、标签），适配静态博客流水线。",
    mime: "text/markdown;charset=utf-8",
  },
  {
    id: "pandoc",
    name: "Pandoc 学术与扩展",
    ext: ".epub",
    engine: "pandoc",
    icon: "⚙️",
    desc: "基于 Pandoc 命令行导出为 EPUB、LaTeX、Typst 等高级格式（一键生成命令）。",
    mime: "text/plain",
  },
];

// ==================== 11. 核心插件生命周期 ====================
export default {
  activate(context) {
    const isDesktop = typeof window !== "undefined" && Boolean(window.edgeeverDesktop?.isAvailable);

    let settings = {
      defaultFormat: "html",
      defaultFontSize: "15",
      defaultWidth: "820px",
      defaultMargin: "20mm",
      enableHeader: false,
      headerText: "",
      enableFooter: false,
      footerText: "第 {page} 页 / 共 {pages} 页",
      watermarkText: "",
      watermarkMode: "tile-dense",
      buttonPosition: "toolbar",
      embedImagesBase64: true,
      includeFrontmatter: true,
      pandocPath: "pandoc",
    };

    async function loadSettings() {
      try {
        const fmt = await context.settings.get("default_format");
        const fs = await context.settings.get("default_font_size");
        const pos = await context.settings.get("button_position");
        const embed = await context.settings.get("embed_images_base64");
        const fm = await context.settings.get("include_frontmatter");
        const pandoc = await context.settings.get("pandoc_path");

        if (fmt !== null) settings.defaultFormat = String(fmt);
        if (fs !== null) settings.defaultFontSize = String(fs);
        if (pos !== null) {
          const p = String(pos);
          if (p === "fab" || p === "bottom-right") settings.buttonPosition = "fab";
          else if (p === "hidden") settings.buttonPosition = "hidden";
          else settings.buttonPosition = "toolbar";
        }
        if (embed !== null) settings.embedImagesBase64 = Boolean(embed);
        if (fm !== null) settings.includeFrontmatter = Boolean(fm);
        if (pandoc !== null) settings.pandocPath = String(pandoc);
      } catch (e) {
        console.warn("[Enhancing Export] loadSettings error:", e);
      }
    }

    loadSettings();

    // 解析当前笔记完整信息
    async function getCurrentArticle() {
      let doc = null;
      try {
        doc = await context.editor.getDocument();
      } catch (e) {}

      let note = null;
      if (doc && doc.noteId) {
        try {
          note = await context.notes.get(doc.noteId);
        } catch (e) {}
      }

      const title = doc?.title || note?.title || "未命名笔记";
      let rawMarkdown = doc?.contentMarkdown || note?.contentMarkdown || "";
      const tags = note?.tags || [];
      const notebook = note?.notebookId || "";
      const createdAt = note?.createdAt ? new Date(note.createdAt).toLocaleString() : "";
      const updatedAt = note?.updatedAt ? new Date(note.updatedAt).toLocaleString() : "";

      let markdownWithImages = rawMarkdown;
      try {
        markdownWithImages = await resolveAllImagesInMarkdown(rawMarkdown, context);
      } catch (err) {
        console.warn("[Enhancing Export] resolveAllImagesInMarkdown error:", err);
      }

      // 预清洗下划线
      const cleanedMarkdown = cleanEscapedUnderscores(markdownWithImages);
      const contentHtml = renderMarkdownToHtml(cleanedMarkdown);

      return {
        title,
        rawMarkdown: cleanedMarkdown,
        contentHtml,
        tags,
        notebook,
        createdAt,
        updatedAt,
      };
    }

    // ==================== 12. 导出交互向导弹窗 ====================
    async function openExportModal() {
      document.querySelectorAll(".edgeever-export-modal-backdrop").forEach((el) => el.remove());

      const article = await getCurrentArticle();
      if (!article.rawMarkdown.trim()) {
        context.ui?.showNotice?.("当前笔记没有可导出的内容！");
        return;
      }

      let selectedFormat = settings.defaultFormat;
      let selectedFontSize = settings.defaultFontSize;
      let selectedWidth = settings.defaultWidth;
      let selectedMargin = settings.defaultMargin;

      // 水印内容与显示方式
      let selectedWatermark = settings.watermarkText;
      let selectedWatermarkMode = settings.watermarkMode || "tile-dense";

      // 页头与页尾分别独立配置（默认关闭，有就有，没有就没有）
      let selectedEnableHeader = settings.enableHeader;
      let selectedHeaderText = settings.headerText || article.title || "";

      let selectedEnableFooter = settings.enableFooter;
      let selectedFooterText = settings.footerText || "第 {page} 页 / 共 {pages} 页";
      if (/第\s*1\s*页\s*\/\s*共\s*1\s*页/.test(selectedFooterText)) {
        selectedFooterText = "第 {page} 页 / 共 {pages} 页";
      }

      let candidateFileName = (article.title || "Note").replace(/[\\/:*?"<>|]/g, "_");

      const backdrop = document.createElement("div");
      backdrop.className = "edgeever-export-modal-backdrop";

      backdrop.innerHTML = `
        <div class="edgeever-export-modal">
          <!-- 弹窗顶栏 -->
          <div class="edgeever-export-modal-header">
            <div class="edgeever-export-modal-title-wrap">
              <div class="edgeever-export-modal-icon">📤</div>
              <div>
                <h3 class="edgeever-export-modal-title">增强导出 (Enhancing Export)</h3>
                <div class="edgeever-export-modal-subtitle">左侧调整排版参数，右侧实时所见即所得纸张预览</div>
              </div>
            </div>
            <button type="button" class="edgeever-export-modal-close-btn" title="关闭 (Esc)">✕</button>
          </div>

          <!-- 双栏主体 -->
          <div class="edgeever-export-modal-body">
            <!-- 左侧控制栏 -->
            <div class="edgeever-export-sidebar">
              <div class="edgeever-export-sidebar-scroll">
                <!-- 格式选择 -->
                <div class="edgeever-export-section-title">选择目标格式</div>
                <div class="edgeever-export-cards-list"></div>

                <!-- 文件名 -->
                <div class="edgeever-form-group">
                  <label class="edgeever-form-label">
                    导出文件名
                    <span class="edgeever-form-hint" id="ee-ext-hint">.html</span>
                  </label>
                  <input type="text" class="edgeever-input-text" id="ee-filename-input" value="${escapeHtml(candidateFileName)}" />
                </div>

                <!-- 正文字号 -->
                <div class="edgeever-form-group" id="ee-fontsize-group">
                  <label class="edgeever-form-label">正文字号大小</label>
                  <div class="edgeever-segment-group" id="ee-fontsize-segments">
                    <button type="button" class="edgeever-segment-btn" data-size="13">13px</button>
                    <button type="button" class="edgeever-segment-btn" data-size="14">14px</button>
                    <button type="button" class="edgeever-segment-btn" data-size="15">15px</button>
                    <button type="button" class="edgeever-segment-btn" data-size="16">16px</button>
                    <button type="button" class="edgeever-segment-btn" data-size="18">18px</button>
                  </div>
                </div>

                <!-- 页面内容显示宽度 -->
                <div class="edgeever-form-group" id="ee-width-group">
                  <label class="edgeever-form-label">
                    页面内容显示宽度
                    <span class="edgeever-form-hint" id="ee-width-hint">820px</span>
                  </label>
                  <div class="edgeever-segment-group" id="ee-width-segments">
                    <button type="button" class="edgeever-segment-btn" data-width="720px">720px</button>
                    <button type="button" class="edgeever-segment-btn" data-width="820px">820px</button>
                    <button type="button" class="edgeever-segment-btn" data-width="960px">960px</button>
                    <button type="button" class="edgeever-segment-btn" data-width="100%">全宽</button>
                  </div>
                </div>

                <!-- 页边距 -->
                <div class="edgeever-form-group" id="ee-margin-group">
                  <label class="edgeever-form-label">页面边距 (PDF / Word)</label>
                  <div class="edgeever-segment-group" id="ee-margin-segments">
                    <button type="button" class="edgeever-segment-btn" data-margin="12mm" data-pt="34" data-pad="24px">窄边距 (12mm)</button>
                    <button type="button" class="edgeever-segment-btn" data-margin="20mm" data-pt="56.7" data-pad="36px">标准 (20mm)</button>
                    <button type="button" class="edgeever-segment-btn" data-margin="28mm" data-pt="80" data-pad="50px">宽边距 (28mm)</button>
                  </div>
                </div>

                <!-- 页头设置 (分别独立设置，有就有，没有就没有) -->
                <div class="edgeever-form-group" id="ee-header-group">
                  <div class="edgeever-checkbox-group" style="padding: 9px 11px;">
                    <label class="edgeever-checkbox-label" style="font-weight: 600;">
                      <input type="checkbox" id="ee-enable-header" ${selectedEnableHeader ? "checked" : ""} />
                      <span>显示页头 (Header)</span>
                    </label>
                    <div id="ee-header-input-wrap" style="display: ${selectedEnableHeader ? "block" : "none"}; margin-top: 6px;">
                      <input type="text" class="edgeever-input-text" id="ee-header-text" placeholder="页头内容，如：项目设计方案" value="${escapeHtml(selectedHeaderText)}" />
                    </div>
                  </div>
                </div>

                <!-- 页尾设置 (分别独立设置，有就有，没有就没有) -->
                <div class="edgeever-form-group" id="ee-footer-group">
                  <div class="edgeever-checkbox-group" style="padding: 9px 11px;">
                    <label class="edgeever-checkbox-label" style="font-weight: 600;">
                      <input type="checkbox" id="ee-enable-footer" ${selectedEnableFooter ? "checked" : ""} />
                      <span>显示页尾 (Footer)</span>
                    </label>
                    <div id="ee-footer-input-wrap" style="display: ${selectedEnableFooter ? "block" : "none"}; margin-top: 6px;">
                      <input type="text" class="edgeever-input-text" id="ee-footer-text" placeholder="页尾内容，如：第 {page} 页 / 共 {pages} 页" value="${escapeHtml(selectedFooterText)}" />
                      <!-- 快捷页尾变量标签 -->
                      <div class="ee-watermark-vars-bar">
                        <span class="ee-footer-chip" data-var="{page}">+ 当前页码</span>
                        <span class="ee-footer-chip" data-var="{pages}">+ 总页数</span>
                        <span class="ee-footer-chip" data-var="第 {page} 页 / 共 {pages} 页">+ 标准页码</span>
                        <span class="ee-footer-chip" data-var="{title}">+ 文档标题</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 背景安全水印 (支持系统变量与多种显示方式) -->
                <div class="edgeever-form-group" id="ee-watermark-group">
                  <label class="edgeever-form-label">
                    背景安全水印
                    <span class="edgeever-form-hint">留空不显示</span>
                  </label>
                  <input type="text" class="edgeever-input-text" id="ee-watermark-input" placeholder="输入水印文字或变量 (如机密资料/{date})" value="${escapeHtml(selectedWatermark)}" />
                  
                  <!-- 快捷变量插入标签 -->
                  <div class="ee-watermark-vars-bar">
                    <span class="ee-var-chip" data-var="{date}">+ 日期</span>
                    <span class="ee-var-chip" data-var="{time}">+ 时间</span>
                    <span class="ee-var-chip" data-var="{datetime}">+ 日期时间</span>
                    <span class="ee-var-chip" data-var="{title}">+ 文档标题</span>
                    <span class="ee-var-chip" data-var="绝密内部资料">+ 绝密内部</span>
                  </div>

                  <!-- 水印显示方式选择 -->
                  <label class="edgeever-form-label" style="margin-top: 6px; font-size: 11px;">水印显示方式</label>
                  <div class="edgeever-segment-group" id="ee-watermark-mode-segments">
                    <button type="button" class="edgeever-segment-btn" data-mode="tile-dense">密集斜向</button>
                    <button type="button" class="edgeever-segment-btn" data-mode="tile-sparse">稀疏平铺</button>
                    <button type="button" class="edgeever-segment-btn" data-mode="horizontal">水平规整</button>
                    <button type="button" class="edgeever-segment-btn" data-mode="center-stamp">居中印章</button>
                  </div>
                </div>

                <!-- 高级选项 -->
                <div class="edgeever-form-group">
                  <label class="edgeever-form-label">高级选项</label>
                  <div class="edgeever-checkbox-group">
                    <label class="edgeever-checkbox-label">
                      <input type="checkbox" id="ee-opt-embed-img" ${settings.embedImagesBase64 ? "checked" : ""} />
                      <span>自动内嵌本地图片 Base64 (离线不丢图)</span>
                    </label>
                  </div>
                </div>
              </div>

              <!-- 左侧底部操作栏 -->
              <div class="edgeever-export-sidebar-footer">
                <div class="edgeever-btn-row">
                  <button type="button" class="edgeever-btn edgeever-btn-secondary edgeever-btn-flex" id="ee-btn-copy">📋 复制内容</button>
                  <button type="button" class="edgeever-btn edgeever-btn-primary edgeever-btn-flex" id="ee-btn-export">📥 立即导出并保存</button>
                </div>
              </div>
            </div>

            <!-- 右侧：实时排版预览区 -->
            <div class="edgeever-export-preview-pane">
              <div class="edgeever-preview-header">
                <span style="font-weight: 600;">📄 实时排版预览</span>
                <div class="preview-badge-group">
                  <span class="preview-pill" id="ee-preview-width-pill">宽度 820px</span>
                  <span class="preview-pill" id="ee-preview-margin-pill">边距 20mm</span>
                  <span class="preview-pill" id="ee-preview-size-pill">15px</span>
                </div>
              </div>
              <div class="edgeever-preview-viewport">
                <!-- 真实纸张画布 -->
                <div class="edgeever-live-preview-paper" id="ee-live-paper">
                  <!-- 居中大印章水印图层 -->
                  <div class="ee-center-stamp-watermark" id="ee-preview-stamp" style="display: none;"></div>
                  <!-- 动态页头 -->
                  <div class="ee-paper-header" id="ee-preview-header-bar" style="display: none;"></div>
                  <!-- 大标题 -->
                  <h1 class="preview-title">${escapeHtml(article.title || "无标题笔记")}</h1>
                  <!-- 正文 -->
                  <div class="preview-content-body">${article.contentHtml}</div>
                  <!-- 动态页尾 -->
                  <div class="ee-paper-footer" id="ee-preview-footer-bar" style="display: none;"></div>
                </div>
                <!-- 纯文本与 Pandoc 预览 -->
                <div class="edgeever-raw-preview-text" id="ee-raw-preview" style="display: none;"></div>
              </div>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(backdrop);

      const cardsList = backdrop.querySelector(".edgeever-export-cards-list");
      const fontSizeSegments = backdrop.querySelector("#ee-fontsize-segments");
      const widthSegments = backdrop.querySelector("#ee-width-segments");
      const marginSegments = backdrop.querySelector("#ee-margin-segments");
      const watermarkInput = backdrop.querySelector("#ee-watermark-input");
      const watermarkModeSegments = backdrop.querySelector("#ee-watermark-mode-segments");
      const enableHeaderCheck = backdrop.querySelector("#ee-enable-header");
      const headerInputWrap = backdrop.querySelector("#ee-header-input-wrap");
      const headerTextInput = backdrop.querySelector("#ee-header-text");
      const enableFooterCheck = backdrop.querySelector("#ee-enable-footer");
      const footerInputWrap = backdrop.querySelector("#ee-footer-input-wrap");
      const footerTextInput = backdrop.querySelector("#ee-footer-text");
      const fileNameInput = backdrop.querySelector("#ee-filename-input");
      const extHint = backdrop.querySelector("#ee-ext-hint");
      const widthHint = backdrop.querySelector("#ee-width-hint");
      const previewWidthPill = backdrop.querySelector("#ee-preview-width-pill");
      const previewMarginPill = backdrop.querySelector("#ee-preview-margin-pill");
      const previewSizePill = backdrop.querySelector("#ee-preview-size-pill");
      const livePaper = backdrop.querySelector("#ee-live-paper");
      const previewStamp = backdrop.querySelector("#ee-preview-stamp");
      const previewHeaderBar = backdrop.querySelector("#ee-preview-header-bar");
      const previewFooterBar = backdrop.querySelector("#ee-preview-footer-bar");
      const rawPreview = backdrop.querySelector("#ee-raw-preview");
      const btnExport = backdrop.querySelector("#ee-btn-export");
      const btnCopy = backdrop.querySelector("#ee-btn-copy");
      const btnClose = backdrop.querySelector(".edgeever-export-modal-close-btn");

      cardsList.innerHTML = "";
      EXPORT_FORMATS.forEach((fmt) => {
        const card = document.createElement("div");
        card.className = `edgeever-export-format-card ${fmt.id === selectedFormat ? "is-selected" : ""}`;
        card.dataset.formatId = fmt.id;
        card.innerHTML = `
          <div class="format-card-icon">${fmt.icon}</div>
          <div class="format-card-content">
            <div class="format-card-header">
              <span class="format-card-name">${escapeHtml(fmt.name)}</span>
              <span class="format-card-ext">${escapeHtml(fmt.ext)}</span>
            </div>
            <div class="format-card-desc">${escapeHtml(fmt.desc)}</div>
          </div>
        `;
        card.onclick = () => {
          selectedFormat = fmt.id;
          backdrop.querySelectorAll(".edgeever-export-format-card").forEach((c) => c.classList.remove("is-selected"));
          card.classList.add("is-selected");
          updateUiState();
        };
        cardsList.appendChild(card);
      });

      // 字号切换
      fontSizeSegments.querySelectorAll(".edgeever-segment-btn").forEach((btn) => {
        if (btn.dataset.size === selectedFontSize) btn.classList.add("is-active");
        btn.onclick = () => {
          selectedFontSize = btn.dataset.size;
          fontSizeSegments.querySelectorAll(".edgeever-segment-btn").forEach((b) => b.classList.remove("is-active"));
          btn.classList.add("is-active");
          updateUiState();
        };
      });

      // 宽度切换
      widthSegments.querySelectorAll(".edgeever-segment-btn").forEach((btn) => {
        if (btn.dataset.width === selectedWidth) btn.classList.add("is-active");
        btn.onclick = () => {
          selectedWidth = btn.dataset.width;
          widthSegments.querySelectorAll(".edgeever-segment-btn").forEach((b) => b.classList.remove("is-active"));
          btn.classList.add("is-active");
          updateUiState();
        };
      });

      // 边距切换
      marginSegments.querySelectorAll(".edgeever-segment-btn").forEach((btn) => {
        if (btn.dataset.margin === selectedMargin) btn.classList.add("is-active");
        btn.onclick = () => {
          selectedMargin = btn.dataset.margin;
          marginSegments.querySelectorAll(".edgeever-segment-btn").forEach((b) => b.classList.remove("is-active"));
          btn.classList.add("is-active");
          updateUiState();
        };
      });

      // 水印显示方式切换
      watermarkModeSegments.querySelectorAll(".edgeever-segment-btn").forEach((btn) => {
        if (btn.dataset.mode === selectedWatermarkMode) btn.classList.add("is-active");
        btn.onclick = () => {
          selectedWatermarkMode = btn.dataset.mode;
          watermarkModeSegments.querySelectorAll(".edgeever-segment-btn").forEach((b) => b.classList.remove("is-active"));
          btn.classList.add("is-active");
          updateUiState();
        };
      });

      // 快捷变量芯片点击注入
      backdrop.querySelectorAll(".ee-var-chip").forEach((chip) => {
        chip.onclick = () => {
          const varCode = chip.dataset.var;
          if (varCode) {
            const start = watermarkInput.selectionStart || watermarkInput.value.length;
            const end = watermarkInput.selectionEnd || watermarkInput.value.length;
            const val = watermarkInput.value;
            watermarkInput.value = val.substring(0, start) + varCode + val.substring(end);
            watermarkInput.focus();
            selectedWatermark = watermarkInput.value;
            updateUiState();
          }
        };
      });

      // 水印输入监听
      watermarkInput.addEventListener("input", () => {
        selectedWatermark = watermarkInput.value;
        updateUiState();
      });

      // 页头独立开关与文本
      enableHeaderCheck.addEventListener("change", () => {
        selectedEnableHeader = enableHeaderCheck.checked;
        headerInputWrap.style.display = selectedEnableHeader ? "block" : "none";
        updateUiState();
      });

      headerTextInput.addEventListener("input", () => {
        selectedHeaderText = headerTextInput.value;
        updateUiState();
      });

      // 页尾独立开关与文本
      enableFooterCheck.addEventListener("change", () => {
        selectedEnableFooter = enableFooterCheck.checked;
        footerInputWrap.style.display = selectedEnableFooter ? "block" : "none";
        updateUiState();
      });

      footerTextInput.addEventListener("input", () => {
        selectedFooterText = footerTextInput.value;
        updateUiState();
      });

      // 快捷页尾变量芯片点击注入
      backdrop.querySelectorAll(".ee-footer-chip").forEach((chip) => {
        chip.onclick = () => {
          const varCode = chip.dataset.var;
          if (varCode) {
            if (varCode.startsWith("第 {")) {
              footerTextInput.value = varCode;
            } else {
              const start = footerTextInput.selectionStart || footerTextInput.value.length;
              const end = footerTextInput.selectionEnd || footerTextInput.value.length;
              const val = footerTextInput.value;
              footerTextInput.value = val.substring(0, start) + varCode + val.substring(end);
            }
            footerTextInput.focus();
            selectedFooterText = footerTextInput.value;
            updateUiState();
          }
        };
      });

      function updateUiState() {
        const fmtObj = EXPORT_FORMATS.find((f) => f.id === selectedFormat) || EXPORT_FORMATS[0];
        extHint.textContent = fmtObj.ext;
        widthHint.textContent = selectedWidth;

        const isVisualFormat = selectedFormat === "html" || selectedFormat === "doc" || selectedFormat === "pdf";

        backdrop.querySelector("#ee-fontsize-group").style.display = isVisualFormat ? "flex" : "none";
        backdrop.querySelector("#ee-width-group").style.display = isVisualFormat ? "flex" : "none";
        backdrop.querySelector("#ee-margin-group").style.display = isVisualFormat ? "flex" : "none";
        backdrop.querySelector("#ee-header-group").style.display = isVisualFormat ? "flex" : "none";
        backdrop.querySelector("#ee-footer-group").style.display = isVisualFormat ? "flex" : "none";
        backdrop.querySelector("#ee-watermark-group").style.display = isVisualFormat ? "flex" : "none";

        previewSizePill.textContent = `${selectedFontSize}px`;
        previewWidthPill.textContent = `宽度 ${selectedWidth}`;
        previewMarginPill.textContent = `边距 ${selectedMargin}`;

        if (isVisualFormat) {
          livePaper.style.display = "block";
          rawPreview.style.display = "none";

          livePaper.style.fontSize = `${selectedFontSize}px`;
          livePaper.style.maxWidth = selectedWidth;

          // 边距动态内边距
          const padMap = { "12mm": "24px 24px 40px 24px", "20mm": "36px 36px 60px 36px", "28mm": "50px 50px 72px 50px" };
          livePaper.style.padding = padMap[selectedMargin] || "36px 36px 60px 36px";

          // 页头：有就有，没有就没有
          if (selectedEnableHeader && selectedHeaderText.trim()) {
            previewHeaderBar.style.display = "flex";
            previewHeaderBar.textContent = selectedHeaderText.trim();
          } else {
            previewHeaderBar.style.display = "none";
            previewHeaderBar.textContent = "";
          }

          // 页尾：有就有，没有就没有（预览中将变量智能展现）
          if (selectedEnableFooter && selectedFooterText.trim()) {
            previewFooterBar.style.display = "block";
            const previewText = selectedFooterText
              .replace(/\{page\}/g, "1")
              .replace(/\{pages\}/g, "1")
              .replace(/\{title\}/g, article.title || "");
            previewFooterBar.textContent = previewText.trim();
          } else {
            previewFooterBar.style.display = "none";
            previewFooterBar.textContent = "";
          }

          // 动态解析水印文本（替换变量）
          const resolvedWatermark = resolveWatermarkVariables(selectedWatermark, article);

          if (selectedWatermarkMode === "center-stamp" && resolvedWatermark.trim()) {
            livePaper.style.backgroundImage = "none";
            previewStamp.style.display = "block";
            previewStamp.textContent = resolvedWatermark.trim();
          } else {
            previewStamp.style.display = "none";
            const wmSvg = generateWatermarkBackground(resolvedWatermark, selectedWatermarkMode);
            if (wmSvg) {
              livePaper.style.backgroundImage = `url("${wmSvg}")`;
              livePaper.style.backgroundRepeat = "repeat";
            } else {
              livePaper.style.backgroundImage = "none";
            }
          }

          if (selectedFormat === "pdf") {
            btnExport.textContent = "🖨️ 打开打印 / 保存 PDF";
          } else {
            btnExport.textContent = "📥 立即导出并保存";
          }
        } else {
          livePaper.style.display = "none";
          rawPreview.style.display = "block";

          if (selectedFormat === "hugo") {
            rawPreview.textContent = generateHugoMarkdown(article, article.rawMarkdown);
            btnExport.textContent = "📥 导出博客 Markdown";
          } else if (selectedFormat === "pandoc") {
            const baseName = (fileNameInput.value || article.title || "Note").trim();
            btnExport.textContent = "📋 复制 Pandoc 命令行";

            rawPreview.innerHTML = `
              <div style="font-weight: 600; margin-bottom: 8px; color: var(--ee-export-primary);">⚙️ Pandoc 终端执行指令预览:</div>
              <div style="background: rgba(0,0,0,0.06); padding: 10px 14px; border-radius: 6px; font-family: monospace; font-size: 12px; margin-bottom: 12px;">
                ${escapeHtml(settings.pandocPath)} "${escapeHtml(baseName)}.md" -s -o "${escapeHtml(baseName)}.epub" --metadata title="${escapeHtml(article.title)}"
              </div>
              <div style="color: var(--ee-export-text-muted); font-size: 12px; line-height: 1.6;">
                💡 提示：如需查看桌面端 Pandoc 环境检测及完整安装指引，可在插件设置中查看，或在命令面板运行 <strong>「Pandoc 环境检测与安装指引」</strong> 命令。
              </div>
            `;
          } else {
            rawPreview.textContent = cleanEscapedUnderscores(article.rawMarkdown);
            btnExport.textContent = "📥 导出 Markdown 文件";
          }
        }
      }

      updateUiState();

      const closeModal = () => backdrop.remove();
      btnClose.onclick = closeModal;
      backdrop.onclick = (e) => {
        if (e.target === backdrop) closeModal();
      };

      const handleKeyDown = (e) => {
        if (e.key === "Escape") {
          closeModal();
          window.removeEventListener("keydown", handleKeyDown);
        }
      };
      window.addEventListener("keydown", handleKeyDown);

      // 获取当前排版参数对象（包含已解析变量的水印内容及模式）
      function getLayoutOptions() {
        const marginMm = parseInt(selectedMargin, 10) || 20;
        const ptMap = { "12mm": 34, "20mm": 56.7, "28mm": 80 };
        const resolvedWatermark = resolveWatermarkVariables(selectedWatermark, article);

        return {
          fontSize: selectedFontSize,
          contentWidth: selectedWidth,
          marginMm: marginMm,
          marginPt: ptMap[selectedMargin] || 56.7,
          watermarkRaw: selectedWatermark,
          watermarkResolved: resolvedWatermark,
          watermarkMode: selectedWatermarkMode,
          enableHeader: selectedEnableHeader,
          headerText: selectedHeaderText,
          enableFooter: selectedEnableFooter,
          footerText: selectedFooterText,
        };
      }

      // 复制内容
      btnCopy.onclick = async () => {
        let textToCopy = "";
        const opts = getLayoutOptions();

        if (selectedFormat === "html") {
          textToCopy = generateStandaloneHtml(article, opts);
        } else if (selectedFormat === "hugo") {
          textToCopy = generateHugoMarkdown(article, article.rawMarkdown);
        } else if (selectedFormat === "doc") {
          textToCopy = generateWordDocument(article, article.contentHtml, opts);
        } else if (selectedFormat === "pandoc") {
          const baseName = (fileNameInput.value || article.title || "Note").trim();
          textToCopy = `${settings.pandocPath} "${baseName}.md" -s -o "${baseName}.epub"`;
        } else {
          textToCopy = cleanEscapedUnderscores(article.rawMarkdown);
        }

        await copyToClipboard(textToCopy, context);
      };

      // 导出下载
      btnExport.onclick = async () => {
        const fmtObj = EXPORT_FORMATS.find((f) => f.id === selectedFormat) || EXPORT_FORMATS[0];
        const baseName = (fileNameInput.value || article.title || "Note").trim();
        const outputFileName = `${baseName}${fmtObj.ext}`;
        const opts = getLayoutOptions();

        btnExport.disabled = true;

        try {
          if (selectedFormat === "html") {
            const html = generateStandaloneHtml(article, opts);
            downloadFile(html, outputFileName, fmtObj.mime);
            context.ui?.showNotice?.(`独立网页 ${outputFileName} 导出成功！`);
            setTimeout(closeModal, 600);
          } else if (selectedFormat === "doc") {
            const docContent = generateWordDocument(article, article.contentHtml, opts);
            downloadFile(docContent, outputFileName, fmtObj.mime);
            context.ui?.showNotice?.(`Word 文档 ${outputFileName} 导出成功！可在 Word / WPS 中顺畅浏览。`);
            setTimeout(closeModal, 600);
          } else if (selectedFormat === "pdf") {
            const printHtml = generateStandaloneHtml(article, opts);
            triggerPrintViaIframe(printHtml, context);
            closeModal();
          } else if (selectedFormat === "md") {
            downloadFile(cleanEscapedUnderscores(article.rawMarkdown), outputFileName, fmtObj.mime);
            context.ui?.showNotice?.(`Markdown 文档 ${outputFileName} 导出成功！`);
            setTimeout(closeModal, 600);
          } else if (selectedFormat === "hugo") {
            const hugoMd = generateHugoMarkdown(article, article.rawMarkdown);
            downloadFile(hugoMd, outputFileName, fmtObj.mime);
            context.ui?.showNotice?.(`博客 Markdown ${outputFileName} 导出成功！`);
            setTimeout(closeModal, 600);
          } else if (selectedFormat === "pandoc") {
            const cmd = `${settings.pandocPath} "${baseName}.md" -s -o "${baseName}.epub"`;
            await copyToClipboard(cmd, context);
            context.ui?.showNotice?.("已为您复制 Pandoc 终端执行命令！");
            closeModal();
          }
        } catch (err) {
          console.error("[Enhancing Export] export error:", err);
          context.ui?.showNotice?.(`导出异常: ${err.message || err}`);
        } finally {
          btnExport.disabled = false;
        }
      };
    }

    // ==================== 13. Pandoc 环境检测与安装指引对话框 ====================
    function openPandocGuideModal() {
      document.querySelectorAll(".edgeever-export-modal-backdrop").forEach((el) => el.remove());

      const backdrop = document.createElement("div");
      backdrop.className = "edgeever-export-modal-backdrop";

      backdrop.innerHTML = `
        <div class="ee-pandoc-dialog">
          <div class="ee-pandoc-dialog-header">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 18px;">⚙️</span>
              <strong style="font-size: 15px;">Pandoc 环境检测与安装指引</strong>
            </div>
            <button type="button" class="edgeever-export-modal-close-btn" title="关闭 (Esc)">✕</button>
          </div>
          <div class="ee-pandoc-dialog-body">
            ${
              !isDesktop
                ? `
              <div class="ee-pandoc-status-badge is-ok">
                <span>🌐 当前环境：Web / 移动端</span>
              </div>
              <p style="margin: 0 0 10px 0;">当前 EdgeEver 运行在浏览器或移动设备环境中，由于沙盒权限限制，无需且不支持调用本地 Pandoc 二进制可执行文件。</p>
              <p style="margin: 0; color: var(--ee-export-text-muted);">
                ✨ <strong>温馨提示：</strong>本插件内置的 <strong>独立网页 (.html)、Word 文档 (.doc)、PDF 打印与 Markdown (.md)</strong> 均由内置的高性能 JavaScript 渲染引擎原生驱动，无需任何第三方依赖与配置，随时随地开箱即用！
              </p>
            `
                : `
              <div class="ee-pandoc-status-badge is-warn">
                <span>💻 当前环境：桌面客户端 (Desktop)</span>
              </div>
              <p style="margin: 0 0 8px 0;">
                当前配置路径: <code style="background: rgba(0,0,0,0.06); padding: 2px 6px; border-radius: 4px;">${escapeHtml(
                  settings.pandocPath
                )}</code>
              </p>
              <p style="margin: 0 0 12px 0; color: var(--ee-export-text-muted); font-size: 12px;">
                Pandoc 是强大的开源文档格式转换利器。如您需要导出为 EPUB、LaTeX、Typst 等学术格式，请确保系统中已安装 Pandoc：
              </p>

              <div style="font-weight: 600; font-size: 12px; margin-top: 10px;">🍏 macOS 一键安装 (Homebrew):</div>
              <div class="ee-pandoc-code-box">
                <code>brew install pandoc</code>
                <button type="button" class="ee-pandoc-copy-btn" data-copy="brew install pandoc">复制</button>
              </div>

              <div style="font-weight: 600; font-size: 12px; margin-top: 8px;">🪟 Windows 一键安装 (Winget / Chocolatey):</div>
              <div class="ee-pandoc-code-box">
                <code>winget install JohnMacFarlane.Pandoc</code>
                <button type="button" class="ee-pandoc-copy-btn" data-copy="winget install JohnMacFarlane.Pandoc">复制</button>
              </div>

              <div style="font-weight: 600; font-size: 12px; margin-top: 8px;">🐧 Linux (Ubuntu / Debian):</div>
              <div class="ee-pandoc-code-box">
                <code>sudo apt install pandoc</code>
                <button type="button" class="ee-pandoc-copy-btn" data-copy="sudo apt install pandoc">复制</button>
              </div>

              <div style="margin-top: 12px; font-size: 12px;">
                🌐 官方安装包下载:
                <a href="https://pandoc.org/installing.html" target="_blank" rel="noopener noreferrer" style="color: var(--ee-export-primary); font-weight: 600; text-decoration: underline;">
                  pandoc.org/installing.html
                </a>
              </div>
            `
            }
            <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
              <button type="button" class="edgeever-btn edgeever-btn-primary ee-close-dialog-btn" style="padding: 7px 18px;">我知道了</button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(backdrop);

      const closeDialog = () => backdrop.remove();
      backdrop.querySelector(".edgeever-export-modal-close-btn").onclick = closeDialog;
      backdrop.querySelector(".ee-close-dialog-btn").onclick = closeDialog;
      backdrop.onclick = (e) => {
        if (e.target === backdrop) closeDialog();
      };

      backdrop.querySelectorAll(".ee-pandoc-copy-btn").forEach((btn) => {
        btn.onclick = async () => {
          const cmd = btn.dataset.copy;
          if (cmd) {
            await copyToClipboard(cmd, context);
            btn.textContent = "已复制";
            setTimeout(() => (btn.textContent = "复制"), 1500);
          }
        };
      });
    }

    // ==================== 14. 注册命令与入口安全挂载 ====================
    context.commands.register({
      id: "enhancing-export-open",
      title: "增强导出 (Enhancing Export)...",
      listed: true,
      run() {
        openExportModal();
      },
    });

    context.commands.register({
      id: "enhancing-export-pandoc-guide",
      title: "Pandoc 环境检测与安装指引",
      listed: true,
      run() {
        openPandocGuideModal();
      },
    });

    let currentButtonEl = null;

    function cleanupButton() {
      if (currentButtonEl) {
        try {
          currentButtonEl.remove();
        } catch (e) {}
        currentButtonEl = null;
      }
      document
        .querySelectorAll("#edgeever-enhancing-export-btn, .edgeever-enhancing-export-trigger-btn")
        .forEach((b) => b.remove());
    }

    function findFormattingToolbar() {
      const selectors = [
        ".edgeever-editor-toolbar",
        ".ProseMirror-menubar",
        ".tiptap-toolbar",
        '[role="toolbar"]',
        ".editor-toolbar",
        ".note-editor-toolbar",
      ];
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el) return el;
      }

      const toolbars = document.querySelectorAll("div, nav, header");
      for (const tb of toolbars) {
        const btns = tb.querySelectorAll("button");
        if (btns.length >= 6) {
          return tb;
        }
      }

      return null;
    }

    function ensureButtonMounted() {
      if (settings.buttonPosition === "hidden") {
        cleanupButton();
        return;
      }

      // 如果按钮已挂载且连接在 DOM 树中，绝不重复创建，彻底杜绝闪烁
      if (currentButtonEl && currentButtonEl.isConnected) {
        return;
      }

      const existing = document.getElementById("edgeever-enhancing-export-btn");
      if (existing && existing.isConnected) {
        currentButtonEl = existing;
        return;
      }

      cleanupButton();

      const btn = document.createElement("button");
      btn.type = "button";
      btn.id = "edgeever-enhancing-export-btn";
      btn.title = "增强导出 (HTML / Word / PDF / Markdown)";

      const svgIcon = `
        <svg viewBox="0 0 24 24">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
      `;

      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        openExportModal();
      });

      if (settings.buttonPosition === "toolbar") {
        const toolbar = findFormattingToolbar();
        if (toolbar) {
          btn.className = "edgeever-enhancing-export-trigger-btn is-toolbar-btn";
          btn.innerHTML = svgIcon;
          toolbar.appendChild(btn);
          currentButtonEl = btn;
          return;
        }
      }

      // 悬浮模式 (安全位于原生 AI 唤出按钮上方)
      btn.className = "edgeever-enhancing-export-trigger-btn is-fab";
      btn.innerHTML = svgIcon;
      document.body.appendChild(btn);
      currentButtonEl = btn;
    }

    let timer = null;
    const observer = new MutationObserver(() => {
      if (currentButtonEl && currentButtonEl.isConnected) {
        return;
      }
      clearTimeout(timer);
      timer = setTimeout(ensureButtonMounted, 350);
    });

    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(ensureButtonMounted, 300);

    context.events.on("settings.changed", async () => {
      await loadSettings();
      cleanupButton();
      ensureButtonMounted();
    });

    return () => {
      observer.disconnect();
      cleanupButton();
      document.querySelectorAll(".edgeever-export-modal-backdrop").forEach((b) => b.remove());
      const oldFrame = document.getElementById("ee-export-print-frame");
      if (oldFrame) oldFrame.remove();
    };
  },
};
