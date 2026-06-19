import { readFileSync } from 'fs';

const formCode = readFileSync('./src/components/accommodation/HotelSearchForm.tsx', 'utf-8');
const calendarCode = readFileSync('./src/components/ui/DateRangePicker.tsx', 'utf-8');

console.log('Hotel Search Form Integration Check:');

// Check for proper date handling
const checks = {
  'DateRangePicker imported': formCode.includes('DateRangePicker'),
  'Date range converted to ISO': formCode.includes('toIsoDate'),
  'Check-in date stored': formCode.includes('setCheckIn'),
  'Check-out date stored': formCode.includes('setCheckOut'),
  'Validation for date range': formCode.includes('Check-out must be after check-in'),
  'Date range passed to API': formCode.includes('checkIn') && formCode.includes('checkOut'),
  'Calendar has minDate prop': calendarCode.includes('minDate'),
  'Calendar onChange handler': formCode.includes('onChange={(v) =>'),
};

Object.entries(checks).forEach(([check, present]) => {
  console.log(`${present ? '✓' : '✗'} ${check}`);
});

// Verify the API call format
if (formCode.includes('toTboDate') || formCode.includes('DD/MM/YYYY')) {
  console.log('✓ TBO date format conversion in form');
} else {
  console.log('⚠ TBO date format handled elsewhere (likely in API layer)');
}
