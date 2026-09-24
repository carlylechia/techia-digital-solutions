"use client";

import { Bold, Code2, Heading2, Image as ImageIcon, Italic, Link2, List, ListOrdered, Minus, Quote, Redo2, Table2, Undo2 } from "lucide-react";
import { useEffect, useRef } from "react";

type Props = {
  initialHtml: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  label?: string;
};

const allowedTags = new Set(["P", "BR", "STRONG", "B", "EM", "I", "S", "BLOCKQUOTE", "H2", "H3", "H4", "UL", "OL", "LI", "HR", "PRE", "CODE", "A", "IMG", "FIGURE", "FIGCAPTION", "TABLE", "THEAD", "TBODY", "TR", "TH", "TD", "DEL"]);

function cleanClientHtml(html: string) {
  const documentNode = new DOMParser().parseFromString(html, "text/html");
  documentNode.querySelectorAll("script,style,iframe,object,embed,template,noscript").forEach((node) => node.remove());
  const walk = (node: Element) => {
    for (const child of Array.from(node.children)) {
      if (!allowedTags.has(child.tagName)) {
        child.replaceWith(...Array.from(child.childNodes));
        continue;
      }
      for (const attribute of Array.from(child.attributes)) {
        const name = attribute.name.toLowerCase();
        if (name === "href" && child.tagName === "A") {
          const value = attribute.value.trim();
          if (!value.startsWith("/") && !/^https?:\/\//i.test(value) && !/^mailto:/i.test(value) && !/^tel:/i.test(value)) child.removeAttribute(attribute.name);
        } else if (name === "src" && child.tagName === "IMG") {
          if (!/^https:\/\/(res\.cloudinary\.com|techiadigital\.com|www\.techiadigital\.com)\//i.test(attribute.value)) child.removeAttribute(attribute.name);
        } else if (name === "alt" && child.tagName === "IMG" && !attribute.value.trim()) child.removeAttribute(attribute.name);
        else if (!["href", "src", "alt", "title", "target", "rel", "width", "height", "loading", "colspan", "rowspan", "scope", "class"].includes(name)) {
          child.removeAttribute(attribute.name);
        }
      }
      if (child.tagName === "IMG" && !child.getAttribute("alt")?.trim()) child.remove();
      if (child.tagName === "A") child.setAttribute("rel", "noopener noreferrer");
      walk(child);
    }
  };
  walk(documentNode.body);
  return documentNode.body.innerHTML;
}

function safeUrl(value: string) {
  const clean = value.trim();
  return clean.startsWith("/") || /^https?:\/\//i.test(clean) || /^mailto:/i.test(clean) || /^tel:/i.test(clean) ? clean : null;
}

function EditorToolbar({
  disabled,
  label,
  onCommand,
  onLink,
  onImage,
  onTable,
  onUndo,
  onRedo,
}: {
  disabled: boolean;
  label: string;
  onCommand: (name: string, value?: string) => void;
  onLink: () => void;
  onImage: () => void;
  onTable: () => void;
  onUndo: () => void;
  onRedo: () => void;
}) {
  const tools = [
    { label: "Bold", icon: Bold, action: () => onCommand("bold") },
    { label: "Italic", icon: Italic, action: () => onCommand("italic") },
    { label: "Heading", icon: Heading2, action: () => onCommand("formatBlock", "h2") },
    { label: "Bulleted list", icon: List, action: () => onCommand("insertUnorderedList") },
    { label: "Numbered list", icon: ListOrdered, action: () => onCommand("insertOrderedList") },
    { label: "Quote", icon: Quote, action: () => onCommand("formatBlock", "blockquote") },
    { label: "Code block", icon: Code2, action: () => onCommand("formatBlock", "pre") },
    { label: "Link", icon: Link2, action: onLink },
    { label: "Image", icon: ImageIcon, action: onImage },
    { label: "Table", icon: Table2, action: onTable },
    { label: "Divider", icon: Minus, action: () => onCommand("insertHorizontalRule") },
  ];
  return <div className="flex flex-wrap items-center gap-1 border-b border-border bg-surface-strong/70 p-2" role="toolbar" aria-label={`${label} formatting`}>
    {tools.map(({ label: toolLabel, icon: Icon, action }) => <button key={toolLabel} type="button" className="icon-button" title={toolLabel} aria-label={toolLabel} disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={action}><Icon className="size-4" /></button>)}
    <span className="mx-1 h-5 w-px bg-border" />
    <button type="button" className="icon-button" title="Undo" aria-label="Undo" disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={onUndo}><Undo2 className="size-4" /></button>
    <button type="button" className="icon-button" title="Redo" aria-label="Redo" disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={onRedo}><Redo2 className="size-4" /></button>
  </div>;
}

export function RichTextEditor({ initialHtml, onChange, disabled = false, label = "Article content" }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!editorRef.current || initialized.current) return;
    editorRef.current.innerHTML = initialHtml;
    initialized.current = true;
  }, [initialHtml]);

  function emit() {
    if (!editorRef.current) return;
    onChange(cleanClientHtml(editorRef.current.innerHTML));
  }

  function command(commandName: string, value?: string) {
    if (disabled) return;
    editorRef.current?.focus();
    document.execCommand(commandName, false, value);
    emit();
  }

  function addLink() {
    const value = window.prompt("Paste a teChia or HTTPS link");
    const href = value ? safeUrl(value) : null;
    if (href) command("createLink", href);
  }

  function addImage() {
    const value = window.prompt("Paste a Cloudinary HTTPS image URL");
    const src = value?.trim();
    if (!src || !/^https:\/\/(res\.cloudinary\.com|techiadigital\.com|www\.techiadigital\.com)\//i.test(src)) return;
    const alt = window.prompt("Describe this image for readers")?.trim();
    if (!alt) return;
    editorRef.current?.focus();
    document.execCommand("insertHTML", false, `<figure><img src="${src}" alt="${alt.replace(/"/g, "&quot;")}" loading="lazy"><figcaption>${alt.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</figcaption></figure>`);
    emit();
  }

  function addTable() {
    const rows = Math.min(8, Math.max(2, Number.parseInt(window.prompt("How many table rows?", "3") || "3", 10)));
    const columns = Math.min(6, Math.max(1, Number.parseInt(window.prompt("How many table columns?", "3") || "3", 10)));
    if (!Number.isFinite(rows) || !Number.isFinite(columns)) return;
    const header = `<tr>${Array.from({ length: columns }, (_, index) => `<th scope="col">Column ${index + 1}</th>`).join("")}</tr>`;
    const body = Array.from({ length: rows - 1 }, () => `<tr>${Array.from({ length: columns }, () => "<td>Content</td>").join("")}</tr>`).join("");
    editorRef.current?.focus();
    document.execCommand("insertHTML", false, `<table><thead>${header}</thead><tbody>${body}</tbody></table><p></p>`);
    emit();
  }

  function handlePaste(event: React.ClipboardEvent<HTMLDivElement>) {
    const html = event.clipboardData.getData("text/html");
    if (!html) return;
    event.preventDefault();
    const clean = cleanClientHtml(html);
    document.execCommand("insertHTML", false, clean);
    emit();
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-background">
      <EditorToolbar disabled={disabled} label={label} onCommand={command} onLink={addLink} onImage={addImage} onTable={addTable} onUndo={() => command("undo")} onRedo={() => command("redo")} />
      <div ref={editorRef} className="blog-editor min-h-[28rem] px-4 py-5 text-base leading-8 text-primary outline-none sm:px-6" contentEditable={!disabled} suppressContentEditableWarning role="textbox" aria-multiline="true" aria-label={label} onInput={emit} onBlur={emit} onPaste={handlePaste} />
      <p className="border-t border-border px-4 py-2 text-[11px] text-muted">Use the toolbar for structure. HTML is sanitized again on the server before it is stored.</p>
    </div>
  );
}
