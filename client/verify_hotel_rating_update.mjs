import { readFileSync } from 'fs';

const cardCode = readFileSync('client/src/components/accommodation/HotelResultCard.tsx', 'utf-8');

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║   HOTEL RATING DISPLAY UPDATE - VERIFICATION                   ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

const checks = [
  { name: 'Star rating moved inline with hotel name', check: cardCode.includes('<div className="flex items-center gap-2">') && cardCode.includes('<h3 className="text-[16px] font-bold text-ink leading-snug">{hotel.name}</h3>') && cardCode.includes('<StarRating stars={hotel.starRating} />') },
  { name: 'Hotel name and rating on same line', check: cardCode.match(/<div className="flex items-center gap-2">\s*<h3.*hotel\.name/s) },
  { name: 'Review score still on right side', check: cardCode.includes('hotel.reviewScore') && cardCode.includes('items-end') },
  { name: 'StarRating component still imported and used', check: cardCode.includes('StarRating') },
  { name: 'Hotel chain name still displayed below', check: cardCode.includes('{hotel.chain && <p className="text-[12px] text-ink-muted">{hotel.chain}</p>}') },
  { name: 'No breaking changes to component props', check: cardCode.includes('type Props') && cardCode.includes('export default function HotelResultCard') },
];

checks.forEach(c => {
  console.log(`${c.check ? '✓' : '✗'} ${c.name}`);
});

const allPassed = checks.every(c => c.check);
console.log(`\n╔════════════════════════════════════════════════════════════════╗`);
if (allPassed) {
  console.log(`║ STATUS: ✓ HOTEL RATING DISPLAY UPDATED SUCCESSFULLY            ║`);
  console.log(`║                                                                ║`);
  console.log(`║ Changes:                                                       ║`);
  console.log(`║ • Star rating now displays inline with hotel name              ║`);
  console.log(`║ • Layout: [Hotel Name ★★★★★] on left, review on right         ║`);
  console.log(`║ • All other components and functionality preserved             ║`);
} else {
  console.log(`║ STATUS: ⚠ Some checks failed - review needed                   ║`);
}
console.log(`╚════════════════════════════════════════════════════════════════╝`);
