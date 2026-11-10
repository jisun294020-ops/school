const { chromium } = require('playwright'); const specs=require(process.argv[3]);
(async()=>{ const b=await chromium.launch();
 for(const sp of specs){ const p=await b.newPage({deviceScaleFactor:2,viewport:{width:1500,height:1200}});
  await p.goto('file://'+process.argv[2]); await p.evaluate(s=>render(s),sp);
  await (await p.$('#cap')).screenshot({path:process.argv[4]+'/'+sp.file+'.png',omitBackground:true}); await p.close(); }
 await b.close(); console.log('done'); })();
