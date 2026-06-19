import { readFileSync } from 'fs';

const calendarCode = readFileSync('./src/components/ui/DateRangePicker.tsx', 'utf-8');

// Check for TBO-style calendar features
const features = {
  'Two-month display': calendarCode.includes('grid-cols-2') || calendarCode.includes('gap-6'),
  'Date range highlighting': calendarCode.includes('inRange'),
  'Start/end date styling': calendarCode.includes('isFrom') && calendarCode.includes('isTo'),
  'Navigation arrows': calendarCode.includes('Previous month') || calendarCode.includes('Next month'),
  'Min date validation': calendarCode.includes('minDate') || calendarCode.includes('min'),
  'Portal overlay': calendarCode.includes('createPortal'),
  'Keyboard support': calendarCode.includes('onKey') && calendarCode.includes('Escape'),
  'Month/year display': calendarCode.includes('MONTHS_FULL'),
};

console.log('TBO-style Calendar Feature Check:');
Object.entries(features).forEach(([feature, present]) => {
  console.log(`${present ? '✓' : '✗'} ${feature}`);
});

// Check for proper date formatting
if (calendarCode.includes('toIsoDate')) {
  console.log('✓ ISO date formatting available');
}

// Check for TBO date format conversion
if (calendarCode.includes('DD/MM/YYYY')) {
  console.log('✓ TBO date format (DD/MM/YYYY) handling');
} else {
  console.log('⚠ TBO date format handling not found in calendar component');
}
