import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Hotel results
  await page.goto('http://localhost:3000/hotel/results?city=DEL&checkIn=2025-06-15&checkOut=2025-06-17&rooms=1&adults=2');
  await page.waitForLoadState('networkidle');
  
  // Check sidebar sticky element
  const hotelSidebar = await page.locator('aside .sticky').first();
  const hotelStyle = await hotelSidebar.evaluate(el => ({
    position: getComputedStyle(el).position,
    top: getComputedStyle(el).top,
    display: getComputedStyle(el).display,
  }));
  
  console.log('Hotel sidebar sticky:', hotelStyle);
  
  // Flight results
  await page.goto('http://localhost:3000/flight/results?from=DEL&to=BOM&depart=2025-06-15&adults=1');
  await page.waitForLoadState('networkidle');
  
  const flightSidebar = await page.locator('aside.sticky').first();
  const flightStyle = await flightSidebar.evaluate(el => ({
    position: getComputedStyle(el).position,
    top: getComputedStyle(el).top,
    display: getComputedStyle(el).display,
    alignSelf: getComputedStyle(el).alignSelf,
  }));
  
  console.log('Flight sidebar sticky:', flightStyle);
  
  // Check fare calendar
  const fareCalendar = await page.locator('[role="list"][aria-label*="Fare calendar"]');
  const fareStyle = await fareCalendar.evaluate(el => ({
    position: getComputedStyle(el).position,
    overflow: getComputedStyle(el).overflow,
  }));
  
  console.log('Fare calendar:', fareStyle);
  
  await browser.close();
})();
