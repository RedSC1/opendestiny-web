import {mkdir,copyFile} from 'node:fs/promises';
// Directory indexes support clean URLs on GitHub Pages and simple file servers.
for (const route of ['bazi','ziwei','tarot','cases','history','calendar','qishuo','about']) {
  await mkdir(`dist/client/${route}`,{recursive:true});
  await copyFile(`dist/client/${route}.html`,`dist/client/${route}/index.html`);
}
