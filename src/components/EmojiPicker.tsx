import { useState } from 'react';
import { Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const emojiCategories = [
  {
    name: 'Fréquents',
    emojis: ['😀', '😂', '❤️', '👍', '🙏', '😊', '🔥', '✨', '💯', '😎'],
  },
  {
    name: 'Visages',
    emojis: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐'],
  },
  {
    name: 'Gestes',
    emojis: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🙏'],
  },
  {
    name: 'Symboles',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '✨', '⭐', '🌟', '💫', '⚡', '🔥', '💥', '🎉', '🎊', '🏆', '🥇', '🎯', '💯', '✅', '❌', '⚠️', '🚨', '💀', '☠️', '👻', '👽', '🤖', '🎃', '🔮', '🌙', '☀️', '🌈'],
  },
  {
    name: 'Mystique',
    emojis: ['🌙', '🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘', '⭐', '✨', '💫', '🔮', '🧿', '🪬', '📿', '🕯️', '⚗️', '🗝️', '🏛️', '⛪', '🕌', '🕍', '⛩️', '🏰', '🦅', '🦉', '🐍', '🕷️', '🦇', '🐺', '🖤', '🗡️', '⚔️', '🛡️', '👁️', '🧙', '🧝', '👤', '👥', '💀', '☠️', '👻', '🌌', '🌠'],
  },
];

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

export function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(0);

  const handleSelect = (emoji: string) => {
    onEmojiSelect(emoji);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" type="button">
          <Smile className="w-5 h-5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2" align="end" side="top">
        {/* Category tabs */}
        <div className="flex gap-1 mb-2 overflow-x-auto pb-2 border-b border-border">
          {emojiCategories.map((cat, idx) => (
            <Button
              key={cat.name}
              variant={selectedCategory === idx ? 'secondary' : 'ghost'}
              size="sm"
              className="text-xs whitespace-nowrap"
              onClick={() => setSelectedCategory(idx)}
            >
              {cat.name}
            </Button>
          ))}
        </div>
        
        {/* Emoji grid */}
        <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
          {emojiCategories[selectedCategory].emojis.map((emoji, idx) => (
            <button
              key={`${emoji}-${idx}`}
              className="p-2 hover:bg-secondary rounded text-lg transition-colors"
              onClick={() => handleSelect(emoji)}
              type="button"
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
