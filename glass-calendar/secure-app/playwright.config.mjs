import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./tests',timeout:15000,retries:0,workers:4,reporter:'list',
 use:{baseURL:'http://127.0.0.1:4173/main-hub/glass-calendar/secure-app/',browserName:'chromium',channel:'chrome',viewport:{width:1440,height:900},headless:true},
 webServer:{command:'npm run dev -- --host 127.0.0.1 --port 4173',url:'http://127.0.0.1:4173/main-hub/glass-calendar/secure-app/',reuseExistingServer:false,timeout:30000,env:{VITE_SUPABASE_URL:'https://mock.supabase.co',VITE_SUPABASE_ANON_KEY:'public-test-key'}}
});
