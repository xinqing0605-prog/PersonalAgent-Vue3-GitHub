import type { Note } from '../types'

export function stripVisibleSourceMarkers(value: unknown) { return String(value).replace(/\s*[【\[{(]\s*来源\s*[：:]\s*(?:知识库|任务工具|笔记工具|本地文件工具)\s*[】\]})]/g, ''); }

export function formatAnswerText(value: unknown) {
          return escapeHtml(value)
            .replace(/^#{1,3}\s+(.+)$/gm, '<h3>$1</h3>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/^- (.+)$/gm, '• $1')
            .replace(/\n/g, '<br>');
        }

export function normalizeCodeLanguage(value: unknown) {
          const language = String(value || '').trim().toLowerCase().split(/\s+/)[0];
          return (({ javascript: 'js', jsx: 'js', typescript: 'ts', tsx: 'ts', shell: 'bash', sh: 'bash', zsh: 'bash', py: 'python', html: 'html', xml: 'html', vue: 'vue', scss: 'css', less: 'css', yml: 'yaml' } as Record<string, string>)[language] || language || 'text').replace(/[^a-z0-9_+-]/g, '');
        }

export function highlightCode(source: string, language: string) {
          const normalized = normalizeCodeLanguage(language);
          const keywordGroups: Record<string, string[]> = {
            js: ['as', 'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'default', 'delete', 'do', 'else', 'export', 'extends', 'finally', 'for', 'from', 'function', 'if', 'import', 'in', 'instanceof', 'let', 'new', 'of', 'return', 'static', 'switch', 'throw', 'try', 'typeof', 'var', 'while', 'yield'],
            ts: ['as', 'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'declare', 'default', 'delete', 'do', 'else', 'enum', 'export', 'extends', 'finally', 'for', 'from', 'function', 'if', 'implements', 'import', 'in', 'interface', 'keyof', 'let', 'namespace', 'new', 'of', 'private', 'protected', 'public', 'readonly', 'return', 'static', 'switch', 'throw', 'try', 'type', 'typeof', 'var', 'while', 'yield'],
            python: ['and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield'],
            bash: ['case', 'do', 'done', 'elif', 'else', 'esac', 'export', 'fi', 'for', 'function', 'if', 'in', 'select', 'then', 'until', 'while'],
            css: ['align-items', 'background', 'border', 'color', 'display', 'font', 'grid', 'height', 'justify-content', 'margin', 'padding', 'position', 'width'],
          };
          const keywords = new Set(keywordGroups[normalized] || keywordGroups[normalized === 'vue' ? 'js' : ''] || []);
          const literals = new Set(['true', 'false', 'null', 'undefined', 'none', 'True', 'False', 'None']);
          const commands = new Set(['npm', 'npx', 'pnpm', 'yarn', 'node', 'python', 'pip', 'git', 'docker', 'cargo', 'go', 'java', 'mvn', 'gradle', 'sudo']);
          const tokenPattern = normalized === 'html' || normalized === 'vue'
            ? /<!--[\s\S]*?-->|<\/?[A-Za-z][^>]*>|\b(?:true|false|null|undefined)\b|\b\d+(?:\.\d+)?\b/g
            : /\/\*[\s\S]*?\*\/|\/\/[^\n]*|#[^\n]*|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`|\b[A-Za-z_$][\w$-]*\b|\b\d+(?:\.\d+)?\b/g;
          let cursor = 0;
          let html = '';
          String(source || '').replace(tokenPattern, (token, offset) => {
            html += escapeHtml(String(source).slice(cursor, offset));
            let kind = '';
            if (token.startsWith('/*') || token.startsWith('//') || token.startsWith('#') || token.startsWith('<!--')) kind = 'comment';
            else if (token.startsWith('<')) kind = 'tag';
            else if (/^['"`]/.test(token)) kind = 'string';
            else if (keywords.has(token)) kind = 'keyword';
            else if (literals.has(token)) kind = 'literal';
            else if (normalized === 'bash' && commands.has(token)) kind = 'command';
            else if (/^\d/.test(token) || /^#[0-9a-f]{3,8}$/i.test(token)) kind = 'number';
            html += kind ? `<span class="code-token-${kind}">${escapeHtml(token)}</span>` : escapeHtml(token);
            cursor = offset + token.length;
            return token;
          });
          return html + escapeHtml(String(source || '').slice(cursor));
        }

export function formatAnswer(value: unknown) {
          const lines = String(value || '').replace(/\r\n?/g, '\n').split('\n');
          const fenceLine = /^\s*```+\s*([^`]*)\s*$/;
          const prose: string[] = [];
          const code: string[] = [];
          let language = '';
          let html = '';
          let inCode = false;
          const flushProse = () => {
            if (!prose.length) return;
            html += formatAnswerText(prose.join('\n'));
            prose.length = 0;
          };
          const flushCode = () => {
            const label = String(language || '').trim().slice(0, 30) || '代码';
            const normalizedLanguage = normalizeCodeLanguage(language);
            const source = code.join('\n').replace(/\n$/, '');
            const copyIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2"></rect><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"></path></svg>';
            const expandIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"></path></svg>';
            html += `<details class="code-block" open><summary class="code-block-toolbar"><span class="code-block-title"><span class="code-block-language">${escapeHtml(label)}</span><span class="code-block-chevron" aria-hidden="true"></span></span><span class="code-block-actions"><button class="code-action-button code-copy-button" data-copy-code type="button" aria-label="复制这段代码" title="复制代码">${copyIcon}</button><button class="code-action-button code-expand-button" data-expand-code type="button" aria-label="全屏查看代码" title="全屏查看">${expandIcon}</button></span></summary><div class="code-block-body"><pre><code class="language-${escapeAttribute(normalizedLanguage)}">${highlightCode(source, normalizedLanguage)}</code></pre></div></details>`;
            code.length = 0;
            language = '';
          };
          lines.forEach((line) => {
            const fence = line.match(fenceLine);
            if (fence) {
              if (inCode) flushCode();
              else { flushProse(); language = fence[1] || ''; }
              inCode = !inCode;
              return;
            }
            (inCode ? code : prose).push(line);
          });
          if (inCode) flushCode();
          else flushProse();
          return html;
        }

export function escapeHtml(value: unknown) { return String(value).replace(/[&<>'"]/g, (char) => (({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' } as Record<string, string>)[char]!)); }

export function escapeAttribute(value: unknown) { return escapeHtml(value); }

export function noteBody(note: Note | null) {
          const content = String(note?.content || note?.excerpt || '');
          const lines = content.split('\n');
          if (lines[0]?.startsWith('# ')) lines.shift();
          return lines.join('\n').replace(/^\s+/, '');
        }

export function renderNoteMarkup(content: string, imageMarkup = (src: string, name: string) =>
  `<img src="${escapeAttribute(src)}" alt="${escapeAttribute(name)}" tabindex="0" role="button" aria-label="放大查看图片" />`) {
  const pattern = /!\[([^\]]*)\]\((data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+|\/api\/images\/[a-f0-9]{64}\.(?:png|jpg|webp)|https?:\/\/[^)\s]+)\)/gi
  let cursor = 0
  let html = ''
  for (const match of content.matchAll(pattern)) {
    html += escapeHtml(content.slice(cursor, match.index)).replace(/\n/g, '<br>')
    html += imageMarkup(match[2]!, match[1] || '图片')
    cursor = match.index! + match[0].length
  }
  return html + escapeHtml(content.slice(cursor)).replace(/\n/g, '<br>')
}

export function renderNoteContent(note: Note | null) {
  return renderNoteMarkup(noteBody(note))
}
