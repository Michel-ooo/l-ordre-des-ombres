import { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Plus, Lock, Unlock, BookOpen, Download, Upload, Trash2, 
  Shuffle, Search, Copy, ArrowRightLeft
} from 'lucide-react';

const DICT_STORAGE_KEY = 'ordre_word_cipher_dict';

interface DictEntry {
  real: string;
  coded: string;
}

const DECOY_WORDS = [
  'lumière', 'ombre', 'sentier', 'mystère', 'silence', 'étoile', 'nuit',
  'rituel', 'gardien', 'secret', 'flamme', 'cercle', 'lune', 'oracle',
  'vérité', 'masque', 'serment', 'temple', 'abîme', 'miroir', 'passage',
  'guide', 'symbole', 'ancien', 'voile', 'destin', 'rune', 'cendre',
  'cristal', 'sanctuaire', 'initié', 'ténèbre', 'aurore', 'portail',
  'clé', 'sceau', 'prophétie', 'songe', 'spectre', 'relique',
];

function loadDict(): DictEntry[] {
  try {
    const raw = localStorage.getItem(DICT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDict(dict: DictEntry[]) {
  localStorage.setItem(DICT_STORAGE_KEY, JSON.stringify(dict));
}

function generateDecoyPhrase(length: number = 8): string {
  const words: string[] = [];
  for (let i = 0; i < length; i++) {
    words.push(DECOY_WORDS[Math.floor(Math.random() * DECOY_WORDS.length)]);
  }
  // Capitalize first word
  words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
  return words.join(' ') + '.';
}

const WordCipherPage = () => {
  const [dict, setDict] = useState<DictEntry[]>(loadDict);
  const [newReal, setNewReal] = useState('');
  const [newCoded, setNewCoded] = useState('');
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [decoyPhrase, setDecoyPhrase] = useState('');

  useEffect(() => {
    saveDict(dict);
  }, [dict]);

  const addEntry = () => {
    const real = newReal.trim().toLowerCase();
    const coded = newCoded.trim().toLowerCase();
    if (!real || !coded) {
      toast.error('Les deux champs sont requis');
      return;
    }
    if (dict.some(e => e.real === real)) {
      toast.error('Ce mot réel existe déjà dans le dictionnaire');
      return;
    }
    setDict(prev => [...prev, { real, coded }]);
    setNewReal('');
    setNewCoded('');
    toast.success('Entrée ajoutée');
  };

  const removeEntry = (index: number) => {
    setDict(prev => prev.filter((_, i) => i !== index));
    toast.success('Entrée supprimée');
  };

  const encrypt = useCallback(() => {
    if (!inputText.trim()) return;
    const words = inputText.split(/(\s+)/);
    const result = words.map(word => {
      if (/^\s+$/.test(word)) return word;
      // Preserve punctuation
      const match = word.match(/^([^a-zA-ZÀ-ÿ]*)([a-zA-ZÀ-ÿ]+)([^a-zA-ZÀ-ÿ]*)$/);
      if (!match) return word;
      const [, prefix, core, suffix] = match;
      const lower = core.toLowerCase();
      const entry = dict.find(e => e.real === lower);
      if (entry) {
        // Preserve original capitalization pattern
        let coded = entry.coded;
        if (core[0] === core[0].toUpperCase()) {
          coded = coded.charAt(0).toUpperCase() + coded.slice(1);
        }
        return prefix + coded + suffix;
      }
      return word;
    });
    setOutputText(result.join(''));
  }, [inputText, dict]);

  const decrypt = useCallback(() => {
    if (!inputText.trim()) return;
    const words = inputText.split(/(\s+)/);
    const result = words.map(word => {
      if (/^\s+$/.test(word)) return word;
      const match = word.match(/^([^a-zA-ZÀ-ÿ]*)([a-zA-ZÀ-ÿ]+)([^a-zA-ZÀ-ÿ]*)$/);
      if (!match) return word;
      const [, prefix, core, suffix] = match;
      const lower = core.toLowerCase();
      const entry = dict.find(e => e.coded === lower);
      if (entry) {
        let real = entry.real;
        if (core[0] === core[0].toUpperCase()) {
          real = real.charAt(0).toUpperCase() + real.slice(1);
        }
        return prefix + real + suffix;
      }
      return word;
    });
    setOutputText(result.join(''));
  }, [inputText, dict]);

  const exportDict = () => {
    const blob = new Blob([JSON.stringify(dict, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dictionnaire-ordre.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Dictionnaire exporté');
  };

  const importDict = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (Array.isArray(data) && data.every(e => e.real && e.coded)) {
          setDict(data);
          toast.success(`${data.length} entrées importées`);
        } else {
          toast.error('Format de fichier invalide');
        }
      } catch {
        toast.error('Erreur lors de la lecture du fichier');
      }
    };
    input.click();
  };

  const copyOutput = () => {
    navigator.clipboard.writeText(outputText);
    toast.success('Copié');
  };

  const filteredDict = dict.filter(e =>
    e.real.includes(searchTerm.toLowerCase()) || 
    e.coded.includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl tracking-wide mb-3">Codex des Mots</h1>
          <p className="text-muted-foreground text-sm">
            Chiffrez et déchiffrez vos messages mot à mot avec votre dictionnaire secret
          </p>
        </div>

        <Tabs defaultValue="cipher" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-secondary/50">
            <TabsTrigger value="cipher" className="gap-2">
              <ArrowRightLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Chiffrer / Déchiffrer</span>
              <span className="sm:hidden">Chiffrer</span>
            </TabsTrigger>
            <TabsTrigger value="dictionary" className="gap-2">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Dictionnaire</span>
              <span className="sm:hidden">Dict.</span>
            </TabsTrigger>
            <TabsTrigger value="decoy" className="gap-2">
              <Shuffle className="w-4 h-4" />
              <span className="hidden sm:inline">Leurre</span>
              <span className="sm:hidden">Leurre</span>
            </TabsTrigger>
          </TabsList>

          {/* Cipher Tab */}
          <TabsContent value="cipher" className="space-y-4">
            <Card className="border-gold-dim/20 bg-card/80">
              <CardContent className="pt-6 space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block font-heading-text tracking-wider">
                    Texte d'entrée
                  </label>
                  <Textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Entrez votre phrase ici..."
                    className="cipher-input min-h-[100px] font-mono"
                  />
                </div>

                <div className="flex gap-2 justify-center">
                  <Button onClick={encrypt} className="gap-2 bg-gold-dim/20 hover:bg-gold-dim/30 text-gold border border-gold-dim/30">
                    <Lock className="w-4 h-4" />
                    Crypter
                  </Button>
                  <Button onClick={decrypt} className="gap-2 bg-secondary hover:bg-secondary/80 text-foreground border border-gold-dim/20">
                    <Unlock className="w-4 h-4" />
                    Décrypter
                  </Button>
                </div>

                {outputText && (
                  <div className="relative">
                    <label className="text-sm text-muted-foreground mb-1.5 block font-heading-text tracking-wider">
                      Résultat
                    </label>
                    <Textarea
                      value={outputText}
                      readOnly
                      className="cipher-input min-h-[100px] font-mono"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={copyOutput}
                      className="absolute top-8 right-2 text-gold-dim hover:text-gold"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                <div className="text-xs text-muted-foreground/60 text-center">
                  {dict.length} mot{dict.length !== 1 ? 's' : ''} dans le dictionnaire
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Dictionary Tab */}
          <TabsContent value="dictionary" className="space-y-4">
            {/* Add entry */}
            <Card className="border-gold-dim/20 bg-card/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-heading-text tracking-wider text-gold-dim">
                  Ajouter une entrée
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1 block">Mot réel</label>
                    <Input
                      value={newReal}
                      onChange={(e) => setNewReal(e.target.value)}
                      placeholder="ex: rendez-vous"
                      className="cipher-input"
                      onKeyDown={(e) => e.key === 'Enter' && addEntry()}
                    />
                  </div>
                  <ArrowRightLeft className="w-4 h-4 text-gold-dim/50 shrink-0 mb-2" />
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1 block">Mot codé</label>
                    <Input
                      value={newCoded}
                      onChange={(e) => setNewCoded(e.target.value)}
                      placeholder="ex: crépuscule"
                      className="cipher-input"
                      onKeyDown={(e) => e.key === 'Enter' && addEntry()}
                    />
                  </div>
                  <Button onClick={addEntry} size="icon" className="shrink-0 bg-gold-dim/20 hover:bg-gold-dim/30 text-gold border border-gold-dim/30">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Import/Export */}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={importDict} className="gap-1.5 text-xs border-gold-dim/20 text-gold-dim">
                <Upload className="w-3.5 h-3.5" />
                Importer
              </Button>
              <Button variant="outline" size="sm" onClick={exportDict} className="gap-1.5 text-xs border-gold-dim/20 text-gold-dim">
                <Download className="w-3.5 h-3.5" />
                Exporter
              </Button>
            </div>

            {/* Search & List */}
            <Card className="border-gold-dim/20 bg-card/80">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-heading-text tracking-wider text-gold-dim">
                    Dictionnaire ({dict.length})
                  </CardTitle>
                </div>
                {dict.length > 5 && (
                  <div className="relative mt-2">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Rechercher..."
                      className="cipher-input pl-8 h-8 text-xs"
                    />
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {filteredDict.length === 0 ? (
                  <p className="text-center text-muted-foreground/50 text-sm py-6">
                    {dict.length === 0 ? 'Dictionnaire vide. Ajoutez des mots ci-dessus.' : 'Aucun résultat.'}
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-[400px] overflow-y-auto scrollbar-none">
                    {filteredDict.map((entry, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors group"
                      >
                        <div className="flex items-center gap-2 text-sm">
                          <Badge variant="outline" className="font-mono text-xs border-gold-dim/30 text-gold-dim">
                            {entry.real}
                          </Badge>
                          <ArrowRightLeft className="w-3 h-3 text-muted-foreground/40" />
                          <Badge variant="outline" className="font-mono text-xs border-crimson-bright/30 text-crimson-bright">
                            {entry.coded}
                          </Badge>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeEntry(idx)}
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-crimson-bright transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Decoy Tab */}
          <TabsContent value="decoy" className="space-y-4">
            <Card className="border-gold-dim/20 bg-card/80">
              <CardHeader>
                <CardTitle className="text-sm font-heading-text tracking-wider text-gold-dim">
                  Générateur de phrases leurres
                </CardTitle>
                <p className="text-xs text-muted-foreground/60">
                  Générez des phrases crédibles pour dissimuler vos vrais messages codés
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={() => setDecoyPhrase(generateDecoyPhrase(6 + Math.floor(Math.random() * 6)))}
                  className="w-full gap-2 bg-gold-dim/20 hover:bg-gold-dim/30 text-gold border border-gold-dim/30"
                >
                  <Shuffle className="w-4 h-4" />
                  Générer un leurre
                </Button>

                {decoyPhrase && (
                  <div className="relative">
                    <Textarea
                      value={decoyPhrase}
                      readOnly
                      className="cipher-input min-h-[80px] font-mono text-sm"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        navigator.clipboard.writeText(decoyPhrase);
                        toast.success('Leurre copié');
                      }}
                      className="absolute top-2 right-2 text-gold-dim hover:text-gold"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </MainLayout>
  );
};

export default WordCipherPage;
