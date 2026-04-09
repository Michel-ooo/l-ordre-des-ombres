import { useState, useCallback } from 'react';
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
  Lock, Unlock, BookOpen, 
  Shuffle, Search, Copy, ArrowRightLeft
} from 'lucide-react';

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
  'crépuscule', 'brume', 'éphémère', 'mélancolie', 'oubli', 'solitude',
];

// Dictionnaire officiel — fixe et obligatoire
const OFFICIAL_DICT: DictEntry[] = [
  // Pronoms
  { real: 'je', coded: 'le' },
  { real: 'tu', coded: 'vent' },
  { real: 'il', coded: 'écrit' },
  { real: 'elle', coded: 'des' },
  { real: 'nous', coded: 'lettres' },
  { real: 'vous', coded: 'que' },
  { real: 'ils', coded: 'le' },
  { real: 'elles', coded: 'temps' },
  { real: 'on', coded: 'refuse' },
  // Verbes courants
  { real: 'faire', coded: 'de' },
  { real: 'dire', coded: 'lire' },
  { real: 'voir', coded: 'ombre' },
  { real: 'savoir', coded: 'clé' },
  { real: 'venir', coded: 'silence' },
  { real: 'partir', coded: 'mur' },
  { real: 'prendre', coded: 'pluie' },
  { real: 'donner', coded: 'nuit' },
  { real: 'attendre', coded: 'lumière' },
  { real: 'écouter', coded: 'ombrelle' },
  { real: 'parler', coded: 'porte' },
  { real: 'répondre', coded: 'fenêtre' },
  { real: 'manger', coded: 'étoile' },
  { real: 'boire', coded: 'soleil' },
  { real: 'aimer', coded: 'lune' },
  { real: 'marcher', coded: 'feuille' },
  { real: 'courir', coded: 'fleur' },
  { real: 'regarder', coded: 'oiseau' },
  { real: 'jouer', coded: 'chat' },
  { real: 'acheter', coded: 'chien' },
  { real: 'vendre', coded: 'eau' },
  { real: 'ouvrir', coded: 'feu' },
  { real: 'fermer', coded: 'terre' },
  { real: 'chercher', coded: 'air' },
  { real: 'trouver', coded: 'montagne' },
  { real: 'penser', coded: 'rivière' },
  { real: 'entendre', coded: 'forêt' },
  // Noms courants
  { real: 'argent', coded: 'éclat' },
  { real: 'temps', coded: 'souffle' },
  { real: 'travail', coded: 'ombrette' },
  { real: 'maison', coded: 'sanctuaire' },
  { real: 'jardin', coded: 'labyrinthe' },
  { real: 'école', coded: 'agora' },
  { real: 'livre', coded: 'grimoire' },
  { real: 'stylo', coded: 'plume_noire' },
  { real: 'table', coded: 'autel' },
  { real: 'chaise', coded: 'trône' },
  { real: 'ami', coded: 'spectre' },
  { real: 'famille', coded: 'lignée' },
  { real: 'père', coded: 'gardien' },
  { real: 'mère', coded: 'sentinelle' },
  { real: 'frère', coded: 'compagnon' },
  { real: 'sœur', coded: 'sœur_fantôme' },
  { real: 'enfant', coded: 'petit_astre' },
  { real: 'personne', coded: 'voyageur' },
  { real: 'monde', coded: 'théâtre' },
  { real: 'vie', coded: 'fil' },
  { real: 'cœur', coded: 'cristal' },
  { real: 'esprit', coded: 'écho' },
  { real: 'mot', coded: 'murmure' },
  { real: 'phrase', coded: 'chant' },
  { real: 'idée', coded: 'vision' },
  { real: 'secret', coded: 'parchemin' },
  { real: 'rêve', coded: 'voile' },
  { real: 'pensée', coded: 'ombre_douce' },
  { real: 'souvenir', coded: 'reflet' },
  { real: 'sentiment', coded: 'éclat_sombre' },
  { real: 'regard', coded: 'lumière_sifflante' },
  { real: 'voix', coded: 'souffle_perdu' },
  { real: 'silence', coded: 'abîme' },
  // Mots poétiques & mélancoliques
  { real: 'tristesse', coded: 'brume_éternelle' },
  { real: 'solitude', coded: 'île_perdue' },
  { real: 'mélancolie', coded: 'crépuscule_violet' },
  { real: 'nostalgie', coded: 'cendre_tiède' },
  { real: 'douleur', coded: 'épine_noire' },
  { real: 'larme', coded: 'perle_brisée' },
  { real: 'oubli', coded: 'sable_mouvant' },
  { real: 'absence', coded: 'vide_lunaire' },
  { real: 'regret', coded: 'écho_lointain' },
  { real: 'errance', coded: 'sentier_perdu' },
  { real: 'ténèbres', coded: 'manteau_nocturne' },
  { real: 'crépuscule', coded: 'heure_dorée' },
  { real: 'aurore', coded: 'sang_du_ciel' },
  { real: 'brume', coded: 'haleine_froide' },
  { real: 'tempête', coded: 'colère_du_vent' },
  { real: 'froid', coded: 'souffle_blanc' },
  { real: 'nuit', coded: 'velours_sombre' },
  { real: 'lune', coded: 'œil_pâle' },
  { real: 'étoile', coded: 'clou_d_argent' },
  { real: 'ombre', coded: 'double_silencieux' },
  { real: 'flamme', coded: 'langue_rouge' },
  { real: 'cendre', coded: 'mémoire_grise' },
  { real: 'ruine', coded: 'squelette_de_pierre' },
  { real: 'fantôme', coded: 'visiteur_pâle' },
  { real: 'spectre', coded: 'ancien_témoin' },
  { real: 'tombeau', coded: 'lit_éternel' },
  { real: 'poussière', coded: 'poudre_du_temps' },
  { real: 'miroir', coded: 'lac_immobile' },
  { real: 'masque', coded: 'second_visage' },
  { real: 'destin', coded: 'fil_invisible' },
  { real: 'fatalité', coded: 'nœud_noir' },
  { real: 'espoir', coded: 'lueur_fragile' },
  { real: 'promesse', coded: 'serment_gravé' },
  { real: 'trahison', coded: 'lame_cachée' },
  { real: 'abandon', coded: 'rive_déserte' },
  { real: 'attente', coded: 'horloge_muette' },
  { real: 'éternité', coded: 'boucle_sans_fin' },
  { real: 'infini', coded: 'horizon_courbe' },
  { real: 'néant', coded: 'page_blanche' },
  { real: 'âme', coded: 'flamme_intérieure' },
  { real: 'murmure', coded: 'vent_tiède' },
  { real: 'soupir', coded: 'feuille_tombante' },
  { real: 'pleur', coded: 'rosée_amère' },
  { real: 'chagrin', coded: 'poids_invisible' },
  { real: 'détresse', coded: 'marée_noire' },
  { real: 'angoisse', coded: 'nœud_au_ventre' },
  { real: 'peur', coded: 'souffle_glacé' },
  { real: 'courage', coded: 'acier_brûlant' },
  { real: 'honneur', coded: 'lame_droite' },
  { real: 'serment', coded: 'pierre_scellée' },
  { real: 'pardon', coded: 'pluie_douce' },
  { real: 'vengeance', coded: 'feu_dormant' },
  { real: 'liberté', coded: 'ciel_ouvert' },
  { real: 'prison', coded: 'cage_de_verre' },
  { real: 'chaîne', coded: 'serpent_froid' },
  { real: 'blessure', coded: 'sillon_rouge' },
  { real: 'cicatrice', coded: 'carte_ancienne' },
  { real: 'sang', coded: 'encre_vive' },
  { real: 'mort', coded: 'dernier_pas' },
  { real: 'naissance', coded: 'premier_cri' },
  { real: 'amour', coded: 'vertige_sacré' },
  { real: 'haine', coded: 'braise_froide' },
  { real: 'joie', coded: 'éclat_bref' },
  { real: 'bonheur', coded: 'instant_doré' },
  { real: 'malheur', coded: 'ombre_longue' },
  { real: 'beauté', coded: 'aube_fragile' },
  { real: 'laideur', coded: 'reflet_tordu' },
  { real: 'vérité', coded: 'miroir_nu' },
  { real: 'mensonge', coded: 'soie_peinte' },
  { real: 'mystère', coded: 'porte_close' },
  { real: 'légende', coded: 'encre_ancienne' },
  { real: 'prophétie', coded: 'fumée_parlante' },
  { real: 'oracle', coded: 'bouche_aveugle' },
  { real: 'rituel', coded: 'danse_lente' },
  { real: 'prière', coded: 'souffle_montant' },
  { real: 'malédiction', coded: 'racine_noire' },
  { real: 'bénédiction', coded: 'rosée_claire' },
  { real: 'sacrifice', coded: 'offrande_muette' },
  { real: 'résurrection', coded: 'graine_enfouie' },
  { real: 'voyage', coded: 'horizon_brisé' },
  { real: 'exil', coded: 'terre_lointaine' },
  { real: 'retour', coded: 'cercle_fermé' },
  { real: 'chemin', coded: 'fil_de_terre' },
  { real: 'forêt', coded: 'cathédrale_verte' },
  { real: 'mer', coded: 'miroir_agité' },
  { real: 'montagne', coded: 'dos_du_monde' },
  { real: 'rivière', coded: 'veine_bleue' },
  { real: 'pluie', coded: 'larme_du_ciel' },
  { real: 'neige', coded: 'cendre_blanche' },
  { real: 'soleil', coded: 'roi_brûlant' },
  { real: 'rose', coded: 'blessure_douce' },
  { real: 'loup', coded: 'ombre_errante' },
  { real: 'corbeau', coded: 'messager_noir' },
  { real: 'papillon', coded: 'souffle_coloré' },
];

