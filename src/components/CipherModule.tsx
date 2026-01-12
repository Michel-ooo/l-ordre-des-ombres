import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Save, RefreshCw, Lock, Unlock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Esoteric symbol mapping
const esotericSymbols: Record<string, string> = {
  'a': '☽', 'b': '◈', 'c': '⬡', 'd': '◇', 'e': '◊',
  'f': '⌘', 'g': '⍟', 'h': '⌬', 'i': '⋄', 'j': '◬',
  'k': '⌖', 'l': '⌾', 'm': '⍙', 'n': '⌿', 'o': '⍜',
  'p': '⌭', 'q': '⍐', 'r': '⍝', 's': '⌇', 't': '⍗',
  'u': '⌮', 'v': '⍌', 'w': '⌯', 'x': '⍍', 'y': '⍎',
  'z': '⍏', ' ': '·', '.': '⁂', ',': '※', '!': '‡',
  '?': '†', "'": '′', '"': '″', '-': '—', ':': '∴',
  ';': '∵', '0': '⊙', '1': '⊕', '2': '⊗', '3': '⊛',
  '4': '⊜', '5': '⊝', '6': '⊞', '7': '⊟', '8': '⊠', '9': '⊡'
};

const reverseEsotericSymbols: Record<string, string> = Object.fromEntries(
  Object.entries(esotericSymbols).map(([k, v]) => [v, k])
);

// Caesar cipher functions
function caesarEncode(text: string, shift: number): string {
  return text.split('').map(char => {
    if (char.match(/[a-z]/i)) {
      const code = char.charCodeAt(0);
      const isUpperCase = code >= 65 && code <= 90;
      const base = isUpperCase ? 65 : 97;
      return String.fromCharCode(((code - base + shift) % 26 + 26) % 26 + base);
    }
    return char;
  }).join('');
}

function caesarDecode(text: string, shift: number): string {
  return caesarEncode(text, -shift);
}

// Esoteric cipher functions
function esotericEncode(text: string): string {
  return text.toLowerCase().split('').map(char => 
    esotericSymbols[char] || char
  ).join('');
}

function esotericDecode(text: string): string {
  return text.split('').map(char => 
    reverseEsotericSymbols[char] || char
  ).join('');
}

interface CipherModuleProps {
  onSaveToArchive?: (message: { original: string; encoded: string; method: string; date: string }) => void;
}

export function CipherModule({ onSaveToArchive }: CipherModuleProps) {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [shift, setShift] = useState([3]);
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const { toast } = useToast();

  const handleCaesar = () => {
    const result = mode === 'encode' 
      ? caesarEncode(inputText, shift[0])
      : caesarDecode(inputText, shift[0]);
    setOutputText(result);
  };

  const handleEsoteric = () => {
    const result = mode === 'encode'
      ? esotericEncode(inputText)
      : esotericDecode(inputText);
    setOutputText(result);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(outputText);
    toast({
      title: "Copié dans le presse-papier",
      description: "Le message a été copié avec succès.",
    });
  };

  const handleSave = (method: string) => {
    if (onSaveToArchive && inputText && outputText) {
      onSaveToArchive({
        original: inputText,
        encoded: outputText,
        method,
        date: new Date().toISOString(),
      });
      toast({
        title: "Message archivé",
        description: "Le message a été sauvegardé dans les Archives.",
      });
    }
  };

  const handleClear = () => {
    setInputText('');
    setOutputText('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center gap-4 mb-8">
        <Button
          variant={mode === 'encode' ? 'default' : 'ghost'}
          onClick={() => setMode('encode')}
          className="gap-2"
        >
          <Lock className="w-4 h-4" />
          Encoder
        </Button>
        <Button
          variant={mode === 'decode' ? 'default' : 'ghost'}
          onClick={() => setMode('decode')}
          className="gap-2"
        >
          <Unlock className="w-4 h-4" />
          Décoder
        </Button>
      </div>

      <div className="ritual-card p-6">
        <label className="block text-sm text-muted-foreground mb-2 font-heading tracking-wide">
          Message {mode === 'encode' ? 'original' : 'chiffré'}
        </label>
        <Textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={mode === 'encode' ? "Entrez votre message secret..." : "Collez le message chiffré..."}
          className="cipher-input min-h-[120px] font-body"
        />
      </div>

      <Tabs defaultValue="caesar" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-secondary/50">
          <TabsTrigger value="caesar" className="font-heading">Chiffre de César</TabsTrigger>
          <TabsTrigger value="esoteric" className="font-heading">Symboles Ésotériques</TabsTrigger>
        </TabsList>

        <TabsContent value="caesar" className="space-y-4 mt-4">
          <div className="ritual-card p-6">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm text-muted-foreground font-heading tracking-wide">
                Décalage: {shift[0]}
              </label>
              <span className="text-xs text-muted-foreground">
                A → {String.fromCharCode(65 + (shift[0] % 26))}
              </span>
            </div>
            <Slider
              value={shift}
              onValueChange={setShift}
              max={25}
              min={1}
              step={1}
              className="mb-4"
            />
            <Button onClick={handleCaesar} className="w-full">
              {mode === 'encode' ? 'Chiffrer' : 'Déchiffrer'}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="esoteric" className="space-y-4 mt-4">
          <div className="ritual-card p-6">
            <p className="text-sm text-muted-foreground mb-4">
              Transforme chaque lettre en symbole ésotérique de l'Ordre.
            </p>
            <div className="flex flex-wrap gap-2 mb-4 text-center justify-center">
              {['☽', '◈', '⬡', '◇', '⌘', '⍟', '⌬'].map((s, i) => (
                <span key={i} className="symbol-glyph">{s}</span>
              ))}
            </div>
            <Button onClick={handleEsoteric} className="w-full">
              {mode === 'encode' ? 'Encoder en symboles' : 'Décoder les symboles'}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {outputText && (
        <div className="ritual-card p-6 animate-fade-in">
          <label className="block text-sm text-muted-foreground mb-2 font-heading tracking-wide">
            Résultat
          </label>
          <div className="bg-secondary/30 rounded-lg p-4 min-h-[80px] font-body break-all">
            {outputText}
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
              <Copy className="w-4 h-4" />
              Copier
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleSave(shift ? `César (${shift[0]})` : 'Ésotérique')} 
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              Archiver
            </Button>
            <Button variant="ghost" size="sm" onClick={handleClear} className="gap-2 ml-auto">
              <RefreshCw className="w-4 h-4" />
              Effacer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
