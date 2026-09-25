const {spawnSync}=require('child_process');

const result=spawnSync(process.platform==='win32'?'npm.cmd':'npm',['audit','--omit=dev','--audit-level=critical','--json'],{encoding:'utf8'});
const raw=(result.stdout||'').trim();
let report;
try{report=JSON.parse(raw)}catch(e){console.error(raw||result.stderr||e.message);process.exit(result.status||1)}
const critical=Object.entries(report.vulnerabilities||{}).filter(([,v])=>v.severity==='critical');
const allowlist=['tar'];
const unexpected=critical.filter(([name])=>!allowlist.includes(name));
for(const [name,v] of critical){
  if(allowlist.includes(name)){
    console.warn('[security-audit] allowed build-time transitive critical advisory for '+name+'; this is the known sqlite3 5.x/node-gyp dependency chain. Keep sqlite3 pinned to a Render-compatible 5.x release and revisit when the deployment runtime supports sqlite3 6.x.');
  }else{
    console.error('[security-audit] critical vulnerability in '+name);
    console.error(JSON.stringify(v,null,2));
  }
}
if(unexpected.length)process.exit(1);
console.log('[security-audit] no unreviewed critical vulnerabilities found.');
