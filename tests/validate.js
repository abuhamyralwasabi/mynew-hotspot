const fs = require('fs');
const vm = require('vm');
const path = require('path');

const root = path.resolve(__dirname, '..');
const configSource = fs.readFileSync(path.join(root, 'hotspot', 'config.js'), 'utf8');
const context = { window: {} };
vm.createContext(context);
vm.runInContext(configSource, context, { filename: 'hotspot/config.js' });
const config = context.window.NETPRO_CONFIG;
const errors = [];
if (!config || !config.network || !config.network.name) errors.push('network.name is required');
if (!config.network.logo) errors.push('network.logo is required');
if (!Array.isArray(config.speeds) || !config.speeds.length) errors.push('speeds must be non-empty');
const seen = new Set();
for (const speed of config.speeds || []) {
  if (!/^[0-9]+[KMG]$/.test(speed.value || '')) errors.push('Invalid speed value: ' + speed.value);
  if (seen.has(speed.value)) errors.push('Duplicate speed: ' + speed.value);
  seen.add(speed.value);
  if (!speed.upload || !speed.download) errors.push('Missing upload/download for: ' + speed.value);
}
if (config.defaultSpeed && !seen.has(config.defaultSpeed)) errors.push('defaultSpeed is not present in speeds');
if (config.defaultSpeed !== '1M') errors.push('defaultSpeed must be 1M (سرعة عادية)');
if (!config.router || config.router.dynamicSpeedProfile !== 'NETPRO-SPEED') errors.push('router dynamic speed profile mismatch');
for (const file of fs.readdirSync(path.join(root, 'hotspot', 'js'))) {
  if (!file.endsWith('.js')) continue;
  const source = fs.readFileSync(path.join(root, 'hotspot', 'js', file), 'utf8');
  try { new Function(source); } catch (e) { errors.push(file + ': JS syntax error: ' + e.message); }
}
const htmlFiles = ['login.html','status.html','logout.html','alogin.html','prices.html','redirect.html','rlogin.html','block.html','error.html'];
for (const file of htmlFiles) {
  const p = path.join(root, 'hotspot', file);
  if (!fs.existsSync(p)) errors.push('Missing HotSpot page: ' + file);
  else if (file === 'login.html') {
    const html = fs.readFileSync(p, 'utf8');
    if (!html.includes('name="domain"')) errors.push('login.html does not submit domain');
    if (!html.includes('js/md5.js')) errors.push('login.html missing md5.js');
    if (!html.includes('js/auth.js') || !html.includes('js/speed-picker.js')) errors.push('login.html missing shared auth/speed modules');
    if (html.includes('performanceToggle')) errors.push('performance mode control must be removed');
    if (!html.includes('js/speed-picker.js')) errors.push('login.html missing speed-picker.js');

  }
}
for (const required of ['auth.js','speed-picker.js']) {
  if (!fs.existsSync(path.join(root,'hotspot','js',required))) errors.push('Missing shared module: ' + required);
}
const app = fs.readFileSync(path.join(root,'hotspot/js/app.js'),'utf8');
if (app.includes('function speeds(') || app.includes('HS_RENDER')) errors.push('app.js still contains duplicate speed picker logic');
if (!app.includes('data-package-cards') || !app.includes('package-card-title') || !app.includes('package-field-label')) errors.push('app.js package card renderer is incomplete');
const statusHtml = fs.readFileSync(path.join(root,'hotspot/status.html'),'utf8');
if (!statusHtml.includes('js/speed-picker.js')) errors.push('status.html missing speed-picker.js');
if (!statusHtml.includes('data-speed-trigger') || !statusHtml.includes('data-speed-menu')) errors.push('status.html speed picker markup is incomplete');
if (app.includes('NetPro-Logo.png')) errors.push('app.js references missing PNG logo');
if (!fs.existsSync(path.join(root,'hotspot/imgs/NetPro-Logo.svg'))) errors.push('SVG logo asset missing');
const speed2 = fs.readFileSync(path.join(root,'routeros/speed2.rsc'),'utf8');
for (const speed of config.speeds || []) { if (!speed2.includes('"' + speed.value + '"')) errors.push('speed2.rsc missing speed ' + speed.value); }
if (!speed2.includes('/ip hotspot active') || !speed2.includes('/queue simple add')) errors.push('speed2.rsc missing expected operations');
const loginJs = fs.readFileSync(path.join(root,'hotspot/js/login.js'),'utf8');
if (!loginJs.includes('NETPRO_AUTH') || !loginJs.includes('autoAttempted')) errors.push('login.js missing shared auto-login engine');
if (loginJs.includes('performanceToggle')) errors.push('login.js still references performance mode');
if (!loginJs.includes('startAutoLogin') || !loginJs.includes('startPendingReauth')) errors.push('login.js missing auto-login paths');

