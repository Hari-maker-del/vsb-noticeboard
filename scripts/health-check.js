const base=String(process.env.SERVICE_URL||'http://127.0.0.1:5000').replace(/\/$/,'');
const endpoint=process.env.HEALTHCHECK_PATH||'/api/health';
const timeoutMs=Math.max(1000,Number(process.env.HEALTHCHECK_TIMEOUT_MS||10000));
const requireDurable=String(process.env.REQUIRE_DURABLE_PERSISTENCE||'false').toLowerCase()==='true';
const controller=new AbortController();
const timer=setTimeout(()=>controller.abort(),timeoutMs);
(async()=>{
  try{
    const started=Date.now();
    const response=await fetch(base+endpoint,{signal:controller.signal,headers:{'user-agent':'vsb-noticeboard-healthcheck/1.0'}});
    const body=await response.json().catch(()=>({}));
    const latency=Date.now()-started;
    if(!response.ok||body.ok!==true)throw new Error('Health endpoint failed with HTTP '+response.status);
    if(requireDurable&&body.persistence?.ready!==true)throw new Error('Durable production dependencies are not ready');
    console.log(JSON.stringify({ok:true,url:base+endpoint,status:response.status,latency_ms:latency,database:body.database||null,storage:body.storage||null,persistence_ready:body.persistence?.ready??null,timestamp:new Date().toISOString()}));
  }catch(e){
    console.error(JSON.stringify({ok:false,url:base+endpoint,error:e.name==='AbortError'?'Health check timed out':e.message,timestamp:new Date().toISOString()}));
    process.exitCode=1;
  }finally{
    clearTimeout(timer);
  }
})();