"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import { useEffect, useRef, useReducer } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  ImagePlus,
  Undo2,
  Redo2,
} from "lucide-react";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
}

export function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastContentRef = useRef(content);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [, rerender] = useReducer((c: number) => c + 1, 0);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      Image,
    ],
    content: content || "",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      lastContentRef.current = html;
      onChangeRef.current(html);
      rerender();
    },
    onSelectionUpdate: rerender,
  });

  // Sync only external content changes (e.g. edit page loading article from API)
  useEffect(() => {
    if (editor && content !== lastContentRef.current) {
      lastContentRef.current = content;
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  if (!editor) return null;

  const addImage = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "articles");
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      if (!res.ok) return;
      const { data } = await res.json();
      editor.chain().focus().setImage({ src: `/api/images/${encodeURIComponent(data.key)}` }).run();
    } catch {
      // upload failed silently
    }
  };

  const addLink = () => {
    const url = window.prompt("Enter URL:");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const btn = (active: boolean) =>
    `p-1.5 rounded transition-colors cursor-pointer ${
      active
        ? "bg-brand-100 text-brand-600"
        : "text-neutral-600 hover:bg-neutral-200"
    }`;

  return (
    <div className="border border-neutral-200 rounded-md overflow-hidden focus-within:border-brand-600">
      <div className="flex flex-wrap gap-1 p-2 border-b border-neutral-200 bg-neutral-50">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btn(editor.isActive("bold"))} title="Bold">
          <Bold size={16} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btn(editor.isActive("italic"))} title="Italic">
          <Italic size={16} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={btn(editor.isActive("underline"))} title="Underline">
          <UnderlineIcon size={16} />
        </button>
        <div className="w-px bg-neutral-200 mx-1" />
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={btn(editor.isActive("heading", { level: 1 }))} title="Heading 1">
          <Heading1 size={16} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btn(editor.isActive("heading", { level: 2 }))} title="Heading 2">
          <Heading2 size={16} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btn(editor.isActive("heading", { level: 3 }))} title="Heading 3">
          <Heading3 size={16} />
        </button>
        <div className="w-px bg-neutral-200 mx-1" />
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btn(editor.isActive("bulletList"))} title="Bullet List">
          <List size={16} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btn(editor.isActive("orderedList"))} title="Ordered List">
          <ListOrdered size={16} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btn(editor.isActive("blockquote"))} title="Blockquote">
          <Quote size={16} />
        </button>
        <div className="w-px bg-neutral-200 mx-1" />
        <button type="button" onClick={addLink} className={btn(editor.isActive("link"))} title="Add Link">
          <LinkIcon size={16} />
        </button>
        <button type="button" onClick={() => fileInputRef.current?.click()} className={btn(false)} title="Insert Image">
          <ImagePlus size={16} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) addImage(file);
            e.target.value = "";
          }}
        />
        <div className="w-px bg-neutral-200 mx-1" />
        <button type="button" onClick={() => editor.chain().focus().undo().run()} className={btn(false)} title="Undo">
          <Undo2 size={16} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()} className={btn(false)} title="Redo">
          <Redo2 size={16} />
        </button>
      </div>
      <EditorContent editor={editor} className="px-3 py-2 text-sm min-h-[200px]" />
    </div>
  );
}
