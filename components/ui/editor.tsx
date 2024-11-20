import { useEffect, useRef } from 'react';
import { Editor as TinyMCEEditor } from '@tinymce/tinymce-react';
import { Button } from './button';

interface EditorProps {
  initialContent: string;
  onSave: (content: string) => void;
}

export function Editor({ initialContent, onSave }: EditorProps) {
  const editorRef = useRef<any>(null);

  const handleSave = () => {
    if (editorRef.current) {
      const content = editorRef.current.getContent();
      onSave(content);
    }
  };

  return (
    <div className="space-y-4">
      <TinyMCEEditor
        onInit={(evt, editor) => editorRef.current = editor}
        initialValue={initialContent}
        init={{
          height: 500,
          menubar: true,
          plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
          ],
          toolbar: 'undo redo | blocks | ' +
            'bold italic forecolor | alignleft aligncenter ' +
            'alignright alignjustify | bullist numlist outdent indent | ' +
            'removeformat | help',
          content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
        }}
      />
      <div className="flex justify-end">
        <Button onClick={handleSave}>Save Changes</Button>
      </div>
    </div>
  );
}