const pickerJs = fs.readFileSync(path.join(root,'hotspot/js/speed-picker.js'),'utf8');
if (pickerJs.includes('netproSpeedPortal') || pickerJs.includes('speed-picker-portal')) errors.push('speed picker must use the local menu, not a detached portal');
if (!pickerJs.includes("wrapper.querySelector('[data-speed-menu]')")) errors.push('speed picker must bind the local menu element');
if (!pickerJs.includes("esc(item.label || item.value)")) errors.push('speed picker option labels are missing');
if (!pickerJs.includes('select.value = fallbackSpeed();')) errors.push('speed picker must explicitly initialize the configured default speed');
if (pickerJs.includes('</span><b dir="ltr">')) errors.push('speed picker must not render numeric values beside labels');

const configAuth = config && config.auth;
if (!configAuth || configAuth.passwordMode !== 'blank') errors.push('auth.passwordMode must be blank for NetPro card accounts');
const loginSource = fs.readFileSync(path.join(root,'hotspot/js/login.js'),'utf8');
if (!loginSource.includes('credentialPassword') || !loginSource.includes('renderLoginError') || !loginSource.includes('hs_error')) errors.push('login.js card auth/error handling is incomplete');
const ui = fs.readFileSync(path.join(root,'hotspot/js/ui-utils.js'),'utf8');
if (!ui.includes('invalid username or password') || !ui.includes('already authorizing')) errors.push('ui-utils.js must map core RouterOS authentication errors');
const blocker = fs.readFileSync(path.join(root,'hotspot/js/hot-blocker.js'),'utf8');
if (!blocker.includes('isTransientError')) errors.push('hot-blocker.js must ignore transient authorization errors');
if (!fs.existsSync(path.join(root,'hotspot','flogin.html'))) errors.push('Missing canonical HotSpot failure page: flogin.html');

const serverProfile = fs.readFileSync(path.join(root,'routeros/netpro-hotspot-server-profile.rsc'),'utf8');
if (!serverProfile.includes('split-user-domain=yes')) errors.push('unified Server Profile must enable split-user-domain=yes');

if (!fs.existsSync(path.join(root,'routeros/netpro-test-user.rsc'))) errors.push('Missing NetPro disposable test-user script');

const floginSource = fs.readFileSync(path.join(root,'hotspot/flogin.html'),'utf8');
if (!floginSource.includes('login-error="$(error)"')) errors.push('flogin.html must expose RouterOS error to hot-blocker');
if (!floginSource.includes('prepareFallback') || !floginSource.includes('hs_dual_fallback=1')) errors.push('flogin.html must implement dual-auth fallback handoff');

const loginHtmlFinal = fs.readFileSync(path.join(root,'hotspot/login.html'),'utf8');
if (!loginHtmlFinal.includes('id="routerErrorSource"')) errors.push('login.html must carry RouterOS error in a text node');

const blockerDual = fs.readFileSync(path.join(root,'hotspot/js/hot-blocker.js'),'utf8');
if (!blockerDual.includes('isDualAuthFallback') || !blockerDual.includes('window.NETPRO_AUTH')) errors.push('hot-blocker.js must ignore deliberate dual-auth fallback');

const aloginSource = fs.readFileSync(path.join(root,'hotspot/alogin.html'),'utf8');
if (!aloginSource.includes('js/hot-blocker.js') || !aloginSource.includes('rememberSuccess(card, selectedSpeed, source)')) errors.push('alogin.html must persist auth source and clear blocker');

const cleanupSource = fs.readFileSync(path.join(root,'routeros/speed2-cleanup-on-logout.rsc'),'utf8');
if (!cleanupSource.includes('NETPRO-" . $ip') || !cleanupSource.includes('NetProSpeed')) errors.push('on-logout cleanup must remove the current NetPro queue');

if (!configAuth || configAuth.dualAuth !== true || configAuth.localFallback !== true) errors.push('config auth dual-auth flags are incomplete');

const testUserSource = fs.readFileSync(path.join(root,'routeros/netpro-test-user.rsc'),'utf8');
if (!testUserSource.includes('password=""')) errors.push('test user must use a blank password');

