const fs = require('fs');

const generateData = () => {
  // 生成同样的数据，并且生成 download_images 脚本
  const prefixes = ['慵懒', '暴躁', '傲娇', '佛系', '卷王', '戏精', '高冷', '甜妹', '深情', 'emo', '心机', '憨憨', '护短', '清醒', '微醺', '反骨', '腹黑', '社牛', '社恐', '粘人'];
  const animals = ['水豚', '小火龙', '猫头鹰', '修勾', '狐狸', '海豹', '小熊猫', '兔狲', '企鹅', '吗喽', '海獭', '边牧', '萨摩耶', '黑豹', '水母', '猞猁', '考拉', '小鹿', '布偶', '橘猫'];
  const colors = ['#7c3aed', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1', '#14b8a6', '#f43f5e'];

  const images = [];
  let idCounter = 1;

  for (let i = 0; i < 40; i++) {
    const prefix = prefixes[i % prefixes.length];
    const animal = animals[Math.floor(i / 2) % animals.length];
    const prompt = encodeURIComponent(`A cute, highly detailed 3D designer toy of a ${animal} representing the personality of "${prefix}". Trendy popmart blind box style, glossy vinyl material, clean solid color background, soft studio lighting, ultra-high quality, masterpiece, 8k resolution, pastel colors.`);
    const imageSourceUrl = `https://coreva-normal.trae.ai/api/ide/v1/text_to_image?prompt=${prompt}&image_size=square`;
    images.push({ id: `type_${idCounter}`, url: imageSourceUrl });
    idCounter++;
  }

  let dlContent = `const fs = require('fs');\nconst path = require('path');\nconst https = require('https');\n\nconst images = [\n`;
  images.forEach(img => {
    dlContent += `  { id: '${img.id}', url: '${img.url}' },\n`;
  });
  dlContent += `];\n\n`;
  dlContent += `const download = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        return download(response.headers.location, dest).then(resolve).catch(reject);
      }
      response.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', (err) => { 
      fs.unlink(dest, () => {}); 
      reject(err); 
    });
  });
};

const run = async () => {
  const dir = path.join(__dirname, '../public/images');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  for (const img of images) {
    const dest = path.join(dir, img.id + '.png');
    if (!fs.existsSync(dest)) {
      console.log('Downloading ' + img.id + '...');
      try {
        await download(img.url, dest);
      } catch (e) {
        console.error('Failed to download ' + img.id, e);
      }
    }
  }
  console.log('All images downloaded.');
};
run();
`;
  fs.writeFileSync('scripts/download_images.cjs', dlContent, 'utf-8');
};

generateData();