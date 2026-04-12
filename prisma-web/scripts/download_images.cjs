const fs = require('fs');
const path = require('path');
const https = require('https');

const types = [
  { id: 'type_1', animal: 'wolf', trait: 'enthusiastic inventor', zhTrait: '狂热的发明家' },
  { id: 'type_2', animal: 'cat', trait: 'sharp-tongued observer', zhTrait: '毒舌的观察者' },
  { id: 'type_3', animal: 'lion', trait: 'perfect manipulator', zhTrait: '完美的操盘手' },
  { id: 'type_4', animal: 'capybara', trait: 'elegant balancer', zhTrait: '优雅的端水大师' },
  { id: 'type_5', animal: 'tiger', trait: 'burning revolutionary', zhTrait: '燃烧的革命家' },
  { id: 'type_6', animal: 'parrot', trait: 'free bard', zhTrait: '自由的吟游诗人' },
  { id: 'type_7', animal: 'elephant', trait: 'warm navigator', zhTrait: '温暖的领航员' },
  { id: 'type_8', animal: 'panda', trait: 'happy sweetie', zhTrait: '快乐的傻白甜' },
  { id: 'type_9', animal: 'shark', trait: 'aloof dictator', zhTrait: '孤高的独裁者' },
  { id: 'type_10', animal: 'snake', trait: 'indifferent hacker', zhTrait: '冷漠的黑客' },
  { id: 'type_11', animal: 'bear', trait: 'rigorous architect', zhTrait: '严谨的架构师' },
  { id: 'type_12', animal: 'sloth', trait: 'secluded philosopher', zhTrait: '避世的哲学家' },
  { id: 'type_13', animal: 'scorpion', trait: 'secret avenger', zhTrait: '隐秘的复仇者' },
  { id: 'type_14', animal: 'jellyfish', trait: 'broken artist', zhTrait: '破碎的艺术家' },
  { id: 'type_15', animal: 'deer', trait: 'resilient guardian', zhTrait: '坚韧的守护者' },
  { id: 'type_16', animal: 'rabbit', trait: 'soft haven', zhTrait: '柔软的避风港' },
];

// Simplified prompt for faster generation
const getUrl = (t) => {
  const prompt = `3D cute ${t.animal} toy, popmart style, high quality, soft lighting, solid color background.`;
  return `https://coreva-normal.trae.ai/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=square&t=${Date.now()}`;
};

const download = (url, dest) => {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        return download(response.headers.location, dest).then(resolve).catch(reject);
      }

      const contentType = response.headers['content-type'] || '';
      if (contentType.includes('text')) {
        let body = '';
        response.on('data', chunk => body += chunk);
        response.on('end', () => {
          if (body.includes('generating')) reject(new Error('GENERATING'));
          else reject(new Error(`API Error: ${body}`));
        });
        return;
      }

      // If it's a small PNG, it might be the placeholder. 
      // Based on your report, the placeholder is around 172KB. 
      // Real images are usually > 300KB for 1024x1024.
      const contentLength = parseInt(response.headers['content-length'] || '0', 10);
      if (contentLength > 0 && contentLength < 250000) { 
        reject(new Error('GENERATING'));
        return;
      }

      const file = fs.createWriteStream(dest);
      let size = 0;
      response.on('data', chunk => size += chunk.length);
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        if (size < 250000) {
          fs.unlink(dest, () => {});
          reject(new Error('GENERATING'));
        } else {
          resolve();
        }
      });
      file.on('error', (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
    }).on('error', (err) => reject(err));
  });
};

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const run = async () => {
  const dir = path.join(__dirname, '../public/images');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  console.log('🚀 Starting "Fast-Track" image generation...');
  console.log('Using simplified prompts to speed up AI. Please be patient.\n');

  for (const t of types) {
    const dest = path.join(dir, t.id + '.png');
    console.log(`[${t.id}] ${t.zhTrait} (${t.animal})...`);
    
    let success = false;
    for (let i = 0; i < 30; i++) { // Max 30 attempts
      try {
        await download(getUrl(t), dest);
        console.log(`✅ [${t.id}] Success! Real image saved.`);
        success = true;
        break;
      } catch (err) {
        if (err.message === 'GENERATING') {
          process.stdout.write('.'); // Show progress dot
          await wait(10000); // Wait 10s between checks
        } else {
          console.error(`\n❌ [${t.id}] Error: ${err.message}`);
          break;
        }
      }
    }
    if (!success) console.log(`\n⚠️ [${t.id}] Skipped after many retries.`);
    console.log(''); // New line after each animal
  }

  console.log('\n✨ All done! If some images still show placeholders, please wait a minute and run again.');
};

run();
