export type Suit = 'Wands' | 'Cups' | 'Swords' | 'Pentacles';
export interface TarotCard { id:number; name:string; arcana:'major'|'minor'; suit:Suit|null; rank:number; }
export interface DrawnCard extends TarotCard { reversed:boolean; }
export function buildCanonicalDeck(): TarotCard[];
export function secureRandomInt(maxExclusive:number):number;
export class TarotDeck {
 constructor(options?:{cardIds?:number[]});
 readonly remainingCount:number;
 draw():DrawnCard;
 draw(count:1):DrawnCard;
 draw(count:number):DrawnCard|DrawnCard[];
 drawAt(index:number):DrawnCard;
 getRemainingCards():TarotCard[];
 getDrawnCards():DrawnCard[];
}
