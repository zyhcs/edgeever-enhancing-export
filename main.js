/**
 * EdgeEver Enhancing Export Plugin
 * 专业级多格式增强导出插件 (Inspired by obsidian-enhancing-export)
 * 深度适配 EdgeEver 笔记系统，提供真实文档所见即所得排版预览、全量图片 Base64 内嵌、Word (.docx)、独立 HTML、纯净与博客 Markdown、高保真 PDF 打印及 Pandoc 扩展。
 */

// ==================== 1. 内置独立排版主题样式库 ====================
const THEMES = {
  "github-light": {
    name: "GitHub 浅色经典",
    bg: "#ffffff",
    text: "#1f2328",
    muted: "#656d76",
    border: "#d0d7de",
    codeBg: "#f6f8fa",
    accent: "#0969da",
    blockquoteBorder: "#d0d7de",
    tableHeaderBg: "#f6f8fa",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif',
  },
  "modern-dark": {
    name: "暗夜极客黑",
    bg: "#0d1117",
    text: "#e6edf3",
    muted: "#848d97",
    border: "#30363d",
    codeBg: "#161b22",
    accent: "#2f81f7",
    blockquoteBorder: "#3b434b",
    tableHeaderBg: "#161b22",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif',
  },
  academic: {
    name: "学术论文风",
    bg: "#fcfbf7",
    text: "#222222",
    muted: "#555555",
    border: "#d5d1c8",
    codeBg: "#f3efe6",
    accent: "#8b261e",
    blockquoteBorder: "#8b261e",
    tableHeaderBg: "#eee9de",
    fontFamily: '"Times New Roman", "Songti SC", "SimSun", Georgia, serif',
  },
  editorial: {
    name: "优雅杂志风",
    bg: "#faf7f2",
    text: "#2c2a29",
    muted: "#7c7774",
    border: "#e2ded7",
    codeBg: "#f0ebe1",
    accent: "#b45309",
    blockquoteBorder: "#d97706",
    tableHeaderBg: "#f2ece1",
    fontFamily: '"Georgia", "Baskerville", "Source Han Serif CN", serif',
  },
  "clean-white": {
    name: "极简纯白风",
    bg: "#ffffff",
    text: "#111827",
    muted: "#6b7280",
    border: "#e5e7eb",
    codeBg: "#f9fafb",
    accent: "#059669",
    blockquoteBorder: "#10b981",
    tableHeaderBg: "#f3f4f6",
    fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
  },
};

// ==================== 2. 图片安全提取与 Base64 转换器 ====================
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

  // 1. 如果本身已经是 base64 data url，直接返回
  if (trimmed.startsWith("data:")) {
    return trimmed;
  }

  // 2. 检查是否为 EdgeEver 内部资源引用 (res_xxx)
  // 支持格式：/api/v1/resources/res_xxx/blob, /api/v1/resources/res_xxx, resource:res_xxx, res_xxx
  const resMatch = trimmed.match(/(res_[a-f0-9]{24,40})/);
  if (resMatch) {
    const resId = resMatch[1];
    // A. 尝试通过 context.resources.read 读取
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

    // B. 从当前页面的活动编辑器 DOM 寻找已经加载的 img 元素
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

    // C. 相对路径补全为完整绝对 URL，避免在本地成为 broken file:// 路径
    if (trimmed.startsWith("/")) {
      const baseUrl =
        window.location.origin && window.location.origin !== "null" && window.location.origin !== "file://"
          ? window.location.origin
          : "https://edgeever.zyh-cjs.workers.dev";
      return `${baseUrl}${trimmed}`;
    }
  }

  // 3. 外部网络图片 (http:// 或 https://)
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      // 尝试匹配活动 DOM 中已下载好的跨域/缓存图片
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
            } catch (corsErr) {
              // 跨域受限则保留完整原 URL
            }
          }
        }
      }
    } catch (e) {}

    return trimmed;
  }

  // 4. 其他相对路径补全
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

  // 1. 匹配所有 Markdown 图片语法: ![alt](url)
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

  // 2. 匹配所有 HTML <img> 标签语法: <img src="..." ...>
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

