const {chromium}=require(process.env.OPD_PLAYWRIGHT_PATH||'playwright-core');
const assert=require('node:assert/strict');const fs=require('node:fs');
(async()=>{
 fs.mkdirSync('artifacts/operations',{recursive:true});
 const browser=await chromium.launch({headless:true});
 try{
 const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});const p=await context.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
 await p.screenshot({path:'artifacts/operations/dashboard.png',fullPage:true});
 assert.equal(await p.locator('.ops-metric>strong').first().innerText(),'24');
 for(const route of ['patients','detail','ai','simulation','wizard','users','logs','login']){
  await p.goto('http://127.0.0.1:4173/#'+route);await p.waitForFunction(r=>document.body.dataset.page===r,route);
  assert(!/\bdemo\b/i.test(await p.locator('body').innerText()),'visible demo label: '+route);
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'desktop overflow '+route);
  if(['login','patients'].includes(route))await p.screenshot({path:'artifacts/operations/'+route+'.png',fullPage:true});
 }
 await p.goto('http://127.0.0.1:4173/#dashboard');await p.locator('.ops-metric').first().waitFor();
 const expected=await p.evaluate(()=>operationalData().overdue.length);
 await p.locator('[data-ops="overdue"]').click();await p.locator('.premium-table').waitFor();
 assert.equal(await p.locator('.premium-table tbody tr').count(),Math.min(10,expected));
 await p.goto('http://127.0.0.1:4173/#dashboard');await p.locator('.ops-metric').first().waitFor();
 await p.locator('.ops-context [data-action="new-patient"]').click();
 await p.locator('[name="name"]').fill('Hồ Sơ Kiểm Tra');await p.locator('[name="age"]').fill('40');await p.locator('[name="phone"]').fill('0901234567');
 await p.locator('#patient-form button[type="submit"]').click();
 assert.equal(await p.locator('.ops-metric>strong').first().innerText(),'25');
 await p.reload();assert.equal(await p.locator('.ops-metric>strong').first().innerText(),'25');
 const dl=p.waitForEvent('download');await p.locator('[data-action="export-dashboard"]').click();const download=await dl;await download.saveAs('artifacts/operations/report.csv');
 const csv=fs.readFileSync('artifacts/operations/report.csv','utf8');assert(csv.includes('"Tổng lượt tiếp nhận","25"'));assert(!csv.includes('1248'));
 await p.locator('.ops-about').click();await p.locator('.system-info').waitFor();assert((await p.locator('.system-info').innerText()).includes('chưa tích hợp mô hình AI'));await p.keyboard.press('Escape');
 await p.locator('.ops-room').first().click();await p.locator('.premium-table').waitFor();assert.notEqual(await p.locator('#patient-dept').inputValue(),'Tất cả');
 for(const width of [390,768,1024]){
  await p.setViewportSize({width,height:900});
  for(const route of ['dashboard','patients','login']){await p.goto('http://127.0.0.1:4173/#'+route);await p.waitForFunction(r=>document.body.dataset.page===r,route);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'overflow '+width+' '+route);if(width===390)await p.screenshot({path:'artifacts/operations/mobile-'+route+'.png',fullPage:true});}
 }
 assert.deepEqual(errors,[]);console.log('PASS: no visible demo labels, operational counts, intake updates/reload, matching CSV, overdue and room filters, system information, responsive layouts.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
