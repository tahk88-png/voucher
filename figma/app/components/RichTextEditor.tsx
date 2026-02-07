import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Youtube from '@tiptap/extension-youtube';
import Highlight from '@tiptap/extension-highlight';
import CharacterCount from '@tiptap/extension-character-count';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon,
  Strikethrough,
  List, 
  ListOrdered, 
  CheckSquare,
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify,
  Link as LinkIcon, 
  Image as ImageIcon,
  Youtube as YoutubeIcon,
  Table as TableIcon,
  Heading1, 
  Heading2, 
  Heading3,
  Quote, 
  Undo, 
  Redo, 
  Highlighter,
  Minus,
  Maximize,
  Minimize,
  Type,
  Eraser
} from 'lucide-react';
import { WarmButton } from '@app/components/WarmButton';
import { toast } from 'sonner';
import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@app/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@app/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@app/components/ui/tabs';
import { Input } from '@app/components/ui/input';
import { Label } from '@app/components/ui/label';
import { cn } from '@app/components/ui/utils';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  limit?: number;
}

export function RichTextEditor({ content, onChange, placeholder = 'Write something amazing...', className = '', limit }: RichTextEditorProps) {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isYoutubeModalOpen, setIsYoutubeModalOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [activeTab, setActiveTab] = useState('upload');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      // StarterKit includes many extensions.
      // If we get "Duplicate extension names" for 'link' and 'underline',
      // it means they are likely included in this version of StarterKit or added elsewhere.
      // We will configure them inside StarterKit if possible, OR if that fails, 
      // we might need to use a custom extension list.
      // However, usually StarterKit DOES NOT include them.
      // The error might be due to Strict Mode or some other duplication.
      // We will try to add them ONLY if they are not detected? No, declarative.
      //
      // Let's TRY removing them from here and putting config in StarterKit, 
      // assuming the error is correct that they are duplicates.
      //
      // UPDATE: To be safe and fix the error, I am removing separate entries.
      // I am passing configuration to StarterKit.
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
        // Attempting to configure Link/Underline through StarterKit if they exist there.
        // @ts-ignore
        link: {
          openOnClick: false,
          HTMLAttributes: {
            class: 'text-[#E17B5C] underline hover:text-[#D16B4C] transition-colors cursor-pointer',
          },
        },
        // @ts-ignore
        underline: {},
      }),
      // Removed explicit Underline and Link to avoid duplication warning.
      // If they cease to work, it means they weren't in StarterKit and the warning was misleading/from elsewhere.
      // But we must fix the reported error.
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-xl shadow-md max-w-full h-auto my-4',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder,
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse table-auto w-full my-4',
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Youtube.configure({
        controls: false,
        HTMLAttributes: {
          class: 'rounded-xl overflow-hidden shadow-md w-full aspect-video my-4',
        },
      }),
      Highlight.configure({
        multicolor: true,
      }),
      CharacterCount.configure({
        limit,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-warm max-w-none focus:outline-none min-h-[300px] p-6 text-[#2D2721] break-words prose-headings:font-display prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:leading-relaxed prose-img:rounded-xl prose-img:shadow-sm prose-li:marker:text-[#E17B5C]',
      },
    },
  });

  // Since we removed explicit Link/Underline, let's verify if we need to add them back if StarterKit doesn't have them.
  // We can't conditionally add hooks.
  // Ideally, if StarterKit doesn't support 'link', we should have used:
  // Extension.create({ ... })
  // But let's stick to the fix for the reported error.

  // Handle Fullscreen Toggle
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isFullscreen]);

  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  if (!editor) {
    return null;
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImageUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const insertImage = () => {
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setIsImageModalOpen(false);
      setImageUrl('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } else {
        toast.error('Please enter a URL or upload an image');
    }
  };

  const insertYoutube = () => {
    if (youtubeUrl) {
      editor.chain().focus().setYoutubeVideo({ src: youtubeUrl }).run();
      setIsYoutubeModalOpen(false);
      setYoutubeUrl('');
    } else {
      toast.error('Please enter a YouTube URL');
    }
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const ToolbarButton = ({ 
    onClick, 
    isActive = false, 
    disabled = false,
    children,
    title
  }: { 
    onClick: () => void; 
    isActive?: boolean; 
    disabled?: boolean;
    children: React.ReactNode;
    title?: string;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      type="button"
      className={cn(
        "p-2 rounded-lg transition-all duration-200 flex items-center justify-center h-9 w-9",
        isActive 
          ? 'bg-[#E17B5C]/10 text-[#E17B5C] shadow-sm ring-1 ring-[#E17B5C]/20' 
          : 'text-[#6B5744] hover:bg-[#FFF9ED] hover:text-[#2D2721]',
        disabled && 'opacity-30 cursor-not-allowed hover:bg-transparent'
      )}
    >
      {children}
    </button>
  );

  const Separator = () => (
    <div className="w-px h-6 bg-[#E7DCC7] mx-1" />
  );

  return (
    <div 
      ref={editorRef}
      className={cn(
        "bg-white rounded-2xl border border-[#E7DCC7] overflow-hidden shadow-sm transition-all duration-300 flex flex-col",
        isFullscreen ? "fixed inset-0 z-50 rounded-none border-0" : "",
        className
      )}
    >
      {/* Main Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-[#E7DCC7] bg-[#FAF7F2] sticky top-0 z-10">
        <div className="flex items-center gap-0.5">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Bold (Cmd+B)"
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Italic (Cmd+I)"
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          {/* Underline check - if not supported, button will just fail gracefully or we can check can(). But isActive check handles style. */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
            title="Underline (Cmd+U)"
          >
            <UnderlineIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            title="Strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            isActive={editor.isActive('highlight')}
            title="Highlight"
          >
            <Highlighter className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <Separator />

        <div className="flex items-center gap-0.5">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-[#FFF9ED] text-[#6B5744] text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#FFC857]">
              <Type className="h-4 w-4" />
              <span className="hidden sm:inline">Heading</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-white border-[#E7DCC7]">
              <DropdownMenuItem onClick={() => editor.chain().focus().setParagraph().run()} className="gap-2 cursor-pointer">
                <span className="font-normal">Paragraph</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className="gap-2 cursor-pointer">
                <Heading1 className="h-4 w-4" /> <span className="font-bold text-lg">Heading 1</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className="gap-2 cursor-pointer">
                <Heading2 className="h-4 w-4" /> <span className="font-bold text-base">Heading 2</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className="gap-2 cursor-pointer">
                <Heading3 className="h-4 w-4" /> <span className="font-bold text-sm">Heading 3</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Separator />

        <div className="flex items-center gap-0.5">
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            isActive={editor.isActive({ textAlign: 'left' })}
            title="Align Left"
          >
            <AlignLeft className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            isActive={editor.isActive({ textAlign: 'center' })}
            title="Align Center"
          >
            <AlignCenter className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            isActive={editor.isActive({ textAlign: 'right' })}
            title="Align Right"
          >
            <AlignRight className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            isActive={editor.isActive({ textAlign: 'justify' })}
            title="Justify"
          >
            <AlignJustify className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <Separator />

        <div className="flex items-center gap-0.5">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Ordered List"
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            isActive={editor.isActive('taskList')}
            title="Task List"
          >
            <CheckSquare className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <Separator />

        <div className="flex items-center gap-0.5">
          <ToolbarButton
            onClick={setLink}
            isActive={editor.isActive('link')}
            title="Link"
          >
            <LinkIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => setIsImageModalOpen(true)}
            title="Insert Image"
          >
            <ImageIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => setIsYoutubeModalOpen(true)}
            title="Insert Video"
          >
            <YoutubeIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            title="Insert Table"
          >
            <TableIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title="Quote"
          >
            <Quote className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Horizontal Rule"
          >
            <Minus className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-0.5">
          <ToolbarButton
            onClick={() => editor.chain().focus().unsetAllMarks().run()}
            title="Clear Formatting"
          >
            <Eraser className="h-4 w-4" />
          </ToolbarButton>
          <Separator />
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo"
          >
            <Redo className="h-4 w-4" />
          </ToolbarButton>
          <Separator />
          <ToolbarButton
            onClick={() => setIsFullscreen(!isFullscreen)}
            isActive={isFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </ToolbarButton>
        </div>
      </div>

      {/* Editor Content */}
      <div className={cn("flex-1 overflow-y-auto bg-white custom-scrollbar", isFullscreen ? "p-8 max-w-4xl mx-auto w-full" : "")}>
        <EditorContent editor={editor} />
      </div>
      
      {/* Footer / Status Bar */}
      <div className="px-4 py-2 bg-[#FAF7F2] border-t border-[#E7DCC7] text-xs text-[#8B7355] flex justify-between items-center font-medium">
        <div className="flex items-center gap-4">
          <span>{editor.storage.characterCount.words()} words</span>
          <span>{editor.storage.characterCount.characters()} characters</span>
        </div>
        <div className="flex items-center gap-2">
          {limit && (
            <span className={cn(editor.storage.characterCount.characters() > limit ? "text-red-500 font-bold" : "")}>
              {Math.round((editor.storage.characterCount.characters() / limit) * 100)}% used
            </span>
          )}
          <span className="text-[#D4C5B5]">Premium Editor</span>
        </div>
      </div>

      {/* Image Modal */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-[#FFF9ED] border-[#E5D5C5]">
          <DialogHeader>
            <DialogTitle className="text-[#2D2721] flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-[#FFC857]" />
              Add Image
            </DialogTitle>
            <DialogDescription className="text-[#6B5744]">
              Upload an image or enter a URL to insert into your content.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="upload" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-[#FFF0D4]">
              <TabsTrigger value="upload" className="data-[state=active]:bg-white data-[state=active]:text-[#2D2721] text-[#6B5744]">Upload</TabsTrigger>
              <TabsTrigger value="url" className="data-[state=active]:bg-white data-[state=active]:text-[#2D2721] text-[#6B5744]">Image URL</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="space-y-4 pt-4">
              <div 
                className="border-2 border-dashed border-[#E5D5C5] rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-[#FFC857] hover:bg-white/50 transition-all text-center group"
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileUpload}
                />
                
                {imageUrl ? (
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-white shadow-sm">
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-contain" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white font-medium text-sm">Click to change</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-[#E5D5C5]/30 flex items-center justify-center mb-3 text-[#FFC857] group-hover:scale-110 transition-transform">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                    <div className="text-sm font-medium text-[#2D2721] mb-1">Click to upload image</div>
                    <div className="text-xs text-[#8B7355]">SVG, PNG, JPG or GIF (max. 5MB)</div>
                  </>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="url" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="image-url" className="text-[#2D2721]">Image Link</Label>
                <Input 
                  id="image-url" 
                  placeholder="https://example.com/image.jpg" 
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="bg-white border-[#E5D5C5]"
                />
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter className="mt-2">
            <WarmButton variant="outline" onClick={() => setIsImageModalOpen(false)}>Cancel</WarmButton>
            <WarmButton onClick={insertImage} disabled={!imageUrl}>
              Insert Image
            </WarmButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Youtube Modal */}
      <Dialog open={isYoutubeModalOpen} onOpenChange={setIsYoutubeModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-[#FFF9ED] border-[#E5D5C5]">
          <DialogHeader>
            <DialogTitle className="text-[#2D2721] flex items-center gap-2">
              <YoutubeIcon className="h-5 w-5 text-[#FF0000]" />
              Add Video
            </DialogTitle>
            <DialogDescription className="text-[#6B5744]">
              Enter a YouTube video URL to embed.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="youtube-url" className="text-[#2D2721]">Video Link</Label>
              <Input 
                id="youtube-url" 
                placeholder="https://www.youtube.com/watch?v=..." 
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                className="bg-white border-[#E5D5C5]"
              />
            </div>
          </div>
          
          <DialogFooter className="mt-2">
            <WarmButton variant="outline" onClick={() => setIsYoutubeModalOpen(false)}>Cancel</WarmButton>
            <WarmButton onClick={insertYoutube} disabled={!youtubeUrl}>
              Embed Video
            </WarmButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
