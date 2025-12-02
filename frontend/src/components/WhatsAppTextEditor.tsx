import React, { useState, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Bold, 
  Smile, 
  Type
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WhatsAppTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

// Extended WhatsApp emojis organized by category
const EMOJI_CATEGORIES = {
  'Sering Digunakan': [
    '😊', '😂', '❤️', '👍', '👎', '😢', '😮', '😡', '🎉', '🔥',
    '💯', '✅', '❌', '⭐', '👋', '🤝', '🙏', '👏', '💪', '🎯'
  ],
  'Wajah & Orang': [
    '😀', '😃', '😄', '�', '😆', '😅', '😂', '🤣', '😊', '😇',
    '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
    '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
    '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
    '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬'
  ],
  'Aktivitas': [
    '�📅', '⏰', '📍', '💼', '🎓', '🏥', '🏫', '🏢', '🚗', '✈️',
    '🎊', '🎈', '🎁', '🎀', '🎂', '🍰', '🧁', '🍕', '🍔', '🌮',
    '🥗', '🍜', '🍝', '🍛', '🍱', '🍙', '🍘', '🍚', '🥘', '🍲'
  ],
  'Objek': [
    '📱', '💻', '⌨️', '🖥️', '🖨️', '📷', '📹', '🎥', '📺', '🎮',
    '🕹️', '📻', '🎧', '🎤', '🎵', '🎶', '🎼', '📖', '📚', '📝',
    '✏️', '🖊️', '🖋️', '✒️', '📐', '📏', '📌', '📍', '📎', '🔗'
  ],
  'Simbol': [
    '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕',
    '💞', '💓', '💗', '💖', '💘', '💝', '🔔', '🔕', '📢', '📣',
    '💬', '💭', '🗯️', '♠️', '♥️', '♦️', '♣️', '♨️', '💈', '🔰'
  ]
};

export function WhatsAppTextEditor({ 
  value, 
  onChange, 
  placeholder = "Tulis pesan Anda di sini...",
  className
}: WhatsAppTextEditorProps) {
  const [showEmojis, setShowEmojis] = useState(false);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState('Sering Digunakan');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertText = useCallback((insertValue: string, wrapWith?: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    let newText;
    if (wrapWith) {
      // For formatting like *bold* or _italic_
      newText = value.substring(0, start) + 
                wrapWith + selectedText + wrapWith + 
                value.substring(end);
    } else {
      // For emojis or plain text insertion
      newText = value.substring(0, start) + 
                insertValue + 
                value.substring(end);
    }

    onChange(newText);

    // Reset cursor position
    setTimeout(() => {
      if (wrapWith) {
        const newPosition = start + wrapWith.length + selectedText.length + wrapWith.length;
        textarea.setSelectionRange(newPosition, newPosition);
      } else {
        const newPosition = start + insertValue.length;
        textarea.setSelectionRange(newPosition, newPosition);
      }
      textarea.focus();
    }, 0);
  }, [value, onChange]);
  const formatBold = () => {
    insertText('', '*');
  };

  const formatStrikethrough = () => {
    insertText('', '~');
  };
  const insertEmoji = (emoji: string) => {
    insertText(emoji);
    // Don't close emoji picker, let user select multiple emojis
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Formatting Toolbar */}      <div className="flex items-center gap-1 p-2 border rounded-lg bg-muted/30">
        <Button
          variant="ghost"
          size="sm"
          onClick={formatBold}
          className="h-8 w-8 p-0"
          title="Bold (*text*)"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={formatStrikethrough}
          className="h-8 w-8 p-0"
          title="Strikethrough (~text~)"
        >
          <Type className="h-4 w-4" />
        </Button>
        <div className="h-4 w-px bg-border mx-1" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowEmojis(!showEmojis)}
          className="h-8 w-8 p-0"
          title="Emoji"
        >
          <Smile className="h-4 w-4" />
        </Button>
      </div>{/* Emoji Picker */}
      {showEmojis && (
        <div className="border rounded-lg p-3 bg-background shadow-lg">
          {/* Category tabs */}
          <div className="flex gap-1 mb-3 overflow-x-auto">
            {Object.keys(EMOJI_CATEGORIES).map((category) => (
              <button
                key={category}
                onClick={() => setActiveEmojiCategory(category)}
                className={cn(
                  "px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors",
                  activeEmojiCategory === category
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                )}
              >
                {category}
              </button>
            ))}
          </div>
          
          {/* Emojis grid */}
          <div className="max-h-48 overflow-y-auto">
            <div className="grid grid-cols-8 gap-1">
              {EMOJI_CATEGORIES[activeEmojiCategory as keyof typeof EMOJI_CATEGORIES].map((emoji: string, index: number) => (
                <button
                  key={index}
                  onClick={() => insertEmoji(emoji)}
                  className="w-8 h-8 text-lg hover:bg-muted rounded transition-colors flex items-center justify-center"
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-3 pt-2 border-t">
            <span className="text-xs text-muted-foreground">
              Pilih emoji (tidak akan menutup otomatis)
            </span>
            <button
              onClick={() => setShowEmojis(false)}
              className="text-xs text-primary hover:underline"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Text Area */}
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-[120px] resize-y font-mono text-sm leading-relaxed"
        style={{
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
        }}
      />      {/* Formatting Guide */}
      <div className="text-xs text-muted-foreground">
        <p className="mb-1"><strong>Format teks:</strong></p>
        <div className="flex gap-4">
          <span>*tebal* → <strong>tebal</strong></span>
          <span>~coret~ → <s>coret</s></span>
        </div>
      </div>
    </div>
  );
}