function generateDecoyPhrase(length: number = 8): string {
  const words: string[] = [];
  for (let i = 0; i < length; i++) {
    words.push(DECOY_WORDS[Math.floor(Math.random() * DECOY_WORDS.length)]);
  }
  words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
  return words.join(' ') + '.';
}

const WordCipherPage = () => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [decoyPhrase, setDecoyPhrase] = useState('');

  const encrypt = useCallback(() => {
    if (!inputText.trim()) return;
    const words = inputText.split(/(\s+)/);
    const result = words.map(word => {
      if (/^\s+$/.test(word)) return word;
      const match = word.match(/^([^a-zA-ZÀ-ÿ]*)([a-zA-ZÀ-ÿ]+)([^a-zA-ZÀ-ÿ]*)$/);
      if (!match) return word;
      const [, prefix, core, suffix] = match;
      const lower = core.toLowerCase();
      const entry = OFFICIAL_DICT.find(e => e.real === lower);
      if (entry) {
        let coded = entry.coded;
        if (core[0] === core[0].toUpperCase()) {
          coded = coded.charAt(0).toUpperCase() + coded.slice(1);
        }
        return prefix + coded + suffix;
      }
      return word;
    });
    setOutputText(result.join(''));
  }, [inputText]);

  const decrypt = useCallback(() => {
    if (!inputText.trim()) return;
    const words = inputText.split(/(\s+)/);
    const result = words.map(word => {
      if (/^\s+$/.test(word)) return word;
      const match = word.match(/^([^a-zA-ZÀ-ÿ]*)([a-zA-ZÀ-ÿ_]+)([^a-zA-ZÀ-ÿ_]*)$/);
      if (!match) return word;
      const [, prefix, core, suffix] = match;
      const lower = core.toLowerCase();
      const entry = OFFICIAL_DICT.find(e => e.coded === lower);
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
  }, [inputText]);

  const copyOutput = () => {
    navigator.clipboard.writeText(outputText);
    toast.success('Copié');
  };

  const filteredDict = OFFICIAL_DICT.filter(e =>
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
            Chiffrez et déchiffrez vos messages avec le dictionnaire officiel de l'Ordre
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
                  {OFFICIAL_DICT.length} mots dans le dictionnaire officiel
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Dictionary Tab */}
          <TabsContent value="dictionary" className="space-y-4">
            <Card className="border-gold-dim/20 bg-card/80">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-heading-text tracking-wider text-gold-dim">
                    Dictionnaire Officiel ({OFFICIAL_DICT.length} entrées)
                  </CardTitle>
                  <Badge variant="outline" className="text-xs border-gold-dim/40 text-gold-dim">
                    <Lock className="w-3 h-3 mr-1" />
                    Scellé
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground/50 mt-1">
                  Ce dictionnaire est fixe et ne peut être modifié. Il est partagé par tous les membres de l'Ordre.
                </p>
                <div className="relative mt-2">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Rechercher un mot..."
                    className="cipher-input pl-8 h-8 text-xs"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {filteredDict.length === 0 ? (
                  <p className="text-center text-muted-foreground/50 text-sm py-6">
                    Aucun résultat.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-[400px] overflow-y-auto scrollbar-none">
                    {filteredDict.map((entry, idx) => (
                      <div
                        key={idx}
                        className="flex items-center px-3 py-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
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