const loginTransport = fs.readFileSync(path.join(root,'hotspot/js/login.js'),'utf8');
if (!loginTransport.includes('dualAuthEnabled') || !loginTransport.includes('prepareAttempt')) errors.push('login.js dual-auth engine is incomplete');
if (!loginTransport.includes('allowFallback: false')) errors.push('login.js must prevent fallback loops');
if (!loginTransport.includes('hs_dual_fallback')) errors.push('login.js must support the dual-auth fallback handoff');
if (!loginTransport.includes('function handoffFallback(error)')) errors.push('login.js must handle RouterOS errors returned directly to login.html');
if (!loginTransport.includes('!isDualFallback && handoffFallback(ctx.error || queryValue(\'hs_error\'))')) errors.push('login.js must hand off initial authentication errors to the opposite source');
if (!loginTransport.includes('mode: attempt.mode,\n        allowFallback: false')) errors.push('login.js replayAttempt must disable a second fallback loop');
if (!loginTransport.includes('mode === \'radius\' && radiusEnabled()')) errors.push('login.js must suppress domain transport on local-only routers');
const speedTransport = fs.readFileSync(path.join(root,'routeros/speed2.rsc'),'utf8');
if (!speedTransport.includes('domain unavailable or invalid')) errors.push('speed2.rsc must keep an explicit domain fallback log');
if (!speedTransport.includes('>= 11 && [:pick $qComment 0 11]')) errors.push('speed2.rsc NetPro queue prefix detection is incorrect');

const statusFinal = fs.readFileSync(path.join(root,'hotspot/status.html'),'utf8');
if (!statusFinal.includes('js/auth.js')) errors.push('status.html must load shared auth state');
if (!statusFinal.includes('id="authSource"')) errors.push('status.html must expose auth source');
if (!statusFinal.includes('id="speedChangeNote"')) errors.push('status.html must explain local speed limitations');
if (!statusFinal.includes('netpro-final=1') || !statusFinal.includes('erase-cookie=on')) errors.push('status.html final logout action is incomplete');
if (!statusFinal.includes('تسجيل الخروج نهائيًا من الكرت الحالي')) errors.push('status.html final logout label is missing');

const logoutSourceFinal = fs.readFileSync(path.join(root,'hotspot/js/logout.js'),'utf8');
if (!logoutSourceFinal.includes("query('netpro-final') === '1'") || !logoutSourceFinal.includes('finalLogout')) errors.push('logout.js final logout path is incomplete');
if (!logoutSourceFinal.includes('usernameHint')) errors.push('logout.js must pass current username to finalLogout');

const authSourceFinal = fs.readFileSync(path.join(root,'hotspot/js/auth.js'),'utf8');
if (!authSourceFinal.includes('function finalLogout(')) errors.push('auth.js missing finalLogout');
if (!authSourceFinal.includes('function prepareFallback(') || !authSourceFinal.includes('function shouldFallback(')) errors.push('auth.js dual-auth fallback engine is incomplete');
if (!authSourceFinal.includes('source: normalizedSource')) errors.push('auth.js must persist the successful auth source');
if (!authSourceFinal.includes("localStorage.removeItem(STATE_KEY)")) errors.push('finalLogout must clear auth state');

const statusJsFinal = fs.readFileSync(path.join(root,'hotspot/js/status.js'),'utf8');
for (const marker of ['ctx.ip','ctx.mac','ctx.loginBy','ctx.interfaceName','ctx.vlanId','ctx.bytesIn','ctx.bytesOut','ctx.limitBytesTotal','ctx.remainBytesTotal','ctx.uptime','ctx.sessionTimeLeft']) {
  if (!statusJsFinal.includes(marker)) errors.push('status.js missing RouterOS field: '+marker);
}

const cssFinal = fs.readFileSync(path.join(root,'hotspot/css/main.css'),'utf8');
if (!cssFinal.includes('.service-features{grid-template-columns:repeat(2,minmax(0,1fr))}')) errors.push('service cards must remain two columns');
if (!cssFinal.includes('.package-cards{display:none')) errors.push('package cards must be hidden on larger screens');
if (!cssFinal.includes('.table-container table{display:none}')) errors.push('package table must be hidden on small screens');
if (!cssFinal.includes('.speed-option{justify-content:center!important;text-align:center!important}')) errors.push('speed picker options must be centered');
if (!cssFinal.includes('.speed-option b{display:none!important}')) errors.push('speed picker numeric values must remain hidden');

console.log('=== Final validation ===');
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('NetPro validation passed:', config.speeds.length, 'speeds; all JS syntax checks passed.');
