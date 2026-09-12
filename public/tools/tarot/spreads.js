const row = (labels) => labels.map((label, i) => ({ key: label.toLowerCase().replaceAll(' ', '-'), label, x: i, y: 0 }));
export const SPREADS = [
  { id: 'one', name: 'One Card', description: 'A little clarity for the path ahead.', positions: row(['One Card']) },
  { id: 'two', name: 'Two Cards · Situation & Advice', description: 'See the moment, and a way to meet it.', positions: row(['Situation', 'Advice']) },
  { id: 'past-present-future', name: 'Past · Present · Future', description: 'Where you have been. Where you are. What may unfold.', positions: row(['Past', 'Present', 'Future']) },
  { id: 'situation-advice-outcome', name: 'Situation · Advice · Outcome', description: 'Meet the moment with a different perspective.', positions: row(['Situation', 'Advice', 'Outcome']) },
  { id: 'relationship', name: 'The Relationship', description: 'Two perspectives, and the space between.', positions: row(['Self', 'Other', 'Relationship']) },
  { id: 'five', name: 'The Five Card Spread', description: 'Look beneath the surface. Find a way forward.', positions: row(['Situation', 'Obstacle', 'Hidden Influence', 'Advice', 'Outcome']) },
  { id: 'celtic-cross', name: 'The Celtic Cross', description: 'A fuller picture of the forces around you.', layout: 'cross', positions: [
    { key: 'present', label: 'Present', x: 1, y: 1 },
    { key: 'challenge', label: 'Challenge', x: 1, y: 1, angle: 90 },
    { key: 'foundation', label: 'Foundation', x: 1, y: 2 },
    { key: 'past', label: 'Past', x: 0, y: 1 },
    { key: 'possibility', label: 'Possibility', x: 1, y: 0 },
    { key: 'future', label: 'Near Future', x: 2, y: 1 },
    { key: 'self', label: 'Self', x: 3.5, y: 2.7 },
    { key: 'environment', label: 'Environment', x: 3.5, y: 1.8 },
    { key: 'hopes', label: 'Hopes & Fears', x: 3.5, y: 0.9 },
    { key: 'outcome', label: 'Outcome', x: 3.5, y: 0 },
  ] },
].map(spread => ({ ...spread, cardCount: spread.positions.length }));
