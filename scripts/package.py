"""Build deterministic, allowlisted local archives; never publish."""
import gzip
import hashlib
import io
import json
import tarfile
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FILES = ('LICENSE', 'LICENSE.coding-mobile', 'README.md', 'cordis.patch.yml',
         'host.mjs', 'index.mjs', 'package.json')


def build():
    manifest = json.loads((ROOT/'package.json').read_text())
    stem = manifest['name']+'-'+manifest['version']
    output = ROOT/'.tmp/dist'
    output.mkdir(parents=True, exist_ok=True)
    contents = {name: (ROOT/name).read_bytes() for name in FILES}
    tgz = output/(stem+'.tgz')
    with tgz.open('wb') as raw, gzip.GzipFile(filename='', fileobj=raw, mode='wb', mtime=0) as zipped:
        with tarfile.open(fileobj=zipped, mode='w') as archive:
            for name, data in contents.items():
                entry = tarfile.TarInfo('package/'+name)
                entry.size = len(data)
                entry.mode = 0o644
                archive.addfile(entry, io.BytesIO(data))
    zip_path = output/(stem+'.zip')
    with zipfile.ZipFile(zip_path, 'w') as archive:
        for name, data in contents.items():
            entry = zipfile.ZipInfo(manifest['name']+'/'+name, (1980, 1, 1, 0, 0, 0))
            entry.external_attr = 0o100644 << 16
            entry.compress_type = zipfile.ZIP_DEFLATED
            archive.writestr(entry, data)
    return {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in (tgz, zip_path)}


if __name__ == '__main__':
    print(json.dumps(build(), indent=2))
