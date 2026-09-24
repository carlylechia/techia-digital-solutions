"use client";

import { Bold, Code2, Image as ImageIcon, Italic, Link2, List, ListOrdered, Minus, Quote, Redo2, Strikethrough, Table2, Underline, Undo2, Upload } from "lucide-react";
import { useEffect, useRef } from "react";
import { normalizeRichTextSource } from "@/lib/blog/rich-text";

type Props = {
  initialHtml: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  label?: string;
};

const allowedTags = new Set(["P", "BR", "STRONG", "B", "EM", "I", "U", "S", "BLOCKQUOTE", "H2", "H3", "H4", "UL", "OL", "LI", "HR", "PRE", "CODE", "A", "IMG", "FIGURE", "FIGCAPTION", "TABLE", "THEAD", "TBODY", "TR", "TH", "TD", "DEL"]);
const dangerousTags = "script,style,iframe,object,embed,template,noscript";

function isSafeHref(value: string) {
  const clean = value.trim();
  if (clean.startsWith("/") && !clean.startsWith("//") && !clean.includes("\\")) return clean;
  try {
    const url = new URL(clean);
    return ["https:", "mailto:", "tel:"].includes(url.protocol.toLowerCase()) || (process.env.NODE_ENV !== "production" && url.protocol.toLowerCase() === "http:");
  } catch {
    return false;
  }
}