// ==================== 3. 高保真 Markdown 解析与 HTML 渲染引擎 ====================
function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderMarkdownToHtml(markdown) {
  if (!markdown) return "";

  let md = markdown.replace(/\r\n/g, "\n");

  // 1. 抽取并保护代码块
  const codeBlocks = [];
  md = md.replace(/```([a-zA-Z0-9_\-+]*)\n([\s\S]*?)```/g, (_m, lang, code) => {
    const placeholder = `__EE_CODE_BLOCK_${codeBlocks.length}__`;
    codeBlocks.push({ lang: (lang || "").trim(), code });
    return placeholder;
  });

  // 2. 抽取并保护独立与行内数学公式
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

    // 数学公式占位符还原
    s = s.replace(/__EE_MATH_INLINE_(\d+)__/g, (_m, idx) => {
      const code = mathInlines[Number(idx)] || "";
      return `<span class="ee-math-inline">${escapeHtml(code)}</span>`;
    });

    // 图片渲染
    s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, alt, src) => {
      return `<img src="${src}" alt="${alt}" class="ee-img" loading="lazy" />`;
    });

    // 链接
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label, href) => {
      return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="ee-link">${label}</a>`;
    });

    // 行内代码
    s = s.replace(/`([^`]+)`/g, (_m, code) => {
      return `<code class="ee-inline-code">${code}</code>`;
    });

    // 粗体 + 斜体
    s = s.replace(/\*\*\*([^*]+)\*\*\*/g, "<strong><em>$1</em></strong>");
    // 粗体
    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/__([^_]+)__/g, "<strong>$1</strong>");
    // 斜体
    s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    s = s.replace(/_([^_]+)_/g, "<em>$1</em>");
    // 删除线
    s = s.replace(/~~([^~]+)~~/g, "<del>$1</del>");
    // 高亮
    s = s.replace(/==([^=]+)==/g, "<mark>$1</mark>");
    // 标签
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

    // 过滤表头对齐分隔线 (如 |---|---|)
    if (/^\|?(\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?$/.test(trimmed)) {
      continue;
    }

    // 表格行
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

    // 标题 (H1 - H6)
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

    // 水平分割线
    if (/^(\*{3,}|-{3,}|_{3,})$/.test(trimmed)) {
      flushList();
      flushBlockquote();
      htmlParts.push("<hr />");
      continue;
    }

    // 引用块
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

    // 任务列表 Checkbox
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

    // 无序列表
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

    // 有序列表
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

    // 代码块或公式占位符
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

  // 还原代码块
  finalHtml = finalHtml.replace(/__EE_CODE_BLOCK_(\d+)__/g, (_m, idx) => {
    const item = codeBlocks[Number(idx)];
    if (!item) return "";
    const langBadge = item.lang
      ? `<div class="ee-code-header"><span class="ee-code-lang">${escapeHtml(item.lang)}</span></div>`
      : "";
    return `
      <div class="ee-code-block-wrapper">
        ${langBadge}
        <pre><code class="language-${escapeHtml(item.lang)}">${escapeHtml(item.code)}</code></pre>
      </div>
    `;
  });

  // 还原独立数学公式
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

// ==================== 4. 独立 HTML 导出生成器 ====================
function generateStandaloneHtml(article, themeConfig, options = {}) {
  const { title, contentHtml, createdAt, updatedAt, tags, notebook } = article;
  const fontSize = options.fontSize || 15;
  const metaItems = [
    notebook ? `<span>📁 ${escapeHtml(notebook)}</span>` : "",
    updatedAt ? `<span>🕒 更新于 ${escapeHtml(updatedAt)}</span>` : "",
    tags && tags.length > 0 ? `<span>🏷️ ${tags.map((t) => `#${escapeHtml(t)}`).join(" ")}</span>` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title || "无标题笔记")}</title>
  <style>
    :root {
      --ee-bg: ${themeConfig.bg};
      --ee-text: ${themeConfig.text};
      --ee-muted: ${themeConfig.muted};
      --ee-border: ${themeConfig.border};
      --ee-code-bg: ${themeConfig.codeBg};
      --ee-accent: ${themeConfig.accent};
      --ee-font: ${themeConfig.fontFamily};
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
    }
    .ee-container {
      max-width: 820px;
      margin: 0 auto;
      padding: 48px 24px 80px 24px;
    }
    .ee-article-header {
      border-bottom: 1px solid var(--ee-border);
      padding-bottom: 20px;
      margin-bottom: 36px;
    }
    .ee-title {
      font-size: 2.2em;
      font-weight: 750;
      line-height: 1.25;
      margin: 0 0 14px 0;
      color: var(--ee-text);
      letter-spacing: -0.02em;
    }
    .ee-meta {
      font-size: 0.88em;
      color: var(--ee-muted);
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }
    h1, h2, h3, h4, h5, h6 {
      color: var(--ee-text);
      font-weight: 650;
      line-height: 1.35;
      margin-top: 1.6em;
      margin-bottom: 0.6em;
    }
    h1 { font-size: 1.8em; border-bottom: 1px solid var(--ee-border); padding-bottom: 0.3em; }
    h2 { font-size: 1.45em; border-bottom: 1px solid var(--ee-border); padding-bottom: 0.25em; }
    h3 { font-size: 1.22em; }
    h4 { font-size: 1.05em; }
    p { margin: 0.9em 0; }
    a { color: var(--ee-accent); text-decoration: none; border-bottom: 1px solid transparent; }
    a:hover { border-bottom-color: var(--ee-accent); }
    blockquote {
      margin: 1.4em 0;
      padding: 10px 18px;
      border-left: 4px solid ${themeConfig.blockquoteBorder};
      background: var(--ee-code-bg);
      color: var(--ee-muted);
      border-radius: 0 8px 8px 0;
    }
    blockquote p { margin: 0.4em 0; }
    ul, ol { padding-left: 26px; margin: 0.9em 0; }
    li { margin: 0.3em 0; }
    .ee-task-list { list-style: none; padding-left: 4px; }
    .ee-task-item { display: flex; align-items: baseline; gap: 8px; margin: 0.4em 0; }
    .ee-task-item input { accent-color: var(--ee-accent); }
    hr { border: none; border-top: 1px solid var(--ee-border); margin: 2.2em 0; }
    .ee-img { max-width: 100%; height: auto; border-radius: 8px; margin: 1.2em 0; border: 1px solid var(--ee-border); }
    .ee-inline-code {
      font-family: SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.88em;
      background: var(--ee-code-bg);
      color: var(--ee-text);
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid var(--ee-border);
    }
    .ee-code-block-wrapper {
      margin: 1.5em 0;
      background: var(--ee-code-bg);
      border: 1px solid var(--ee-border);
      border-radius: 10px;
      overflow: hidden;
    }
    .ee-code-header {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding: 6px 14px;
      background: rgba(0, 0, 0, 0.04);
      border-bottom: 1px solid var(--ee-border);
    }
    .ee-code-lang {
      font-family: SFMono-Regular, Menlo, monospace;
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 600;
      color: var(--ee-muted);
    }
    pre {
      margin: 0;
      padding: 14px 18px;
      overflow-x: auto;
      font-family: SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.88em;
      line-height: 1.55;
    }
    pre code { background: none; border: none; padding: 0; }
    .ee-table-wrapper { overflow-x: auto; margin: 1.5em 0; }
    table { width: 100%; border-collapse: collapse; font-size: 0.94em; }
    th, td { border: 1px solid var(--ee-border); padding: 8px 14px; text-align: left; }
    th { background: ${themeConfig.tableHeaderBg}; font-weight: 600; }
    .ee-math-block {
      margin: 1.5em 0;
      padding: 12px;
      background: var(--ee-code-bg);
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
      margin-top: 60px;
      padding-top: 24px;
      border-top: 1px solid var(--ee-border);
      text-align: center;
      font-size: 0.82em;
      color: var(--ee-muted);
    }
    @media print {
      body { background: #ffffff !important; color: #000000 !important; font-size: 11pt !important; }
      .ee-container { max-width: 100% !important; padding: 0 !important; }
      .ee-code-block-wrapper, blockquote { page-break-inside: avoid; }
      .ee-footer { display: none; }
    }
  </style>
</head>
<body>
  <div class="ee-container">
    <header class="ee-article-header">
      <h1 class="ee-title">${escapeHtml(title || "无标题笔记")}</h1>
      ${metaItems ? `<div class="ee-meta">${metaItems}</div>` : ""}
    </header>
    <main class="ee-content">
      ${contentHtml}
    </main>
    <footer class="ee-footer">
      由 EdgeEver 增强导出生成 · ${new Date().toLocaleDateString()}
    </footer>
  </div>
</body>
</html>`;
}

// ==================== 5. 博客 Markdown (Hugo/Hexo) 导出生成器 ====================
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

  const cleanContent = rawMarkdown.replace(/^---\n[\s\S]*?\n---\n/, "");
  return frontmatter + cleanContent;
}

// ==================== 6. Word (.docx / MHTML-Word) 导出生成器 ====================
function generateWordDocument(article, htmlContent) {
  const { title, notebook } = article;
  return `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
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
    @page Section1 {
      size: 595.3pt 841.9pt;
      margin: 56.7pt 56.7pt 56.7pt 56.7pt;
      mso-header-margin: 36.0pt;
      mso-footer-margin: 36.0pt;
      mso-paper-source: 0;
    }
    div.Section1 { page: Section1; }
    body {
      font-family: 'Calibri', 'Microsoft YaHei', 'SimSun', sans-serif;
      font-size: 11.0pt;
      line-height: 1.6;
      color: #111111;
    }
    h1 { font-size: 22.0pt; font-weight: bold; color: #1a202c; margin-top: 18.0pt; margin-bottom: 8.0pt; }
    h2 { font-size: 16.0pt; font-weight: bold; color: #2d3748; margin-top: 14.0pt; margin-bottom: 6.0pt; }
    h3 { font-size: 13.5pt; font-weight: bold; color: #4a5568; margin-top: 10.0pt; margin-bottom: 4.0pt; }
    p { margin: 6.0pt 0; }
    table { width: 100%; border-collapse: collapse; margin: 12.0pt 0; }
    th, td { border: 1.0pt solid #cbd5e0; padding: 6.0pt 9.0pt; text-align: left; }
    th { background: #edf2f7; font-weight: bold; }
    blockquote {
      border-left: 3.0pt solid #3182ce;
      padding-left: 9.0pt;
      margin: 10.0pt 0;
      color: #4a5568;
      background: #f7fafc;
    }
    pre {
      background: #f7fafc;
      border: 1.0pt solid #e2e8f0;
      padding: 8.0pt;
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 9.5pt;
      line-height: 1.4;
    }
    code { font-family: 'Consolas', 'Courier New', monospace; font-size: 10.0pt; }
    img { max-width: 100%; height: auto; }
  </style>
</head>
<body>
  <div class="Section1">
    <h1>${escapeHtml(title || "无标题笔记")}</h1>
    <p style="color: #718096; font-size: 9.5pt; border-bottom: 1pt solid #e2e8f0; padding-bottom: 6pt; margin-bottom: 16pt;">
      ${notebook ? `文件夹: ${escapeHtml(notebook)} | ` : ""}导出时间: ${new Date().toLocaleString()}
    </p>
    ${htmlContent}
  </div>
</body>
</html>`;
}

// ==================== 7. 文件下载与剪贴板工具 ====================
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

// ==================== 8. 导出格式预设定义 (参考 enhancing-export) ====================
const EXPORT_FORMATS = [
  {
    id: "html",
    name: "独立离线网页",
    ext: ".html",
    engine: "builtin",
    icon: "🌐",
    desc: "将样式、排版与所有本地图片全部内嵌 Base64，离线随处双击完美呈现。",
    mime: "text/html;charset=utf-8",
  },
  {
    id: "docx",
    name: "Word 文档",
    ext: ".docx",
    engine: "builtin",
    icon: "📄",
    desc: "高保真 Word 规范文档，支持表格与内嵌图片，Microsoft Word / WPS 无缝打开。",
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
  {
    id: "pdf",
    name: "高保真 PDF 打印",
    ext: ".pdf",
    engine: "builtin",
    icon: "🖨️",
    desc: "针对 A4 纸张排版优化，支持自选字号与主题，直接打印或另存为高清 PDF。",
    mime: "application/pdf",
  },
  {
    id: "md",
    name: "纯净标准 Markdown",
    ext: ".md",
    engine: "builtin",
    icon: "📝",
    desc: "符合通用 CommonMark 规范的 Markdown 文本，方便在任何外部工具中编辑。",
    mime: "text/markdown;charset=utf-8",
  },
  {
    id: "hugo",
    name: "博客文章 (Hugo/Hexo)",
    ext: ".md",
    engine: "builtin",
    icon: "🚀",
    desc: "自动补充 YAML Frontmatter（标题、时间、标签、分类），完美适配静态博客流水线。",
    mime: "text/markdown;charset=utf-8",
  },
  {
    id: "pandoc",
    name: "Pandoc 学术与扩展",
    ext: ".epub",
    engine: "pandoc",
    icon: "⚙️",
    desc: "利用 Pandoc 导出为 EPUB、LaTeX (.tex)、Typst、PowerPoint (.pptx) 等高级格式。",
    mime: "text/plain",
  },
];

// ==================== 9. 核心插件生命周期 ====================
export default {
  activate(context) {
    let settings = {
      defaultFormat: "html",
      defaultTheme: "github-light",
      defaultFontSize: "15",
      embedImagesBase64: true,
      includeFrontmatter: true,
      showToolbarButton: true,
      pandocPath: "pandoc",
    };

    async function loadSettings() {
      try {
        const fmt = await context.settings.get("default_format");
        const thm = await context.settings.get("default_theme");
        const fs = await context.settings.get("default_font_size");
        const embed = await context.settings.get("embed_images_base64");
        const fm = await context.settings.get("include_frontmatter");
        const btn = await context.settings.get("show_toolbar_button");
        const pandoc = await context.settings.get("pandoc_path");

        if (fmt !== null) settings.defaultFormat = String(fmt);
        if (thm !== null) settings.defaultTheme = String(thm);
        if (fs !== null) settings.defaultFontSize = String(fs);
        if (embed !== null) settings.embedImagesBase64 = Boolean(embed);
        if (fm !== null) settings.includeFrontmatter = Boolean(fm);
        if (btn !== null) settings.showToolbarButton = Boolean(btn);
        if (pandoc !== null) settings.pandocPath = String(pandoc);
      } catch (e) {
        console.warn("[Enhancing Export] loadSettings error:", e);
      }
    }

    loadSettings();

    // 获取并解析当前笔记
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

      // 提取并彻底解析全部图片为 Base64 / 完整可用 URL
      let markdownWithImages = rawMarkdown;
      try {
        markdownWithImages = await resolveAllImagesInMarkdown(rawMarkdown, context);
      } catch (err) {
        console.warn("[Enhancing Export] resolveAllImagesInMarkdown error:", err);
      }

      const contentHtml = renderMarkdownToHtml(markdownWithImages);

      return {
        title,
        rawMarkdown: markdownWithImages,
        contentHtml,
        tags,
        notebook,
        createdAt,
        updatedAt,
      };
    }

    // ==================== 10. 导出交互向导弹窗 (双栏带实时所见即所得排版预览) ====================
    async function openExportModal() {
      // 移除可能存在的旧弹窗
      document.querySelectorAll(".edgeever-export-modal-backdrop").forEach((el) => el.remove());

      const article = await getCurrentArticle();
      if (!article.rawMarkdown.trim()) {
        context.ui?.showNotice?.("当前笔记没有可导出的内容！");
        return;
      }

      let selectedFormat = settings.defaultFormat;
      let selectedTheme = settings.defaultTheme;
      let selectedFontSize = settings.defaultFontSize;
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
                <div class="edgeever-export-modal-subtitle">左侧调整排版参数，右侧实时所见即所得预览</div>
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

                <!-- 排版风格主题 -->
                <div class="edgeever-form-group" id="ee-theme-group">
                  <label class="edgeever-form-label">排版设计风格</label>
                  <div class="edgeever-segment-group" id="ee-theme-segments"></div>
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

                <!-- 高级选项 -->
                <div class="edgeever-form-group">
                  <label class="edgeever-form-label">高级选项</label>
                  <div class="edgeever-checkbox-group">
                    <label class="edgeever-checkbox-label">
                      <input type="checkbox" id="ee-opt-embed-img" ${settings.embedImagesBase64 ? "checked" : ""} />
                      <span>自动内嵌本地图片 Base64 (离线不丢图)</span>
                    </label>
                    <label class="edgeever-checkbox-label">
                      <input type="checkbox" id="ee-opt-frontmatter" ${settings.includeFrontmatter ? "checked" : ""} />
                      <span>包含文章元数据 (Frontmatter / 标签)</span>
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

            <!-- 右侧：真实所见即所得排版预览区 -->
            <div class="edgeever-export-preview-pane">
              <div class="edgeever-preview-header">
                <span style="font-weight: 600;">📄 实时排版预览</span>
                <div class="preview-badge-group">
                  <span class="preview-pill" id="ee-preview-theme-pill">GitHub 浅色经典</span>
                  <span class="preview-pill" id="ee-preview-size-pill">15px</span>
                </div>
              </div>
              <div class="edgeever-preview-viewport">
                <!-- 真实纸张画布 -->
                <div class="edgeever-live-preview-paper" id="ee-live-paper">
                  <h1 class="preview-title">${escapeHtml(article.title || "无标题笔记")}</h1>
                  <div class="preview-meta">
                    ${article.notebook ? `<span>📁 ${escapeHtml(article.notebook)}</span>` : ""}
                    ${article.updatedAt ? `<span>🕒 ${escapeHtml(article.updatedAt)}</span>` : ""}
                    ${article.tags && article.tags.length > 0 ? `<span>🏷️ ${article.tags.map((t) => `#${escapeHtml(t)}`).join(" ")}</span>` : ""}
                  </div>
                  <div class="preview-content-body">${article.contentHtml}</div>
                </div>
                <!-- 纯文本模式预览 -->
                <div class="edgeever-raw-preview-text" id="ee-raw-preview" style="display: none;"></div>
              </div>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(backdrop);

      // DOM 引用
      const cardsList = backdrop.querySelector(".edgeever-export-cards-list");
      const themeSegments = backdrop.querySelector("#ee-theme-segments");
      const fontSizeSegments = backdrop.querySelector("#ee-fontsize-segments");
      const fileNameInput = backdrop.querySelector("#ee-filename-input");
      const extHint = backdrop.querySelector("#ee-ext-hint");
      const previewThemePill = backdrop.querySelector("#ee-preview-theme-pill");
      const previewSizePill = backdrop.querySelector("#ee-preview-size-pill");
      const livePaper = backdrop.querySelector("#ee-live-paper");
      const rawPreview = backdrop.querySelector("#ee-raw-preview");
      const btnExport = backdrop.querySelector("#ee-btn-export");
      const btnCopy = backdrop.querySelector("#ee-btn-copy");
      const btnClose = backdrop.querySelector(".edgeever-export-modal-close-btn");

      // 渲染格式卡片
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

      // 渲染排版主题胶囊
      Object.entries(THEMES).forEach(([key, thm]) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `edgeever-segment-btn ${key === selectedTheme ? "is-active" : ""}`;
        btn.dataset.theme = key;
        btn.textContent = thm.name;
        btn.onclick = () => {
          selectedTheme = key;
          themeSegments.querySelectorAll(".edgeever-segment-btn").forEach((b) => b.classList.remove("is-active"));
          btn.classList.add("is-active");
          updateUiState();
        };
        themeSegments.appendChild(btn);
      });

      // 正文字号胶囊
      fontSizeSegments.querySelectorAll(".edgeever-segment-btn").forEach((btn) => {
        if (btn.dataset.size === selectedFontSize) btn.classList.add("is-active");
        btn.onclick = () => {
          selectedFontSize = btn.dataset.size;
          fontSizeSegments.querySelectorAll(".edgeever-segment-btn").forEach((b) => b.classList.remove("is-active"));
          btn.classList.add("is-active");
          updateUiState();
        };
      });

      // 核心：实时所见即所得更新函数
      function updateUiState() {
        const fmtObj = EXPORT_FORMATS.find((f) => f.id === selectedFormat) || EXPORT_FORMATS[0];
        const themeConfig = THEMES[selectedTheme] || THEMES["github-light"];
        extHint.textContent = fmtObj.ext;

        const isVisualFormat = selectedFormat === "html" || selectedFormat === "docx" || selectedFormat === "pdf";

        // 控制主题与字号选项显示
        backdrop.querySelector("#ee-theme-group").style.display = isVisualFormat ? "flex" : "none";
        backdrop.querySelector("#ee-fontsize-group").style.display = isVisualFormat ? "flex" : "none";

        previewThemePill.textContent = themeConfig.name;
        previewSizePill.textContent = `${selectedFontSize}px`;

        if (isVisualFormat) {
          livePaper.style.display = "block";
          rawPreview.style.display = "none";

          // 实时将所选主题的色彩、背景、字体、代码块样式动态应用到右侧纸张画布
          livePaper.style.backgroundColor = themeConfig.bg;
          livePaper.style.color = themeConfig.text;
          livePaper.style.fontFamily = themeConfig.fontFamily;
          livePaper.style.fontSize = `${selectedFontSize}px`;

          // 代码块与引用块样式联动
          livePaper.querySelectorAll("pre").forEach((pre) => {
            pre.style.backgroundColor = themeConfig.codeBg;
            pre.style.borderColor = themeConfig.border;
          });
          livePaper.querySelectorAll("blockquote").forEach((bq) => {
            bq.style.backgroundColor = themeConfig.codeBg;
            bq.style.borderLeftColor = themeConfig.blockquoteBorder;
            bq.style.color = themeConfig.muted;
          });
          livePaper.querySelectorAll("th, td").forEach((cell) => {
            cell.style.borderColor = themeConfig.border;
          });
          livePaper.querySelectorAll("th").forEach((th) => {
            th.style.backgroundColor = themeConfig.tableHeaderBg;
          });
          livePaper.querySelectorAll(".preview-meta").forEach((m) => {
            m.style.borderColor = themeConfig.border;
            m.style.color = themeConfig.muted;
          });

          if (selectedFormat === "pdf") {
            btnExport.textContent = "🖨️ 打开打印 / 保存 PDF";
          } else {
            btnExport.textContent = "📥 立即导出并保存";
          }
        } else {
          // 纯文本预览模式 (Markdown, Hugo, Pandoc)
          livePaper.style.display = "none";
          rawPreview.style.display = "block";

          if (selectedFormat === "hugo") {
            rawPreview.textContent = generateHugoMarkdown(article, article.rawMarkdown);
          } else if (selectedFormat === "pandoc") {
            const baseName = (fileNameInput.value || article.title || "Note").trim();
            rawPreview.textContent = `# Pandoc 转换执行指令 (在终端运行):\n${settings.pandocPath} "${baseName}.md" -s -o "${baseName}.epub" --metadata title="${article.title}"\n\n# 支持导出格式: epub, docx, pdf, tex, typst, pptx\n# 变量替换: \${currentPath}, \${outputPath}, \${outputDir}`;
          } else {
            rawPreview.textContent = article.rawMarkdown;
          }

          btnExport.textContent = selectedFormat === "pandoc" ? "📋 复制 Pandoc 命令行" : "📥 导出 Markdown 文件";
        }
      }

      updateUiState();

      // 关闭事件
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

      // 复制内容
      btnCopy.onclick = async () => {
        const themeConfig = THEMES[selectedTheme] || THEMES["github-light"];
        let textToCopy = "";

        if (selectedFormat === "html") {
          textToCopy = generateStandaloneHtml(article, themeConfig, { fontSize: selectedFontSize });
        } else if (selectedFormat === "hugo") {
          textToCopy = generateHugoMarkdown(article, article.rawMarkdown);
        } else if (selectedFormat === "docx") {
          textToCopy = generateWordDocument(article, article.contentHtml);
        } else if (selectedFormat === "pandoc") {
          textToCopy = `${settings.pandocPath} "input.md" -s -o "output.epub"`;
        } else {
          textToCopy = article.rawMarkdown;
        }

        await copyToClipboard(textToCopy, context);
      };

      // 导出下载
      btnExport.onclick = async () => {
        const fmtObj = EXPORT_FORMATS.find((f) => f.id === selectedFormat) || EXPORT_FORMATS[0];
        const baseName = (fileNameInput.value || article.title || "Note").trim();
        const outputFileName = `${baseName}${fmtObj.ext}`;
        const themeConfig = THEMES[selectedTheme] || THEMES["github-light"];

        btnExport.disabled = true;

        try {
          if (selectedFormat === "html") {
            const html = generateStandaloneHtml(article, themeConfig, { fontSize: selectedFontSize });
            downloadFile(html, outputFileName, fmtObj.mime);
            context.ui?.showNotice?.(`独立网页 ${outputFileName} 导出成功！`);
            setTimeout(closeModal, 600);
          } else if (selectedFormat === "md") {
            downloadFile(article.rawMarkdown, outputFileName, fmtObj.mime);
            context.ui?.showNotice?.(`Markdown 文档 ${outputFileName} 导出成功！`);
            setTimeout(closeModal, 600);
          } else if (selectedFormat === "hugo") {
            const hugoMd = generateHugoMarkdown(article, article.rawMarkdown);
            downloadFile(hugoMd, outputFileName, fmtObj.mime);
            context.ui?.showNotice?.(`博客 Markdown ${outputFileName} 导出成功！`);
            setTimeout(closeModal, 600);
          } else if (selectedFormat === "docx") {
            const docxContent = generateWordDocument(article, article.contentHtml);
            downloadFile(docxContent, outputFileName, "application/msword;charset=utf-8");
            context.ui?.showNotice?.(`Word 文档 ${outputFileName} 导出成功！可在 Word/WPS 中直接打开。`);
            setTimeout(closeModal, 600);
          } else if (selectedFormat === "pdf") {
            const printHtml = generateStandaloneHtml(article, themeConfig, { fontSize: selectedFontSize });
            const printWin = window.open("", "_blank");
            if (printWin) {
              printWin.document.open();
              printWin.document.write(printHtml);
              printWin.document.close();
              printWin.focus();
              setTimeout(() => {
                printWin.print();
              }, 400);
              context.ui?.showNotice?.("已调起打印预览窗口，请选择「另存为 PDF」！");
              closeModal();
            } else {
              context.ui?.showNotice?.("无法打开打印窗口，请检查浏览器弹窗权限！");
            }
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

    // ==================== 11. 注册核心命令与顶部快捷入口 ====================
    context.commands.register({
      id: "enhancing-export-open",
      title: "增强导出 (Enhancing Export)...",
      listed: true,
      run() {
        openExportModal();
      },
    });

    function injectToolbarButton() {
      if (!settings.showToolbarButton) return;
      if (document.querySelector(".edgeever-enhancing-export-trigger-btn")) return;

      const targetHeader =
        document.querySelector(".edgeever-note-header-actions") ||
        document.querySelector(".edgeever-editor-toolbar") ||
        document.querySelector("header .actions") ||
        document.querySelector(".editor-header");

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "edgeever-enhancing-export-trigger-btn";
      btn.title = "增强导出为 HTML / Word / PDF / Markdown (Enhancing Export)";
      btn.innerHTML = `
        <svg viewBox="0 0 24 24">
          <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2v9.67z" />
        </svg>
        <span>增强导出</span>
      `;
      btn.onclick = (e) => {
        e.stopPropagation();
        openExportModal();
      };

      if (targetHeader) {
        targetHeader.insertBefore(btn, targetHeader.firstChild);
      } else {
        btn.style.position = "fixed";
        btn.style.top = "12px";
        btn.style.right = "80px";
        btn.style.zIndex = "999";
        btn.style.boxShadow = "0 2px 8px rgba(0,0,0,0.12)";
        document.body.appendChild(btn);
      }
    }

    let timer = null;
    const observer = new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(injectToolbarButton, 100);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(injectToolbarButton, 300);

    context.events.on("settings.changed", async () => {
      await loadSettings();
      document.querySelectorAll(".edgeever-enhancing-export-trigger-btn").forEach((b) => b.remove());
      injectToolbarButton();
    });

    return () => {
      observer.disconnect();
      document.querySelectorAll(".edgeever-enhancing-export-trigger-btn").forEach((b) => b.remove());
      document.querySelectorAll(".edgeever-export-modal-backdrop").forEach((b) => b.remove());
    };
  },
};
