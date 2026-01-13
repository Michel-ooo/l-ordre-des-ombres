import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Save, RefreshCw, Lock, Unlock, Keyboard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SecretKeyboard } from './SecretKeyboard';

// Esoteric symbol mapping (extended)
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

// Vigenère cipher (more secure than Caesar)
function vigenereEncode(text: string, key: string): string {
  if (!key) return text;
  const keyLower = key.toLowerCase().replace(/[^a-z]/g, '');
  if (!keyLower) return text;
  
  let keyIndex = 0;
  return text.split('').map(char => {
    if (char.match(/[a-z]/i)) {
      const code = char.charCodeAt(0);
      const isUpperCase = code >= 65 && code <= 90;
      const base = isUpperCase ? 65 : 97;
      const shift = keyLower.charCodeAt(keyIndex % keyLower.length) - 97;
      keyIndex++;
      return String.fromCharCode(((code - base + shift) % 26) + base);
    }
    return char;
  }).join('');
}

function vigenereDecode(text: string, key: string): string {
  if (!key) return text;
  const keyLower = key.toLowerCase().replace(/[^a-z]/g, '');
  if (!keyLower) return text;
  
  let keyIndex = 0;
  return text.split('').map(char => {
    if (char.match(/[a-z]/i)) {
      const code = char.charCodeAt(0);
      const isUpperCase = code >= 65 && code <= 90;
      const base = isUpperCase ? 65 : 97;
      const shift = keyLower.charCodeAt(keyIndex % keyLower.length) - 97;
      keyIndex++;
      return String.fromCharCode(((code - base - shift + 26) % 26) + base);
    }
    return char;
  }).join('');
}

// Double cipher: Vigenère + Esoteric symbols
function doubleEncode(text: string, key: string): string {
  const vigenered = vigenereEncode(text, key);
  return vigenered.toLowerCase().split('').map(char => 
    esotericSymbols[char] || char
  ).join('');
}

function doubleDecode(text: string, key: string): string {
  const decoded = text.split('').map(char => 
    reverseEsotericSymbols[char] || char
  ).join('');
  return vigenereDecode(decoded, key);
}

// Esoteric cipher only
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

interface AdvancedCipherModuleProps {
  onSaveToArchive?: (message: { original: string; encoded: string; method: string; date: string }) => void;
}

export function AdvancedCipherModule({ onSaveToArchive }: AdvancedCipherModuleProps) {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [showKeyboard, setShowKeyboard] = useState(false);
  const { toast } = useToast();

  const handleVigenere = () => {
    if (!secretKey) {
      toast({
        title: "Clé requise",
        description: "Entrez une clé secrète pour le chiffrement Vigenère.",
        variant: "destructive",
      });
      return;
    }
    const result = mode === 'encode' 
      ? vigenereEncode(inputText, secretKey)
      : vigenereDecode(inputText, secretKey);
    setOutputText(result);
  };

  const handleDouble = () => {
    if (!secretKey) {
      toast({
        title: "Clé requise",
        description: "Entrez une clé secrète pour le chiffrement double.",
        variant: "destructive",
      });
      return;
    }
    const result = mode === 'encode'
      ? doubleEncode(inputText, secretKey)
      : doubleDecode(inputText, secretKey);
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
      title: "Copié",
      description: "Le message a été copié dans le presse-papier.",
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
        title: "Archivé",
        description: "Le message a été sauvegardé dans les Archives.",
      });
    }
  };

  const handleClear = () => {
    setInputText('');
    setOutputText('');
  };

  // Keyboard handlers
  const handleKeyPress = (symbol: string) => {
    setInputText(prev => prev + symbol);
  };

  const handleBackspace = () => {
    setInputText(prev => prev.slice(0, -1));
  };

  const handleSpace = () => {
    setInputText(prev => prev + '·');
  };

  const handleNewLine = () => {
    setInputText(prev => prev + '\n');
  };

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
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

      {/* Secret Key Input */}
      <div className="ritual-card p-6">
        <label className="block text-sm text-muted-foreground mb-2 font-heading tracking-wide">
          Clé Secrète (pour Vigenère)
        </label>
        <Input
          value={secretKey}
          onChange={(e) => setSecretKey(e.target.value)}
          placeholder="Entrez votre clé secrète..."
          className="cipher-input font-mono"
          type="password"
        />
        <p className="text-xs text-muted-foreground mt-2">
          La clé est utilisée pour les méthodes Vigenère et Double Chiffrement
        </p>
      </div>

      {/* Input Area */}
      <div className="ritual-card p-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm text-muted-foreground font-heading tracking-wide">
            Message {mode === 'encode' ? 'original' : 'chiffré'}
          </label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowKeyboard(!showKeyboard)}
            className="gap-2 text-xs"
          >
            <Keyboard className="w-4 h-4" />
            {showKeyboard ? 'Masquer' : 'Clavier secret'}
          </Button>
        </div>
        <Textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={mode === 'encode' ? "Entrez votre message secret..." : "Collez le message chiffré..."}
          className="cipher-input min-h-[120px] font-body"
        />
      </div>

      {/* Secret Keyboard */}
      {showKeyboard && (
        <SecretKeyboard
          onKeyPress={handleKeyPress}
          onBackspace={handleBackspace}
          onSpace={handleSpace}
          onNewLine={handleNewLine}
        />
      )}

      {/* Cipher Methods */}
      <Tabs defaultValue="double" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-secondary/50">
          <TabsTrigger value="double" className="font-heading text-xs sm:text-sm">Double Chiffrement</TabsTrigger>
          <TabsTrigger value="vigenere" className="font-heading text-xs sm:text-sm">Vigenère</TabsTrigger>
          <TabsTrigger value="esoteric" className="font-heading text-xs sm:text-sm">Symboles</TabsTrigger>
        </TabsList>

        <TabsContent value="double" className="space-y-4 mt-4">
          <div className="ritual-card p-6">
            <p className="text-sm text-muted-foreground mb-4">
              Combine le chiffrement Vigenère avec la transformation en symboles ésotériques.
              <br />
              <span className="text-xs">Niveau de sécurité : ⊛⊛⊛ Maximum</span>
            </p>
            <Button onClick={handleDouble} className="w-full">
              {mode === 'encode' ? 'Double Chiffrement' : 'Double Déchiffrement'}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="vigenere" className="space-y-4 mt-4">
          <div className="ritual-card p-6">
            <p className="text-sm text-muted-foreground mb-4">
              Chiffrement polyalphabétique utilisant une clé secrète.
              <br />
              <span className="text-xs">Niveau de sécurité : ⊛⊛ Élevé</span>
            </p>
            <Button onClick={handleVigenere} className="w-full">
              {mode === 'encode' ? 'Chiffrer (Vigenère)' : 'Déchiffrer (Vigenère)'}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="esoteric" className="space-y-4 mt-4">
          <div className="ritual-card p-6">
            <p className="text-sm text-muted-foreground mb-4">
              Transformation en symboles ésotériques de l'Ordre (sans clé).
              <br />
              <span className="text-xs">Niveau de sécurité : ⊛ Standard</span>
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

      {/* Output */}
      {outputText && (
        <div className="ritual-card p-6 animate-fade-in">
          <label className="block text-sm text-muted-foreground mb-2 font-heading tracking-wide">
            Résultat
          </label>
          <div className="bg-secondary/30 rounded-lg p-4 min-h-[80px] font-body break-all">
            {outputText}
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
              <Copy className="w-4 h-4" />
              Copier
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleSave('Chiffrement Ordre')} 
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