function isSafeImageSource(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" && ["res.cloudinary.com", "techiadigital.com", "www.techiadigital.com"].includes(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}

function escapeAttribute(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function cleanClientHtml(html: string) {
  const documentNode = new DOMParser().parseFromString(html, "text/html");
  documentNode.querySelectorAll(dangerousTags).forEach((node) => node.remove());

  // Walk a snapshot so descendants of an unwrapped unknown wrapper are still
  // inspected. This prevents pasted styles/event handlers from surviving.
  const elements = Array.from(documentNode.body.querySelectorAll("*"));
  for (const element of elements) {
    if (!element.isConnected) continue;
    const tagName = element.tagName.toUpperCase();
    if (tagName === "H1" || tagName === "H5" || tagName === "H6") {
      const replacement = documentNode.createElement(tagName === "H1" ? "h2" : "h4");
      while (element.firstChild) replacement.appendChild(element.firstChild);
      element.replaceWith(replacement);
      continue;
    }
    if (!allowedTags.has(tagName)) {
      element.replaceWith(...Array.from(element.childNodes));
      continue;
    }

    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      if (name === "href" && tagName === "A") {
        if (!isSafeHref(attribute.value)) element.removeAttribute(attribute.name);
      } else if (name === "src" && tagName === "IMG") {
        if (!isSafeImageSource(attribute.value)) element.removeAttribute(attribute.name);
      } else if (name === "alt" && tagName === "IMG" && !attribute.value.trim()) {
        element.removeAttribute(attribute.name);
      } else if (!["href", "src", "alt", "title", "target", "rel", "width", "height", "loading", "colspan", "rowspan", "scope", "class"].includes(name)) {
        element.removeAttribute(attribute.name);
      }
    }

    if (tagName === "IMG" && !element.getAttribute("alt")?.trim()) element.remove();
    if (tagName === "A") {
      if (element.getAttribute("target") === "_blank") element.setAttribute("rel", "noopener noreferrer");
      else element.removeAttribute("target");
    }
  }

  return documentNode.body.innerHTML;
}

function EditorToolbar({
  disabled,
  label,
  onCommand,
  onLink,
  onImage,
  onTable,
  onImport,
  onUndo,
  onRedo,
  onSelectionStart,
}: {
  disabled: boolean;
  label: string;
  onCommand: (name: string, value?: string) => void;
  onLink: () => void;
  onImage: () => void;
  onTable: () => void;
  onImport: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSelectionStart: () => void;
}) {
  const tools = [
    { label: "Bold", icon: Bold, action: () => onCommand("bold") },
    { label: "Italic", icon: Italic, action: () => onCommand("italic") },
    { label: "Underline", icon: Underline, action: () => onCommand("underline") },
    { label: "Strikethrough", icon: Strikethrough, action: () => onCommand("strikeThrough") },
    { label: "Inline code", icon: Code2, action: () => onCommand("inlineCode") },
    { label: "Bulleted list", icon: List, action: () => onCommand("insertUnorderedList") },
    { label: "Numbered list", icon: ListOrdered, action: () => onCommand("insertOrderedList") },
    { label: "Quote", icon: Quote, action: () => onCommand("formatBlock", "blockquote") },
    { label: "Code block", icon: Code2, action: () => onCommand("formatBlock", "pre") },
    { label: "Link", icon: Link2, action: onLink },
    { label: "Image", icon: ImageIcon, action: onImage },
    { label: "Import HTML / Markdown", icon: Upload, action: onImport },
    { label: "Table", icon: Table2, action: onTable },
    { label: "Divider", icon: Minus, action: () => onCommand("insertHorizontalRule") },
  ];

  return (
    <div className="sticky top-3 z-20 -mx-1 flex flex-wrap items-center gap-1 overflow-x-auto rounded-xl border border-border bg-surface-strong/95 p-2 shadow-lg shadow-black/10 backdrop-blur" role="toolbar" aria-label={`${label} formatting`}>
      <label className="sr-only" htmlFor={`${label.replace(/\s+/g, "-").toLowerCase()}-heading`}>Text style</label>
      <select
        id={`${label.replace(/\s+/g, "-").toLowerCase()}-heading`}
        className="h-9 min-w-[8.5rem] rounded-lg border border-border bg-background px-2 text-xs font-medium text-primary outline-none focus-visible:ring-2 focus-visible:ring-accent"
        defaultValue="p"
        disabled={disabled}
        aria-label="Text style"
        onMouseDown={onSelectionStart}
        onChange={(event) => onCommand("formatBlock", event.target.value)}
      >
        <option value="p">Paragraph</option>
        <option value="h2">Heading 1</option>
        <option value="h3">Heading 2</option>
        <option value="h4">Heading 3</option>
      </select>
      <span className="mx-1 h-5 w-px shrink-0 bg-border" />
      {tools.map(({ label: toolLabel, icon: Icon, action }) => (
        <button key={toolLabel} type="button" className="icon-button shrink-0" title={toolLabel} aria-label={toolLabel} disabled={disabled} onMouseDown={(event) => { onSelectionStart(); event.preventDefault(); }} onClick={action}>
          <Icon className="size-4" aria-hidden="true" />
        </button>
      ))}
      <span className="mx-1 h-5 w-px shrink-0 bg-border" />
      <button type="button" className="icon-button shrink-0" title="Clear formatting" aria-label="Clear formatting" disabled={disabled} onMouseDown={(event) => { onSelectionStart(); event.preventDefault(); }} onClick={() => onCommand("removeFormat")}><span className="text-xs font-bold">Tx</span></button>
      <button type="button" className="icon-button shrink-0" title="Undo" aria-label="Undo" disabled={disabled} onMouseDown={(event) => { onSelectionStart(); event.preventDefault(); }} onClick={onUndo}><Undo2 className="size-4" aria-hidden="true" /></button>
      <button type="button" className="icon-button shrink-0" title="Redo" aria-label="Redo" disabled={disabled} onMouseDown={(event) => { onSelectionStart(); event.preventDefault(); }} onClick={onRedo}><Redo2 className="size-4" aria-hidden="true" /></button>
    </div>
  );
}

export function RichTextEditor({ initialHtml, onChange, disabled = false, label = "Article content" }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialized = useRef(false);
  const savedRange = useRef<Range | null>(null);
  const helpId = `${label.replace(/\s+/g, "-").toLowerCase()}-help`;

  function captureSelection() {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection?.rangeCount || !editor.contains(selection.anchorNode)) return;
    savedRange.current = selection.getRangeAt(0).cloneRange();
  }

  function restoreSelection() {
    const editor = editorRef.current;
    const range = savedRange.current;
    if (!editor || !range || !editor.contains(range.startContainer)) return;
    const selection = window.getSelection();
    if (!selection) return;
    selection.removeAllRanges();
    selection.addRange(range);
  }

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const normalized = cleanClientHtml(normalizeRichTextSource(initialHtml));
    if (!initialized.current) {
      editor.innerHTML = normalized;
      initialized.current = true;
      return;
    }
    // Parent state changes while the editor is focused are echoes of typing;
    // avoid resetting the caret. External reloads can safely replace the body.
    if (document.activeElement !== editor && editor.innerHTML !== normalized) editor.innerHTML = normalized;
  }, [initialHtml]);

  function emit() {
    const editor = editorRef.current;
    if (!editor) return;
    onChange(cleanClientHtml(editor.innerHTML));
  }

  function rewriteAndEmit() {
    const editor = editorRef.current;
    if (!editor) return;
    const clean = cleanClientHtml(editor.innerHTML);
    if (editor.innerHTML !== clean) editor.innerHTML = clean;
    onChange(clean);
  }

  function insertHtml(html: string) {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    restoreSelection();
    const inserted = document.execCommand("insertHTML", false, html);
    if (!inserted) {
      const selection = window.getSelection();
      if (selection?.rangeCount) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(range.createContextualFragment(html));
      }
    }
    emit();
  }

  function wrapSelection(tagName: "code" | "del") {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection?.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) return;
    const wrapper = document.createElement(tagName);
    wrapper.append(range.cloneContents());
    range.deleteContents();
    range.insertNode(wrapper);
    selection.removeAllRanges();
    const nextRange = document.createRange();
    nextRange.setStart(wrapper, 0);
    nextRange.collapse(true);
    selection.addRange(nextRange);
  }

  function command(commandName: string, value?: string) {
    if (disabled) return;
    editorRef.current?.focus();
    restoreSelection();
    if (commandName === "inlineCode" || commandName === "strikeThrough") {
      wrapSelection(commandName === "inlineCode" ? "code" : "del");
    } else {
      const commandValue = commandName === "formatBlock" && value && /^[a-z0-9]+$/i.test(value) ? `<${value}>` : value;
      document.execCommand(commandName, false, commandValue);
    }
    emit();
  }

  function addLink() {
    const value = window.prompt("Paste a teChia or HTTPS link");
    const href = value ? value.trim() : null;
    if (href && isSafeHref(href)) command("createLink", href);
  }

  function addImage() {
    const value = window.prompt("Paste a Cloudinary or teChia HTTPS image URL");
    const src = value?.trim();
    if (!src || !isSafeImageSource(src)) return;
    const alt = window.prompt("Describe this image for readers")?.trim();
    if (!alt) return;
    const html = `<figure><img src="${escapeAttribute(src)}" alt="${escapeAttribute(alt)}" loading="lazy"><figcaption>${escapeAttribute(alt)}</figcaption></figure>`;
    insertHtml(cleanClientHtml(html));
  }

  function addTable() {
    const rows = Math.min(8, Math.max(2, Number.parseInt(window.prompt("How many table rows?", "3") || "3", 10)));
    const columns = Math.min(6, Math.max(1, Number.parseInt(window.prompt("How many table columns?", "3") || "3", 10)));
    if (!Number.isFinite(rows) || !Number.isFinite(columns)) return;
    const header = `<tr>${Array.from({ length: columns }, (_, index) => `<th scope="col">Column ${index + 1}</th>`).join("")}</tr>`;
    const body = Array.from({ length: rows - 1 }, () => `<tr>${Array.from({ length: columns }, () => "<td>Content</td>").join("")}</tr>`).join("");
    insertHtml(`<table><thead>${header}</thead><tbody>${body}</tbody></table><p></p>`);
  }

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    const editor = editorRef.current;
    if (!file || !editor || file.size > 2_000_000) return;
    if (editor.innerHTML.trim() && !window.confirm("Replace the current article content with this imported HTML or Markdown file?")) return;
    const raw = await file.text();
    const normalized = cleanClientHtml(normalizeRichTextSource(raw));
    if (!normalized) return;
    editor.innerHTML = normalized;
    emit();
    editor.focus();
  }

  function handlePaste(event: React.ClipboardEvent<HTMLDivElement>) {
    event.preventDefault();
    const html = event.clipboardData.getData("text/html");
    const text = event.clipboardData.getData("text/plain");
    const normalized = cleanClientHtml(normalizeRichTextSource(html || text));
    if (normalized) {
      insertHtml(normalized);
      return;
    }
    if (text) insertHtml(escapeAttribute(text).replace(/\n/g, "<br>"));
  }

  return (
    <div className="rounded-2xl border border-border bg-background">
      <div className="border-b border-border p-2">
        <EditorToolbar
          disabled={disabled}
          label={label}
          onCommand={command}
          onLink={addLink}
          onImage={addImage}
          onTable={addTable}
          onImport={() => fileInputRef.current?.click()}
          onUndo={() => command("undo")}
          onRedo={() => command("redo")}
          onSelectionStart={captureSelection}
        />
      </div>
      <input ref={fileInputRef} type="file" accept=".html,.htm,.md,.markdown,text/html,text/markdown" className="hidden" onChange={handleImport} aria-label="Import HTML or Markdown file" />
      <div
        ref={editorRef}
        className="blog-editor min-h-[28rem] px-4 py-5 text-base leading-8 text-primary outline-none sm:px-6"
        contentEditable={!disabled}
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-readonly={disabled}
        aria-label={label}
        aria-describedby={helpId}
        spellCheck
        onFocus={captureSelection}
        onKeyUp={captureSelection}
        onMouseUp={captureSelection}
        onInput={emit}
        onBlur={() => { captureSelection(); rewriteAndEmit(); }}
        onPaste={handlePaste}
      />
      <p id={helpId} className="border-t border-border px-4 py-2 text-[11px] text-muted">Paste or import HTML/Markdown; it is normalized to accessible article markup. Unsupported styles are removed, and the server sanitizes again on save.</p>
    </div>
  );
}
