const { rm, copyFile, mkdir, readdir, readFile, writeFile, access } = require('node:fs/promises'); 
const { join, extname, basename } = require('node:path');

const ENCODING = 'utf-8';
const buildFolder = join(__dirname, 'project-dist');
const path = {
  src: {
    template: join(__dirname, 'template.html'),
    assets: join(__dirname, 'assets'),
    styles: join(__dirname, 'styles'),
    components: join(__dirname, 'components'),
  },
  build: {
    assets: join(buildFolder, 'assets'),
    styles: join(buildFolder, 'bundle.css'),
    HTML: join(buildFolder, 'index.html')
  }
};

async function buildHTML(src, build, dataSrc) {
  try {
    const [template, components] = await Promise.all([readFile(src, ENCODING), readdir(dataSrc)]);
    console.log(template);
    console.log(components);
    let html = template;

    for (const component of components) {
      const componentPath = join(dataSrc, component);
      const componentExt = extname(componentPath);
      const componentName = basename(componentPath, componentExt);
      const componentData = await readFile(componentPath, ENCODING);
      html = html.replace(`{{${componentName}}}`, componentData);
    }

    await writeFile(build, html);
  } catch (err) {
    console.error(err);
  }
}

async function buildStyles(src, dest) {
  try {
    const files = await readdir(src, { withFileTypes: true, recursive: true, encoding: ENCODING });
    const cssFiles = files.filter(file => extname(file.name) === '.css' && file.isFile());
    const cssContents = await Promise.all(cssFiles.map(async file => await readFile(join(src, file.name), ENCODING)));
    await writeFile(dest, cssContents.join('\n'));
  } catch (err) {
    console.error(err);
  }
}

async function copyDir(src, dest) {
  try {
    await access(dest);
  } catch (error) {
    await mkdir(dest);
  }

  const entries = await readdir(src, { withFileTypes: true });
  for (let entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await copyFile(srcPath, destPath);
    }
  }
}

async function buildPage() {
  await rm(buildFolder, { force: true, recursive: true });
  await mkdir(buildFolder, { recursive: true });

  await copyDir(path.src.assets, path.build.assets);
  await buildStyles(path.src.styles, path.build.styles);
  await buildHTML(path.src.template, path.build.HTML, path.src.components);
}

buildPage();