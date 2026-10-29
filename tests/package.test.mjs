import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

test('archives are reproducible and contain only complete publishable files',()=>{
  const build=()=>JSON.parse(execFileSync('python3',['scripts/package.py'],{encoding:'utf8'}));
  assert.deepEqual(build(),build());
  execFileSync('python3',['-c',`
import json,tarfile,zipfile
from pathlib import Path
p=json.loads(Path('package.json').read_text())
stem='.tmp/dist/'+p['name']+'-'+p['version']
expected={'package.json','index.mjs','host.mjs','cordis.patch.yml','README.md','LICENSE','LICENSE.coding-mobile'}
with tarfile.open(stem+'.tgz') as t:
 assert set(t.getnames())=={'package/'+n for n in expected}
 assert all(m.isfile() and m.mode==0o644 for m in t.getmembers())
 for n in expected: assert t.extractfile('package/'+n).read()==Path(n).read_bytes()
with zipfile.ZipFile(stem+'.zip') as z:
 assert set(z.namelist())=={p['name']+'/'+n for n in expected}
 for n in expected: assert z.read(p['name']+'/'+n)==Path(n).read_bytes()
assert not any(k in p.get('scripts',{}) for k in ['preinstall','install','postinstall','prepare','prepublishOnly'])
`]);
});
