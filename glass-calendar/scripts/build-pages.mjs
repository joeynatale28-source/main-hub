// Prepare only the static Daylight assets for GitHub Pages.
// Server-only /api routes are intentionally not included.
import { readFile, copyFile, mkdir, rm, writeFile, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const out=join(root,'dist');
const html=await readFile(join(root,'index.html'),'utf8');
const paths=[...new Set([...html.matchAll(/(?:src|href)=["']\.\/([^"'?#]+)["']/g)].map(m=>m[1]))];
if(!paths.includes('app.js')||!paths.includes('wizard.js')||!paths.includes('accent.js'))throw Error('Daylight entrypoint assets missing');
await rm(out,{recursive:true,force:true});
await mkdir(out,{recursive:true});
await copyFile(join(root,'index.html'),join(out,'index.html'));
for(const path of paths){
  if(!/^[a-zA-Z0-9._-]+\.(css|js|svg|webmanifest)$/.test(path))throw Error('Unsafe or unexpected asset: '+path);
  const source=join(root,path);
  if(!(await stat(source)).isFile())throw Error('Missing asset '+path);
  await copyFile(source,join(out,path));
}
await writeFile(join(out,'.nojekyll'),'');
console.log('Prepared GitHub Pages: index.html plus '+paths.length+' assets');
