import React, { useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { TextStyle } from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';

const TipTapEditor = ({ value, onChange, placeholder = "Start writing your document..." }) => {
  const fileInputRef = useRef(null);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, // Remove heading from StarterKit
        codeBlock: false, // Remove code block from StarterKit
        orderedList: false, // Remove ordered list from StarterKit
        paragraph: {
          HTMLAttributes: {
            class: 'text-justify',
          },
        },
      }),
      TextStyle,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'w-full h-[350px] rounded-lg object-cover',
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[400px] p-4',
      },
    },
  });

  if (!editor) {
    return null;
  }

  const addImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const src = event.target.result;
        editor.chain().focus().setImage({ src }).run();
      };
      reader.readAsDataURL(file);
    }
    // Reset the input
    e.target.value = '';
  };

  const setFontSize = (size) => {
    editor.chain().focus().setMark('textStyle', { fontSize: size }).run();
  };

  return (
    <div className="border rounded-md" onClick={e => e.stopPropagation()}>
      <div className="mb-4 flex flex-wrap gap-2 p-4 border-b bg-gray-50 sticky top-0 z-10">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-3 py-1 border rounded ${editor.isActive('bold') ? 'bg-blue-500 text-white' : ''}`}
        >
          Bold
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-3 py-1 border rounded ${editor.isActive('italic') ? 'bg-blue-500 text-white' : ''}`}
        >
          Italic
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`px-3 py-1 border rounded ${editor.isActive('underline') ? 'bg-blue-500 text-white' : ''}`}
        >
          Underline
        </button>
        
        {/* Font Size Selector */}
        <select
          onChange={(e) => setFontSize(e.target.value)}
          className="px-3 py-1 border rounded"
          defaultValue=""
        >
          <option value="" disabled>Font Size</option>
          <option value="12px">12px</option>
          <option value="14px">14px</option>
          <option value="16px">16px</option>
          <option value="18px">18px</option>
          <option value="20px">20px</option>
          <option value="24px">24px</option>
          <option value="28px">28px</option>
          <option value="32px">32px</option>
        </select>

        <button
          type="button"
          onClick={addImage}
          className="px-3 py-1 border rounded bg-green-500 text-white"
        >
          Add Image
        </button>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: 'none' }}
      />
      <EditorContent editor={editor} onClick={e => e.stopPropagation()} />
    </div>
  );
};

export default TipTapEditor;