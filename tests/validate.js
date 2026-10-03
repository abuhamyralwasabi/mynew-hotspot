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

if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('NetPro validation passed:', config.speeds.length, 'speeds; all JS syntax checks passed.');
const pickerJs = fs.readFileSync(path.join(root,'hotspot/js/speed-picker.js'),'utf8');
if (pickerJs.includes('netproSpeedPortal') || pickerJs.includes('speed-picker-portal')) errors.push('speed picker must use the local menu, not a detached portal');
if (!pickerJs.includes("wrapper.querySelector('[data-speed-menu]')")) errors.push('speed picker must bind the local menu element');

const configAuth = config && config.auth;
if (!configAuth || configAuth.passwordMode !== 'username') errors.push('auth.passwordMode must be username for the one-field card portal');
const loginSource = fs.readFileSync(path.join(root,'hotspot/js/login.js'),'utf8');
if (!loginSource.includes('credentialPassword') || !loginSource.includes('renderLoginError') || !loginSource.includes('hs_error')) errors.push('login.js card auth/error handling is incomplete');
const ui = fs.readFileSync(path.join(root,'hotspot/js/ui-utils.js'),'utf8');
if (!ui.includes('invalid username or password') || !ui.includes('already authorizing')) errors.push('ui-utils.js must map core RouterOS authentication errors');
const blocker = fs.readFileSync(path.join(root,'hotspot/js/hot-blocker.js'),'utf8');
if (!blocker.includes('isTransientError')) errors.push('hot-blocker.js must ignore transient authorization errors');
if (!fs.existsSync(path.join(root,'hotspot','flogin.html'))) errors.push('Missing canonical HotSpot failure page: flogin.html');
