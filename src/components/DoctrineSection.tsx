import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Scroll, Shield, Users, Star, BookOpen } from 'lucide-react';

const doctrineData = [
  {
    id: 'hierarchy',
    icon: Users,
    title: 'Hiérarchie de l\'Ordre',
    content: [
      {
        rank: 'Le Gardien Suprême',
        symbol: '⍟',
        description: 'Unique détenteur des secrets ultimes. Son identité est connue uniquement des Archontes.'
      },
      {
        rank: 'Les Archontes',
        symbol: '◈',
        description: 'Conseil des Sept. Ils guident l\'Ordre et protègent les mystères anciens.'
      },
      {
        rank: 'Les Initiés Majeurs',
        symbol: '⬡',
        description: 'Membres ayant accompli les Trois Épreuves. Accès aux archives secrètes.'
      },
      {
        rank: 'Les Initiés',
        symbol: '◇',
        description: 'Membres ayant prêté serment. Participent aux rites mensuels.'
      },
      {
        rank: 'Les Novices',
        symbol: '⋄',
        description: 'Nouveaux membres en période d\'observation. Durée: une année lunaire.'
      }
    ]
  },
  {
    id: 'oaths',
    icon: Star,
    title: 'Les Serments Sacrés',
    content: [
      {
        name: 'Le Serment du Silence',
        text: '"Par la lune qui voit tout et ne parle jamais, je jure de garder les secrets de l\'Ordre dans l\'ombre de mon cœur."'
      },
      {
        name: 'Le Serment de Fraternité',
        text: '"Frère ou sœur de l\'ombre, je te reconnais. Ton secret est le mien, ta cause est ma cause."'
      },
      {
        name: 'Le Serment d\'Obéissance',
        text: '"Aux Archontes et au Gardien, je soumets ma volonté, car leur sagesse éclaire le chemin dans les ténèbres."'
      }
    ]
  },
  {
    id: 'rules',
    icon: Shield,
    title: 'Les Sept Règles',
    content: [
      { number: 'I', rule: 'Ne jamais révéler l\'existence de l\'Ordre aux profanes.' },
      { number: 'II', rule: 'Répondre à l\'appel des Archontes dans les trois jours.' },
      { number: 'III', rule: 'Utiliser uniquement les méthodes de chiffrement approuvées.' },
      { number: 'IV', rule: 'Détruire tout message déchiffré après lecture.' },
      { number: 'V', rule: 'Assister aux rites de la nouvelle lune.' },
      { number: 'VI', rule: 'Porter le symbole de l\'Ordre en tout temps, mais de manière dissimulée.' },
      { number: 'VII', rule: 'Protéger un frère ou une sœur de l\'Ordre au péril de sa vie.' }
    ]
  },
  {
    id: 'rituals',
    icon: BookOpen,
    title: 'Rites & Cérémonies',
    content: [
      {
        name: 'Le Rite d\'Initiation',
        description: 'Cérémonie nocturne lors de la nouvelle lune. Le novice doit traverser les Trois Épreuves: le Silence, l\'Obscurité, et la Révélation.'
      },
      {
        name: 'L\'Assemblée Mensuelle',
        description: 'Réunion secrète des Initiés. Échange d\'informations chiffrées, récitation des serments, et mise à jour des Archives.'
      },
      {
        name: 'Le Jugement',
        description: 'Tribunal secret pour ceux ayant enfreint les Règles. Les Archontes décident du châtiment.'
      }
    ]
  }
];

export function DoctrineSection() {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Scroll className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="font-heading text-2xl tracking-wide">Doctrine de l'Ordre</h2>
        <p className="text-muted-foreground mt-2">
          Les textes sacrés qui régissent notre fraternité
        </p>
      </div>

      <Accordion type="single" collapsible className="space-y-4">
        {doctrineData.map((section) => (
          <AccordionItem 
            key={section.id} 
            value={section.id}
            className="ritual-card border-none"
          >
            <AccordionTrigger className="px-6 py-4 hover:no-underline group">
              <div className="flex items-center gap-4">
                <section.icon className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                <span className="font-heading tracking-wide">{section.title}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-4 pt-2">
                {section.id === 'hierarchy' && (
                  <div className="space-y-4">
                    {(section.content as Array<{rank: string; symbol: string; description: string}>).map((item, i) => (
                      <div key={i} className="doctrine-section">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="symbol-glyph text-lg">{item.symbol}</span>
                          <h4 className="font-heading text-foreground">{item.rank}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground ml-11">{item.description}</p>
                      </div>
                    ))}
                  </div>
                )}

                {section.id === 'oaths' && (
                  <div className="space-y-6">
                    {(section.content as Array<{name: string; text: string}>).map((oath, i) => (
                      <div key={i} className="doctrine-section">
                        <h4 className="font-heading text-foreground mb-2">{oath.name}</h4>
                        <blockquote className="text-muted-foreground italic border-l-2 border-accent/30 pl-4">
                          {oath.text}
                        </blockquote>
                      </div>
                    ))}
                  </div>
                )}

                {section.id === 'rules' && (
                  <div className="space-y-3">
                    {(section.content as Array<{number: string; rule: string}>).map((item, i) => (
                      <div key={i} className="flex gap-4 items-start doctrine-section">
                        <span className="font-heading text-accent min-w-[2rem]">{item.number}.</span>
                        <p className="text-muted-foreground">{item.rule}</p>
                      </div>
                    ))}
                  </div>
                )}

                {section.id === 'rituals' && (
                  <div className="space-y-4">
                    {(section.content as Array<{name: string; description: string}>).map((ritual, i) => (
                      <div key={i} className="doctrine-section">
                        <h4 className="font-heading text-foreground mb-1">{ritual.name}</h4>
                        <p className="text-sm text-muted-foreground">{ritual.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
