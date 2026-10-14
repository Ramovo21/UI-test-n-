// Optional browser QA dependency; keep the application itself buildless.
const { chromium } = require(process.env.OPD_PLAYWRIGHT_PATH || 'playwright-core');
const fs = require('node:fs');
const assert = require('node:assert/strict');
(async () => {
  fs.mkdirSync('artifacts', { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, acceptDownloads: true });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'artifacts/dashboard.png', fullPage: true });
  for (const route of ['patients','ai','simulation','wizard','users','logs','login']) {
    await page.goto('http://127.0.0.1:4173/#' + route);
    await page.waitForTimeout(200);
    assert(await page.locator('h1,h2').count() > 0, route + ' renders');
    await page.screenshot({ path: 'artifacts/' + route + '.png', fullPage: true });
  }
  await page.locator('[data-demo-role="Quản trị viên"]').click();
  await page.locator('.nav [data-action="patients"]').click();
  await page.locator('#patient-search').fill('Trần Văn Hùng');
  assert.equal(await page.locator('.patient-table tbody tr').count(), 1);
  await page.locator('[data-action="reset-filters"]').click();
  await page.locator('[data-status="Hoàn tất"]').click();
  assert.equal(await page.locator('.patient-table tbody tr').count(), 4);
  await page.locator('[data-action="reset-filters"]').click();
  await page.locator('[data-action="new-patient"]').click();
  await page.locator('[name="name"]').fill('Bệnh Nhân Kiểm Thử');
  await page.locator('[name="age"]').fill('35');
  await page.locator('[name="phone"]').fill('0901234567');
  await page.locator('#patient-form button[type="submit"]').click();
  await page.locator('.patient-table [data-patient]').first().click();
  await page.locator('[data-ui="drawer-full"]').click();
  await page.locator('[name="note"]').fill('Ghi chú kiểm thử lưu dữ liệu.');
  await page.locator('#note-form button').click();
  assert(await page.getByText('Ghi chú kiểm thử lưu dữ liệu.', { exact:true }).count() > 0);
  await page.locator('[data-complete]').click();
  assert(await page.getByText('1/21 hoạt động', { exact:true }).count() > 0);
  await page.locator('[data-action="detail-transfer"]').click();
  await page.locator('[name="room"]').selectOption({ label:'P.102 — Siêu âm' });
  await page.locator('[name="reason"]').fill('Cân bằng hàng đợi kiểm thử');
  await page.locator('#transfer-form button[type="submit"]').click();
  await page.reload();
  assert(await page.getByText('Ghi chú kiểm thử lưu dữ liệu.', { exact:true }).count() > 0);
  await page.locator('.nav [data-action="ai"]').click();
  await page.locator('[data-action="accept-ai"]').click();
  assert(await page.getByText('Đã chấp nhận', { exact:true }).count() > 0);
  await page.locator('[data-ai-index="1"]').click();
  if(await page.locator('[data-action="reject-ai"]').count()) {
    await page.locator('[data-action="reject-ai"]').click();
    await page.locator('[name="reason"]').fill('Không phù hợp chuyên khoa');
    await page.locator('#reject-form button[type="submit"]').click();
  }
  await page.locator('.nav [data-action="simulation"]').click();
  await page.locator('[data-action="run-sim"]').click();
  await page.waitForTimeout(800);
  await page.locator('[data-action="pause-sim"]').click();
  const progress=await page.locator('#sim-percent').innerText();
  await page.waitForTimeout(350);
  assert.equal(await page.locator('#sim-percent').innerText(), progress);
  await page.locator('[data-action="run-sim"]').click();
  await page.waitForTimeout(4500);
  assert.equal(await page.locator('#sim-percent').innerText(), '100%');
  const dl=page.waitForEvent('download');
  await page.locator('[data-action="export-sim"]').click();
  assert((await dl).suggestedFilename().endsWith('.csv'));
  await page.screenshot({ path:'artifacts/simulation-result.png', fullPage:true });
  await page.locator('.nav [data-action="wizard"]').click();
  for(let i=0;i<5;i++) { await page.locator('[name="wizard-answer"][value="0"]').check(); await page.locator('[data-action="wizard-next"]').click(); }
  assert(await page.getByText('Đã hoàn thành đánh giá', { exact:true }).count() > 0);
  await page.locator('.nav [data-action="users"]').click();
  await page.locator('[data-action="new-user"]').click();
  await page.locator('[name="name"]').fill('Người Dùng Kiểm Thử');
  await page.locator('[name="email"]').fill('test@demo.local');
  await page.locator('[name="department"]').fill('Khoa Nội');
  await page.locator('#user-form button[type="submit"]').click();
  await page.locator('#user-search').fill('Người Dùng Kiểm Thử');
  assert.equal(await page.locator('tbody').first().locator('tr').count(),1);
  await page.locator('#role-select').selectOption('Bác sĩ');
  await page.waitForTimeout(200);
  assert.equal(await page.locator('.nav [data-action="users"]').count(),0);
  const mobile=await context.newPage({ viewport:{width:390,height:844} });
  await mobile.setViewportSize({width:390,height:844});
  for(const route of ['dashboard','patients','ai','simulation','wizard','login']) {
    await mobile.goto('http://127.0.0.1:4173/#'+route);
    await mobile.waitForTimeout(150);
    const overflow=await mobile.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth);
    assert.equal(overflow,false,'mobile overflow: '+route);
    await mobile.screenshot({path:'artifacts/mobile-'+route+'.png',fullPage:true});
  }
  assert.deepEqual(errors,[]);
  console.log('PASS: routes, patient filters/create/progress/notes/transfer/persistence, AI accept/reject, simulation pause/resume/export, wizard, users, role visibility, mobile overflow, no runtime errors.');
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
