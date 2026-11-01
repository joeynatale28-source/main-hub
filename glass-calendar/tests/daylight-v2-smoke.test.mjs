import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../main.js',import.meta.url),'utf8');
test('loads the new manual account client instead of legacy Supabase Auth',()=>{
 assert.match(html,/daylight\./);assert.match(html,/\.\/main\.js/);
 assert.doesNotMatch(html,/v2-auth\.js|v1-shell\.js/);
 assert.match(js,/daylight-api/);assert.match(js,/auth_pin_unlock/);
});
test('public site excludes privileged keys and secrets',()=>{
 for(const secret of ['sb_secret_','service_role\"', 'daylight_owner_claim.txt']){
  assert.doesNotMatch(js,new RegExp(secret));assert.doesNotMatch(html,new RegExp(secret));
 }
});
test('main calendar views exist',()=>{
 for(const view of ['month','week','day','agenda'])assert.match(js,new RegExp(view));
});
