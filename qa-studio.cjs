const {chromium}=require(process.env.OPD_PLAYWRIGHT_PATH||'playwright-core');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 fs.mkdirSync('artifacts/v2',{recursive:true});
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});
  const p=await context.newPage(); const errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
  await p.screenshot({path:'artifacts/v2/dashboard.png',fullPage:true});
  for(const route of ['patients','ai','simulation','wizard','users','logs','login']){
   await p.goto('http://127.0.0.1:4173/#'+route);await p.waitForTimeout(350);
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'desktop overflow '+route);
   await p.screenshot({path:'artifacts/v2/'+route+'.png',fullPage:true});
  }
  await p.goto('http://127.0.0.1:4173/#patients');
  await p.locator('#patient-search').fill('Trần Văn Hùng');
  assert.equal(await p.locator('.premium-table tbody tr').count(),1);
  await p.locator('[data-patient]').first().click();
  assert.equal(await p.locator('#drawer-title').innerText(),'Trần Văn Hùng');
  assert.equal(await p.evaluate(()=>document.querySelector('#app').inert),true);
  await p.screenshot({path:'artifacts/v2/drawer.png',fullPage:true});
  await p.locator('#drawer-note').fill('Ghi chú kiểm thử giao diện mới.');
  await p.locator('#drawer-note-form button').click();
  assert(await p.getByText('Ghi chú kiểm thử giao diện mới.',{exact:true}).count());
  await p.locator('[data-ui="drawer-complete"]').click();
  assert(await p.getByText('13/21 hoạt động',{exact:true}).count());
  await p.locator('[data-ui="drawer-transfer"]').click();
  await p.locator('.modal [name="room"]').selectOption('P.102 — Siêu âm');
  await p.locator('.modal [name="reason"]').fill('Kiểm tra chuyển phòng từ panel hồ sơ');
  await p.locator('#transfer-form button[type="submit"]').click();
  assert.equal(await p.locator('#drawer-title').innerText(),'Trần Văn Hùng');
  assert(await p.locator('.drawer-metrics').getByText('P.102',{exact:true}).count());
  await p.keyboard.press('Escape');
  assert.equal(await p.locator('#drawer-root').count(),0);
  assert.equal(await p.locator('#patient-search').inputValue(),'Trần Văn Hùng');
  await p.reload();
  assert.equal(await p.locator('#patient-search').inputValue(),'Trần Văn Hùng');
  await p.locator('[data-action="reset-filters"]').click();
  await p.locator('#patient-search').fill('tran van hung');
  assert.equal(await p.locator('.premium-table tbody tr').count(),1,'accent-insensitive search');
  await p.locator('[data-action="reset-filters"]').click();
  await p.locator('[data-quick="long"]').click();
  assert((await p.locator('.premium-table .wait-time strong').allTextContents()).every(x=>Number(x)>30));
  await p.locator('[data-action="reset-filters"]').click();
  await p.locator('[data-ui="density"]').click();
  assert(await p.locator('.compact-density').count());
  await p.keyboard.press('Control+k');
  await p.locator('#command-input').fill('Trần Văn Hùng');
  await p.keyboard.press('ArrowDown'); await p.keyboard.press('Enter');
  assert.equal(await p.locator('#drawer-title').innerText(),'Trần Văn Hùng');
  await p.keyboard.press('Escape');
  await p.keyboard.press('Control+k');
  await p.locator('#command-input').fill('Mô phỏng');
  // Search routes by their displayed title.
  await p.locator('#command-input').fill('Simulation');
  await p.keyboard.press('Enter');
  await p.waitForURL('**/#simulation');
  await p.locator('[data-action="run-sim"]').click();await p.waitForTimeout(4500);
  assert.equal(await p.locator('#sim-percent').innerText(),'100%');
  await p.locator('.sidebar-preferences').click();
  await p.locator('#motion-setting').check();
  assert.equal(await p.evaluate(()=>document.documentElement.classList.contains('reduce-motion')),true);
  await p.keyboard.press('Escape');
  assert.equal(await p.evaluate(()=>document.querySelector('#app').inert),false);
  await p.goto('http://127.0.0.1:4173/#patients');
  await p.locator('[data-patient]').first().click();
  await p.locator('[data-ui="drawer-full"]').click();
  await p.waitForURL('**/#detail');
  await p.locator('#note-form').waitFor({state:'visible'});
  assert(await p.locator('#note-form').count());
  const mobile=await context.newPage();await mobile.setViewportSize({width:390,height:844});
  for(const route of ['dashboard','patients','detail','ai','simulation','wizard','users','logs','login']){
   await mobile.goto('http://127.0.0.1:4173/#'+route);await mobile.waitForTimeout(250);
   const overflow=await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
   if(overflow)console.log('OVERFLOW',route,await mobile.evaluate(()=>[...document.querySelectorAll('*')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).map(e=>[e.tagName,e.className,e.getBoundingClientRect().width]).slice(0,20)));
   assert.equal(overflow,false,'mobile overflow '+route);
   await mobile.screenshot({path:'artifacts/v2/mobile-'+route+'.png',fullPage:true});
  }
  await mobile.goto('http://127.0.0.1:4173/#patients');
  await mobile.locator('[data-patient]').first().click();
  assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'drawer overflow');
  await mobile.screenshot({path:'artifacts/v2/mobile-drawer.png',fullPage:true});
  await mobile.keyboard.press('Escape');
  await mobile.locator('.mobile-toggle').click();
  assert(await mobile.locator('body.menu-open').count());
  await mobile.locator('.mobile-scrim').click({position:{x:350,y:400}});
  assert.equal(await mobile.locator('body.menu-open').count(),0);
  await mobile.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await mobile.evaluate(()=>document.documentElement.classList.contains('reduce-motion')),true);
  for(const width of [360,768,1024]){
   await mobile.setViewportSize({width,height:900});
   for(const route of ['dashboard','patients','ai','simulation','wizard','users','login']){
    await mobile.goto('http://127.0.0.1:4173/#'+route);
    await mobile.waitForFunction(route=>document.body.dataset.page===route,route);
    assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'overflow '+width+' '+route);
   }
  }
  assert.deepEqual(errors,[]);
  console.log('PASS v2: all routes, drawer notes/progress/transfer, focus/inert, preserved filters, quick filters, compact table, keyboard palette, simulation, reduced motion, full detail, mobile menu and no overflow.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
