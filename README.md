# EdgeEver 增强导出插件 (Enhancing Export)

<p align="center">
  <b>参考 obsidian-enhancing-export 打造的 EdgeEver 专业级多格式增强导出插件</b><br>
  支持将笔记导出为独立离线 HTML、Word (.docx)、标准与博客 Markdown、高保真可调 PDF 与 Pandoc 命令行扩展。
</p>

---

## 🌟 核心特性

- 🌐 **独立单文件 HTML 导出**：
  - 将所有本地图片自动内联为 Base64 Data URI，离线单文件随处打开不丢图；
  - 内置 5 种精美排版主题（GitHub 经典、暗夜极客、学术论文、优雅杂志、极简纯白）；
  - 支持正文字号（13px - 18px）、代码语法高亮与 KaTeX 数学公式渲染。
- 📄 **Word 文档 (.docx) 导出**：
  - 完美兼容 Microsoft Word、WPS Office、LibreOffice 与 Mac Pages；
  - 完整保留标题层级、表格样式、引用块与内嵌图片。
- 🚀 **博客 Markdown (Hugo / Hexo)**：
  - 自动补全并规范化 YAML Frontmatter（title、date、lastmod、tags、categories、draft）；
  - 无缝衔接静态博客自动化发布流水线。
- 🖨️ **高保真可调 PDF / 打印视图**：
  - 针对 A4 纸张排版优化，支持直接打印或一键「另存为 PDF」；
  - 样式与所选主题、字号严格对齐，支持自动分页保护。
- 📝 **纯净标准 Markdown (.md)**：
  - 导出规范的 CommonMark 格式文件，方便在任何外部工具中流通使用。
- ⚙️ **Pandoc 学术与扩展格式支持**：
  - 支持配置 Pandoc 可执行文件路径；
  - 支持变量替换（`${currentPath}`, `${outputPath}` 等），一键生成终端执行命令。

---

## 📦 安装与使用

1. 打开 **EdgeEver**，进入 **设置 (Settings)** -> **插件 (Plugins)**。
2. 在插件管理中输入本仓库 GitHub 地址或直接安装：
   ```text
   https://github.com/zyhcs/edgeever-enhancing-export.git
   ```
3. 在任意笔记页面中：
   - 点击右上角的 **「📤 增强导出」** 按钮；
   - 或使用命令面板搜索 `增强导出 (Enhancing Export)...`。
4. 在弹出的导出向导中选择目标格式、排版风格及字号，点击 **「📥 立即导出并保存」** 即可！

---

## ⚙️ 设置选项

- **默认导出格式**：HTML / Word / Markdown / Hugo / PDF
- **默认排版主题**：GitHub Light / Modern Dark / Academic / Editorial / Clean White
- **正文字体大小**：13px / 14px / 15px / 16px / 18px
- **本地图片处理**：自动内联 Base64（默认开启）
- **包含元数据**：自动生成 YAML Frontmatter
- **Pandoc 路径**：支持自定义指定系统 `pandoc` 命令路径

---

## 📄 开源许可

[MIT License](LICENSE)
