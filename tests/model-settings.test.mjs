import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {apply} from '../host.mjs';

test('manual model and effort reach native selection; native rejection is never accepted',async()=>{
  await mkdir(resolve('.tmp'),{recursive:true});
  const root=await mkdtemp(resolve('.tmp/manual-model-')),disposers=[],calls=[];
  try{
    const endpoint=join(root,'endpoint.json'),configPath=join(root,'connection.json');
    await writeFile(configPath,JSON.stringify({token:'test-token',endpoint}));
    let reject=false,mismatch=false,catalogUnavailable=false;
    const ctx={
      sessionController:{
        list:async()=>({items:[{sessionId:'test-session',running:false,cwd:root,projections:{values:{modelSelection:{next:{provider:'custom',model:'old'}}}}}]}),
        modelCatalog:async()=>{if(catalogUnavailable)throw Error('catalog unavailable');return {groups:[],default:{provider:'custom',model:'old'}};},
        selectModel:async input=>{calls.push(input);if(reject)throw Error('native model unavailable');return {selected:mismatch?{...input,model:'different'}:input};},
      },
      permissionPresets:{catalog:()=>({defaultPreset:'default',options:[]})},
      sessionSkillCatalog:{},agents:{list:()=>[]},workspaceRegistry:{},
      on:()=>{},get:()=>undefined,effect:setup=>disposers.push(setup()),
    };
    await apply(ctx,{configPath});
    const {port}=JSON.parse(await readFile(endpoint,'utf8'));
    const change=()=>fetch(`http://127.0.0.1:${port}/mobile`,{method:'POST',headers:{Authorization:'Bearer test-token'},body:JSON.stringify({action:'settings',sid:'test-session',body:{model:'custom/new-model',effort:'custom-effort',manualModel:true,manualEffort:true}})});
    const response=await change(),accepted=await response.json();
    assert.equal(response.status,200,JSON.stringify(accepted));
    assert.equal(accepted.status,'accepted');
    assert.equal(accepted.model,'custom/new-model');assert.equal(accepted.effort,'custom-effort');
    assert.deepEqual(calls,[{sessionId:'test-session',provider:'custom',model:'new-model',reasoningEffort:'custom-effort'}]);
    catalogUnavailable=true;
    const fallback=await change();assert.equal(fallback.status,200);assert.equal((await fallback.json()).model,'custom/new-model');
    reject=true;
    const failed=await change(),failure=await failed.json();
    assert.equal(failed.status,400);assert.match(failure.error,/native model unavailable/);assert.equal(failure.status,undefined);
    assert.equal(calls.length,3);
    reject=false;mismatch=true;
    const unconfirmed=await change(),unknown=await unconfirmed.json();
    assert.equal(unconfirmed.status,400);assert.equal(unknown.status,undefined);assert.ok(unknown.error);
    assert.equal(calls.length,4);
  }finally{for(const dispose of disposers.reverse())await dispose();await rm(root,{recursive:true,force:true});}
});
