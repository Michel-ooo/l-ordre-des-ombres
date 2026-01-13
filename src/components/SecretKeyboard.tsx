import { Button } from '@/components/ui/button';
import { Delete, Space, CornerDownLeft } from 'lucide-react';

interface SecretKeyboardProps {
  onKeyPress: (symbol: string) => void;
  onBackspace: () => void;
  onSpace: () => void;
  onNewLine: () => void;
}

// Extended esoteric symbols with Vigenère-compatible encoding
const keyboardRows = [
  ['☽', '◈', '⬡', '◇', '◊', '⌘', '⍟', '⌬', '⋄', '◬'],
  ['⌖', '⌾', '⍙', '⌿', '⍜', '⌭', '⍐', '⍝', '⌇', '⍗'],
  ['⌮', '⍌', '⌯', '⍍', '⍎', '⍏'],
];

const specialSymbols = ['⁂', '※', '‡', '†', '∴', '∵', '⊙', '⊕', '⊗', '⊛'];

export function SecretKeyboard({ onKeyPress, onBackspace, onSpace, onNewLine }: SecretKeyboardProps) {
  return (
    <div className="ritual-card p-4 space-y-3">
      <p className="text-xs text-muted-foreground font-heading tracking-wide text-center mb-2">
        CLAVIER SACRÉ DE L'ORDRE
      </p>
      
      {/* Main symbol rows */}
      {keyboardRows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-center gap-1 sm:gap-2">
          {row.map((symbol) => (
            <Button
              key={symbol}
              variant="outline"
              size="sm"
              onClick={() => onKeyPress(symbol)}
              className="symbol-glyph w-8 h-8 sm:w-10 sm:h-10 p-0 text-base sm:text-lg hover:lunar-glow hover:border-primary/50 transition-all"
            >
              {symbol}
            </Button>
          ))}
        </div>
      ))}

      {/* Special symbols row */}
      <div className="flex justify-center gap-1 sm:gap-2 pt-2 border-t border-border/30">
        {specialSymbols.map((symbol) => (
          <Button
            key={symbol}
            variant="ghost"
            size="sm"
            onClick={() => onKeyPress(symbol)}
            className="w-7 h-7 sm:w-8 sm:h-8 p-0 text-sm text-muted-foreground hover:text-foreground"
          >
            {symbol}
          </Button>
        ))}
      </div>

      {/* Control keys */}
      <div className="flex justify-center gap-2 pt-2 border-t border-border/30">
        <Button
          variant="outline"
          size="sm"
          onClick={onBackspace}
          className="gap-1 text-xs"
        >
          <Delete className="w-4 h-4" />
          <span className="hidden sm:inline">Effacer</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onSpace}
          className="gap-1 px-6 sm:px-8 text-xs"
        >
          <Space className="w-4 h-4" />
          <span className="hidden sm:inline">Espace</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onNewLine}
          className="gap-1 text-xs"
        >
          <CornerDownLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Ligne</span>
        </Button>
      </div>
    </div>
  );
}
