import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useQuizStore } from '../store/useQuizStore';
import { questions, personalityTypes } from '../data/questions_v2';
import { Dimension, CoreDimension, ExtDimension, PersonalityType } from '../types';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
import { 
  AlertTriangle, EyeOff, UserCircle, Shield, 
  HeartHandshake, Briefcase, Users, Zap, 
  Bomb, MessageSquare, HandHeart, Scale, 
  History, FlaskConical, FlipHorizontal,
  ChevronDown, Hexagon, Quote, Sparkles
} from 'lucide-react';

export const Result: React.FC = () => {
  const { scores, resetQuiz } = useQuizStore();
  const posterRef = React.useRef<HTMLDivElement>(null);
  const [isGeneratingPoster, setIsGeneratingPoster] = useState(false);
  const [posterPreviewUrl, setPosterPreviewUrl] = useState<string | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // 答题结束跳转过来时，确保页面置顶
    if (containerRef.current) {
      containerRef.current.scrollTo(0, 0);
    }
    window.scrollTo(0, 0);
  }, []);

  const handleGeneratePoster = async () => {
    if (!posterRef.current) return;
    setIsGeneratingPoster(true);
    try {
      const waitForImages = async (root: HTMLElement) => {
        const imgs = Array.from(root.querySelectorAll('img'));
        await Promise.all(imgs.map(img => new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) return resolve();
          let done = false;
          const finish = () => {
            if (done) return;
            done = true;
            resolve();
          };
          const t = window.setTimeout(finish, 4500);
          const onDone = () => {
            window.clearTimeout(t);
            finish();
          };
          img.addEventListener('load', onDone, { once: true });
          img.addEventListener('error', onDone, { once: true });
        })));
      };

      const iframe = document.createElement('iframe');
      iframe.setAttribute('aria-hidden', 'true');
      iframe.style.position = 'fixed';
      iframe.style.left = '-10000px';
      iframe.style.top = '0';
      iframe.style.width = '1px';
      iframe.style.height = '1px';
      iframe.style.opacity = '0';
      iframe.style.pointerEvents = 'none';

      const name = primary.friendlyName || primary.name;
      const primaryImgRel = primary.imageUrl;
      if (!primaryImgRel) throw new Error('Poster image missing');
      const primaryImg = new URL(primaryImgRel, window.location.href).toString();
      const barA = primary.color;
      const barB = secondaries[0].color;
      const barC = secondaries[1].color;
      const toRgb = (hex: string) => {
        const h = (hex || '').trim();
        const m = /^#?([0-9a-f]{6})$/i.exec(h);
        if (!m) return { r: 240, g: 240, b: 245 };
        const n = parseInt(m[1], 16);
        return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
      };
      const mix = (a: string, b: string, t: number) => {
        const A = toRgb(a);
        const B = toRgb(b);
        const r = Math.round(A.r + (B.r - A.r) * t);
        const g = Math.round(A.g + (B.g - A.g) * t);
        const bb = Math.round(A.b + (B.b - A.b) * t);
        return { r, g, b: bb };
      };
      const rgbToStr = (c: { r: number; g: number; b: number }) => `rgb(${c.r}, ${c.g}, ${c.b})`;
      const rgbToHex = (c: { r: number; g: number; b: number }) => {
        const to2 = (n: number) => n.toString(16).padStart(2, '0');
        return `#${to2(c.r)}${to2(c.g)}${to2(c.b)}`;
      };
      const fallbackBg = rgbToStr(mix(barA, '#ffffff', 0.88));

      const sampleBgPairFromImage = async (url: string) => {
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.decoding = 'async';
          img.src = url;
          await new Promise<void>((resolve) => {
            if (img.complete && img.naturalWidth > 0) return resolve();
            const onDone = () => resolve();
            img.addEventListener('load', onDone, { once: true });
            img.addEventListener('error', onDone, { once: true });
          });
          if (!(img.naturalWidth > 0)) return { topBg: fallbackBg, bottomBg: fallbackBg };

          const c = document.createElement('canvas');
          const s = 96;
          c.width = s;
          c.height = s;
          const ctx = c.getContext('2d', { willReadFrequently: true });
          if (!ctx) return { topBg: fallbackBg, bottomBg: fallbackBg };
          const w = img.naturalWidth;
          const h = img.naturalHeight;
          const side = Math.min(w, h);
          const sx = w > h ? Math.floor((w - side) / 2) : 0;
          const sy = h > w ? Math.floor((h - side) / 2) : 0;

          ctx.drawImage(img, sx, sy, side, side, 0, 0, s, s);

          const midX = Math.floor(s / 2);
          const sampleY = (y: number) => {
            const d = ctx.getImageData(midX, y, 1, 1).data;
            return { r: d[0], g: d[1], b: d[2], a: d[3] };
          };

          const findOpaqueFromTop = () => {
            for (let y = 0; y < Math.min(12, s); y++) {
              const p = sampleY(y);
              if (p.a > 200) return p;
            }
            return sampleY(0);
          };
          const findOpaqueFromBottom = () => {
            for (let y = s - 1; y >= Math.max(0, s - 12); y--) {
              const p = sampleY(y);
              if (p.a > 200) return p;
            }
            return sampleY(s - 1);
          };

          const topPx = findOpaqueFromTop();
          const bottomPx = findOpaqueFromBottom();

          return { topBg: rgbToHex(topPx), bottomBg: rgbToHex(bottomPx) };
        } catch {
          return { topBg: fallbackBg, bottomBg: fallbackBg };
        }
      };

      const { topBg, bottomBg } = await sampleBgPairFromImage(primaryImg);

      const qrCodeDataUrl = await QRCode.toDataURL('https://ocean-hku.github.io/Prisma-SRRA/', {
        width: 140,
        margin: 1,
        color: {
          dark: '#0A0A0E',
          light: '#00000000'
        }
      });

      const srcdoc = `<!doctype html><html><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<style>
  html, body { margin:0; padding:0; background:${topBg}; }
  * { box-sizing:border-box; }
  #poster { width:1080px; height:1620px; background:transparent; color:rgba(10,10,14,0.90); font-family: ui-rounded, ui-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; position:relative; overflow:hidden; }
  .bgTop { position:absolute; inset:0; background:${topBg}; }
  .bgBottom { position:absolute; left:0; right:0; top:1230px; bottom:0; background:${bottomBg}; }
  .topLabels { position:absolute; top:70px; left:84px; right:84px; display:flex; justify-content:space-between; align-items:center; z-index:2; pointer-events:none; }
  .topText { font-size:30px; font-weight:900; letter-spacing:0.10em; text-transform:uppercase; color:rgba(255,255,255,0.86); text-shadow: 0 2px 10px rgba(0,0,0,0.18); }
  .hero { position:absolute; top:150px; left:0; right:0; height:1080px; overflow:hidden; }
  .hero img { width:100%; height:100%; object-fit:cover; display:block; }
  .content { position:absolute; top:1268px; left:84px; right:84px; display:flex; justify-content:space-between; align-items:flex-end; }
  .content-left { display:flex; flex-direction:column; gap:22px; flex:1; padding-right:28px; }
  .title { font-size:84px; font-weight:1000; line-height:1.02; letter-spacing:-0.02em; color:${barA}; }
  .desc { font-size:30px; line-height:1.36; font-weight:700; color:rgba(10,10,14,0.84); }
  .qr-code { width:140px; height:140px; flex-shrink:0; mix-blend-mode:multiply; opacity:0.9; }
  .footer { position:absolute; left:84px; right:84px; bottom:68px; display:flex; justify-content:space-between; align-items:flex-end; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size:22px; letter-spacing:0.10em; color:rgba(10,10,14,0.72); }
  .star { position:absolute; right:72px; bottom:66px; font-size:30px; color:rgba(255,255,255,0.75); text-shadow: 0 2px 10px rgba(0,0,0,0.12); }
</style></head><body>
<div id="poster">
  <div class="bgTop"></div>
  <div class="bgBottom"></div>
  <div class="topLabels">
    <div class="topText">PRISMA TOY CARD</div>
    <div class="topText">SERIAL ${String(primary.id || '').toUpperCase()}</div>
  </div>
  <div class="hero"><img crossorigin="anonymous" src="${primaryImg}" alt="" /></div>
  <div class="content">
    <div class="content-left">
      <div class="title">${name}</div>
      <div class="desc">${primary.description}</div>
    </div>
    <img src="${qrCodeDataUrl}" class="qr-code" crossorigin="anonymous" />
  </div>
  <div class="footer">
    <div>棱镜 SRRA</div>
    <div>FRIENDS SHARE CARD</div>
    <div>${new Date().toISOString().slice(0, 10)}</div>
  </div>
  <div class="star">✦</div>
</div>
</body></html>`;

      document.body.appendChild(iframe);
      iframe.srcdoc = srcdoc;

      await new Promise<void>((resolve) => {
        const onLoad = () => resolve();
        iframe.addEventListener('load', onLoad, { once: true });
      });

      const doc = iframe.contentDocument;
      const win = iframe.contentWindow;
      if (!doc || !win) throw new Error('Poster iframe not ready');

      const poster = doc.getElementById('poster') as HTMLElement | null;
      if (!poster) throw new Error('Poster element missing');

      await waitForImages(poster);

      const canvas = await html2canvas(poster, {
        backgroundColor: topBg,
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
        scrollX: 0,
        scrollY: 0,
        windowWidth: poster.scrollWidth,
        windowHeight: poster.scrollHeight
      });

      iframe.remove();
      const iframeEls = Array.from(document.querySelectorAll('iframe[aria-hidden="true"]')) as HTMLIFrameElement[];
      iframeEls.forEach(el => {
        if (el.srcdoc && el.srcdoc.includes('id="poster"')) el.remove();
      });

      const filename = `Prisma_${primary.friendlyName || primary.name}.png`;
      const dataUrl = canvas.toDataURL('image/png');
      setPosterPreviewUrl(dataUrl);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);

        const w = window as any;
        const canShare = !!w.navigator?.canShare?.({ files: [new File([blob], filename, { type: 'image/png' })] });
        if (canShare) {
          w.navigator.share({ files: [new File([blob], filename, { type: 'image/png' })] }).catch(() => {});
          URL.revokeObjectURL(url);
          return;
        }

        const link = document.createElement('a');
        link.download = filename;
        link.href = url;
        link.rel = 'noopener';
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1500);
      }, 'image/png');
    } catch (err) {
      console.error('Failed to generate poster', err);
    } finally {
      setIsGeneratingPoster(false);
    }
  };

  const [showStressed, setShowStressed] = useState(false);
  const [showAllTypes, setShowAllTypes] = useState(false);

  // Calculate Euclidean distance
  const calculateDistance = (p1: Record<CoreDimension, number>, p2: Record<CoreDimension, number>) => {
    return Math.sqrt(
      Math.pow(p1.social - p2.social, 2) +
      Math.pow(p1.rational - p2.rational, 2) +
      Math.pow(p1.rebellious - p2.rebellious, 2) +
      Math.pow(p1.ambition - p2.ambition, 2)
    );
  };

  const coreMaxAbs = useMemo(() => {
    const coreDims: CoreDimension[] = ['social', 'rational', 'rebellious', 'ambition'];
    const maxAbs: Record<CoreDimension, number> = { social: 0, rational: 0, rebellious: 0, ambition: 0 };

    questions.forEach(q => {
      coreDims.forEach(dim => {
        let best = 0;
        q.options.forEach(opt => {
          best = Math.max(best, Math.abs((opt.weights as any)[dim] ?? 0));
        });
        maxAbs[dim] += best;
      });
    });

    coreDims.forEach(dim => {
      if (!Number.isFinite(maxAbs[dim]) || maxAbs[dim] <= 0) maxAbs[dim] = 1;
    });

    return maxAbs;
  }, []);

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
  const coreDims: CoreDimension[] = ['social', 'rational', 'rebellious', 'ambition'];

  const normalizedScores = useMemo(() => {
    const normalizeToCentroidScale = (score: number, dim: CoreDimension) => {
      const scaled = (score / coreMaxAbs[dim]) * 8;
      return clamp(scaled, -8, 8);
    };

    return {
      social: normalizeToCentroidScale(scores.social, 'social'),
      rational: normalizeToCentroidScale(scores.rational, 'rational'),
      rebellious: normalizeToCentroidScale(scores.rebellious, 'rebellious'),
      ambition: normalizeToCentroidScale(scores.ambition, 'ambition'),
    } satisfies Record<CoreDimension, number>;
  }, [scores, coreMaxAbs]);

  const analysis = useMemo(() => {
    const distances = personalityTypes.map(pt => ({
      ...pt,
      distance: calculateDistance(normalizedScores, pt.centroid)
    })).sort((a, b) => a.distance - b.distance);

    const minDist = distances[0]?.distance ?? 0;
    const tie = distances.filter(d => Math.abs(d.distance - minDist) <= 0.02);
    if (tie.length > 1) {
      const scoreSign = (v: number) => (Math.abs(v) < 0.35 ? 0 : v > 0 ? 1 : -1);
      const tieSorted = [...tie].sort((a, b) => {
        const aMatch = coreDims.reduce((sum, dim) => sum + (scoreSign(normalizedScores[dim]) !== 0 && scoreSign(normalizedScores[dim]) === scoreSign(a.centroid[dim]) ? 1 : 0), 0);
        const bMatch = coreDims.reduce((sum, dim) => sum + (scoreSign(normalizedScores[dim]) !== 0 && scoreSign(normalizedScores[dim]) === scoreSign(b.centroid[dim]) ? 1 : 0), 0);
        if (bMatch !== aMatch) return bMatch - aMatch;
        if (a.distance !== b.distance) return a.distance - b.distance;
        return a.id.localeCompare(b.id);
      });
      const chosen = tieSorted[0];
      const rest = distances.filter(d => d.id !== chosen.id);
      distances.splice(0, distances.length, chosen, ...rest);
    }

    const top10 = distances.slice(0, 10);
    const top3 = top10.slice(0, 3);
    
    const temperature = 4;
    const rawScores = top3.map(t => Math.exp(-t.distance / temperature));
    const totalScore = rawScores.reduce((a, b) => a + b, 0) || 1;
    const percentages = rawScores.map(s => Math.round((s / totalScore) * 100));

    // Handle rounding errors to ensure they sum exactly to 100
    const diff = 100 - percentages.reduce((a, b) => a + b, 0);
    // Add diff to the max percentage index
    const maxIdx = percentages.indexOf(Math.max(...percentages));
    percentages[maxIdx] += diff;

    return {
      primary: { ...top3[0], percentage: percentages[0] },
      secondaries: [
        { ...top3[1], percentage: percentages[1] },
        { ...top3[2], percentage: percentages[2] }
      ],
      top10
    };
  }, [normalizedScores]);

  const extDimensionsMap: Record<ExtDimension, { label: string; desc: string[]; levels: string[] }> = {
    selfEsteem: { 
      label: '自尊自信', 
      desc: ['极度自我怀疑，易被评价击溃', '略显自卑，需要外界反馈证明自我', '心里对自己大致有数，不太会被路人一句话打散', '内核稳定，能坦然接受批评', '极度自信甚至自负，自带结界无视外界定义'],
      levels: ['1', '2', '3', '4', '5']
    },
    selfClarity: { 
      label: '自我清晰度', 
      desc: ['对我是谁极度迷茫，随时在变', '常受环境影响而改变自我认知', '知道自己不喜欢什么，但想要什么还在摸索', '有清晰的自我画像和目标', '绝对的自我觉醒，不受任何标签定义'],
      levels: ['1', '2', '3', '4', '5']
    },
    coreValue: { 
      label: '核心价值', 
      desc: ['随波逐流，缺乏底层信念支撑', '容易被大众价值观裹挟', '有一套初步的准则，但有时会妥协', '坚守核心底线，知道什么最重要', '拥有绝对的信仰基石，为了原则可舍弃一切'],
      levels: ['1', '2', '3', '4', '5']
    },
    attachmentSecurity: { 
      label: '依恋安全感', 
      desc: ['极度恐惧被抛弃，时刻处于焦虑中', '患得患失，需要反复确认被爱', '相对独立，但在特定压力下会退缩', '信任关系，能健康地给予和索取', '拥有完整的自我，爱与不爱都自如'],
      levels: ['1', '2', '3', '4', '5']
    },
    emotionalInvolvement: { 
      label: '情感投入度', 
      desc: ['冷漠抽离，几乎无法与人共情', '防御性强，只敢投入一点点', '能正常共鸣，但也懂适时抽身', '容易深陷其中，共情力极强', '飞蛾扑火，每一次都燃烧全部的灵魂'],
      levels: ['1', '2', '3', '4', '5']
    },
    boundaryDependency: { 
      label: '边界与依赖', 
      desc: ['重度依赖症，无法忍受独自决定', '习惯性寻找依靠，害怕担责', '平时独立，关键时刻希望有人兜底', '边界感强，自己的事自己扛', '极度孤狼，抗拒任何形式的依赖'],
      levels: ['1', '2', '3', '4', '5']
    },
    worldview: { 
      label: '世界观倾向', 
      desc: ['觉得世界是一场巨大的灾难', '悲观底色，对人性抱有怀疑', '现实主义者，好坏参半', '倾向于相信事在人为', '充满理想主义，相信光与奇迹'],
      levels: ['1', '2', '3', '4', '5']
    },
    ruleFlexibility: { 
      label: '规则与灵活度', 
      desc: ['极度刻板，完全不敢越雷池一步', '循规蹈矩，害怕因犯错被惩罚', '遵守基本规则，偶尔找点捷径', '灵活变通，规矩是死的我是活的', '天生反骨，规则就是用来打破的'],
      levels: ['1', '2', '3', '4', '5']
    },
    lifeMeaning: { 
      label: '人生意义感', 
      desc: ['重度虚无，觉得一切都毫无意义', '得过且过，找点乐子就行', '在某些特定的人或事上能找到意义', '有明确的人生方向和使命感', '有强烈的历史使命感或精神追求'],
      levels: ['1', '2', '3', '4', '5']
    },
    motivation: { 
      label: '动机导向', 
      desc: ['完全被动，别人推一下才动一下', '害怕失败或惩罚才去努力', '追求世俗的成功和认可', '为了实现自我价值而战', '被纯粹的热爱和内在渴望所驱动'],
      levels: ['1', '2', '3', '4', '5']
    },
    decisionStyle: { 
      label: '决策风格', 
      desc: ['纯凭直觉和一时冲动，事后常后悔', '容易被情绪左右，感性大于理性', '感性与理性五五开，反复纠结', '数据与逻辑优先，但会考虑人情', '绝对理智的机器，只看最优解'],
      levels: ['1', '2', '3', '4', '5']
    },
    executionMode: { 
      label: '执行模式', 
      desc: ['重度拖延，不到最后一刻绝不开始', '想法很多，落地很少', '按部就班，推一下走一步', '执行力强，说到做到', '雷厉风行的结果导向狂魔'],
      levels: ['1', '2', '3', '4', '5']
    },
    socialInitiative: { 
      label: '社交主动性', 
      desc: ['极度社恐，恨不得物理隐身', '被动社交，你不找我我不找你', '看心情，遇到对频的人才会主动', '游刃有余，能随时发起社交', '绝对社牛，场子里的控场王'],
      levels: ['1', '2', '3', '4', '5']
    },
    interpersonalBoundary: { 
      label: '人际边界感', 
      desc: ['完全没有边界，容易被无限度消耗', '不太会拒绝，经常委屈自己', '有基本底线，但遇到软肋会退让', '边界清晰，该说不时绝不含糊', '铜墙铁壁，任何人都休想越界'],
      levels: ['1', '2', '3', '4', '5']
    },
    expressionAuthenticity: { 
      label: '表达与真实度', 
      desc: ['习惯性伪装，连自己都骗', '戴着厚厚的面具，只展现别人想看的', '看场合决定展现多少分真实', '基本真实，不屑于虚伪的客套', '极度坦诚甚至尖锐，绝不掩饰真实的自己'],
      levels: ['1', '2', '3', '4', '5']
    }
  };

  const extScores = useMemo(() => {
    const ext: Record<string, { score: number, levelIndex: number, text: string }> = {};
    Object.keys(extDimensionsMap).forEach((dim) => {
      const weights: Partial<Record<CoreDimension, number>> = ({
        selfEsteem: { ambition: 0.55, rebellious: 0.15, rational: 0.3 },
        selfClarity: { rational: 0.55, ambition: 0.25, rebellious: -0.2 },
        coreValue: { rebellious: 0.55, rational: 0.25, ambition: 0.2 },
        attachmentSecurity: { social: 0.55, rational: 0.25, ambition: 0.2 },
        emotionalInvolvement: { social: 0.35, rational: -0.55, rebellious: 0.1 },
        boundaryDependency: { social: -0.55, rebellious: 0.35, ambition: 0.1 },
        worldview: { rational: -0.35, ambition: 0.35, rebellious: 0.3 },
        ruleFlexibility: { rebellious: 0.75, rational: 0.25 },
        lifeMeaning: { ambition: 0.65, rational: 0.35 },
        motivation: { ambition: 0.75, rebellious: 0.25 },
        decisionStyle: { rational: 0.85, ambition: 0.15 },
        executionMode: { ambition: 0.85, rational: 0.15 },
        socialInitiative: { social: 0.85, rebellious: 0.15 },
        interpersonalBoundary: { rebellious: 0.55, social: -0.35, rational: 0.1 },
        expressionAuthenticity: { rebellious: 0.55, rational: 0.25, social: 0.2 },
      } as Record<ExtDimension, Partial<Record<CoreDimension, number>>>)[dim as ExtDimension] ?? {};

      let sumAbs = 0;
      let raw = 0;
      (Object.keys(weights) as CoreDimension[]).forEach(k => {
        const w = weights[k] ?? 0;
        sumAbs += Math.abs(w);
        raw += (normalizedScores[k] / 8) * w;
      });
      const z = sumAbs > 0 ? clamp(raw / sumAbs, -1, 1) : 0;
      const p = (z + 1) / 2;
      const score = p * 100;
      const levelIndex = Math.max(0, Math.min(4, Math.round(p * 4)));

      ext[dim] = {
        score,
        levelIndex,
        text: extDimensionsMap[dim as ExtDimension].desc[levelIndex]
      };
    });
    return ext;
  }, [normalizedScores]);

  const generatePoeticNarrative = () => {
    return (
      <div className="flex flex-col gap-6 text-white/80 font-serif leading-loose tracking-wide">
        <p className="text-lg font-light leading-relaxed indent-8">
          {primary.innerLandscape}
        </p>
        <div className="mt-4 pt-6 border-t border-white/10 text-center">
          <p className="text-xl text-primary font-bold">
            “这个世界偶尔喧嚣，但你始终在寻找属于自己的频率。”
          </p>
        </div>
      </div>
    );
  };

  const { primary, secondaries, top10 } = analysis;

  const evolutionHint = useMemo(() => {
    const s1 = secondaries[0];
    const dimNames: Record<CoreDimension, string> = {
      social: '内敛/社交', rational: '感性/理性', 
      rebellious: '顺从/叛逆', ambition: '佛系/野心'
    };
    
    let maxDiffDim: CoreDimension = 'social';
    let maxDiffVal = 0;
    
    (Object.keys(primary.centroid) as CoreDimension[]).forEach(dim => {
      const d = Math.abs(primary.centroid[dim] - s1.centroid[dim]);
      if (d > maxDiffVal) {
        maxDiffVal = d;
        maxDiffDim = dim;
      }
    });

    const direction = s1.centroid[maxDiffDim] > primary.centroid[maxDiffDim] ? '更激进/强烈' : '更收敛/温和';
    
    const keyDiff = Math.abs(primary.centroid[maxDiffDim] - s1.centroid[maxDiffDim]).toFixed(1);
    const s1Label = s1.friendlyName || s1.name;
    const primaryLabel = primary.friendlyName || primary.name;
    return `你和【${s1Label}】只差一条很细的分岔路：最关键的分界点在【${dimNames[maxDiffDim]}】（差值约 ${keyDiff}）。把这个旋钮往${direction}拨一点，你就会从【${primaryLabel}】那套行事方式，滑向它的版本。`;
  }, [primary, secondaries]);

  const constellationLayout = useMemo(() => {
    const seedFromString = (s: string) => {
      let h = 2166136261;
      for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      return h >>> 0;
    };

    const mulberry32 = (a: number) => {
      return () => {
        let t = a += 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    };

    const all = personalityTypes
      .map(pt => ({ ...pt, distance: calculateDistance(normalizedScores, pt.centroid) }))
      .sort((a, b) => a.distance - b.distance);

    const nearIds = new Set([secondaries[0].id, secondaries[1].id]);
    const near = all.filter(p => nearIds.has(p.id)).slice(0, 2);
    const far = [...all].reverse().filter(p => p.id !== primary.id && !nearIds.has(p.id)).slice(0, 3);
    const satellites = [...near, ...far].sort((a, b) => a.distance - b.distance);

    const rng = mulberry32(seedFromString(`${primary.id}-${satellites.map(s => s.id).join(',')}`));

    const maxDist = Math.max(...satellites.map(s => s.distance), 0.0001);
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const base = 0.12;
    const span = 0.32;
    const maxR = (base + span) * 100;
    const minSep = 18;

    const pts = satellites.map((pt, i) => {
      const angle = i * goldenAngle - Math.PI / 2 + (rng() - 0.5) * 0.35;
      const norm = Math.min(1, pt.distance / maxDist);
      const radiusRatio = base + Math.pow(norm, 0.65) * span + (rng() - 0.5) * 0.01;
      const x = 50 + radiusRatio * 100 * Math.cos(angle);
      const y = 50 + radiusRatio * 100 * Math.sin(angle);
      return { pt, x, y, radiusRatio };
    });

    for (let iter = 0; iter < 12; iter++) {
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i];
          const b = pts[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
          if (dist >= minSep) continue;
          const push = ((minSep - dist) / minSep) * 0.9;
          const ux = dx / dist;
          const uy = dy / dist;
          pts[i] = { ...a, x: a.x - ux * push, y: a.y - uy * push };
          pts[j] = { ...b, x: b.x + ux * push, y: b.y + uy * push };
        }
      }

      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        const vx = p.x - 50;
        const vy = p.y - 50;
        const r = Math.sqrt(vx * vx + vy * vy);
        if (r > maxR) {
          const s = maxR / (r || 0.0001);
          pts[i] = { ...p, x: 50 + vx * s, y: 50 + vy * s };
        }
      }
    }

    return pts;
  }, [
    primary.id,
    secondaries[0].id,
    secondaries[1].id,
    normalizedScores.social,
    normalizedScores.rational,
    normalizedScores.rebellious,
    normalizedScores.ambition,
  ]);

  // Magazine-style Diagnosis Card
  const DiagCard = ({ title, icon: Icon, content, color, large = false }: { title: string, icon: any, content: React.ReactNode, color?: string, large?: boolean }) => (
    <div className={`flex flex-col gap-4 rounded-3xl border border-white/5 bg-gradient-to-b from-white/5 to-transparent p-8 backdrop-blur-md transition-all hover:bg-white/10 hover:border-white/20 group ${large ? 'md:col-span-2' : ''}`}>
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-white/5 border border-white/10" style={{ color: color || primary.color }}>
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-bold tracking-widest uppercase text-white/90">{title}</h3>
      </div>
      <div className="relative mt-2">
        <Quote className="absolute -top-2 -left-2 w-8 h-8 text-white/5 opacity-50" />
        <div className="text-white/70 leading-loose text-[15px] font-light relative z-10 pl-4 border-l-2" style={{ borderColor: color || primary.color }}>
          {content}
        </div>
      </div>
    </div>
  );

  const growthAdviceByType: Record<string, string> = {
    type_1: '把冲劲变成可复利：每次想“掀桌”前先做一个能交付的小版本，让你的野心落在现实里，而不是落在情绪里。',
    type_2: '把毒舌改成作品：把吐槽写成清单/笔记/测评；把懒惰当成“省电模式”，允许它存在，但用 5 分钟启动法把你拉回正轨。',
    type_3: '把高压改成秩序：提前写好边界模板和标准，让你不用靠冷脸维持控制；把“必须完美”拆成及格/好/极致三档。',
    type_4: '把敏感变成雷达：先记录触发点，再决定要不要行动；用“我需要___”替代“你怎么___”，关系会更稳也更省力。',
    type_5: '把佛系变成策略：只保留一条主线，给每周一个最小交付；想躺的时候先做 3 分钟，把惯性站到你这边。',
    type_6: '把温柔加上边界：先问自己愿不愿意，再决定答不答应；学会“我想想再回你”，你会更松也更不内耗。',
    type_7: '把野心落地：先交付再优化，用复盘模板每次只改一个变量；把强势换成明确标准，别人更愿意跟你走。',
    type_8: '把控场变成共识：先对齐目标再分工，同时练一次示弱——告诉别人你需要什么支持，你会更轻松也更被理解。',
    type_9: '把热血配刹车：每次上头前做一次风险清单；把冲刺改成节奏推进，你会更能打，也更不容易燃尽。',
    type_10: '把警觉变成筛选：用标准选人而不是用情绪试探；不报复，直接立规则，你会更安全也更有力量。',
    type_11: '把精算从脑内搬到纸上：先写结论再推演，避免陷进分析；留一个情绪出口，不然效率会反噬你。',
    type_12: '把强势变成透明：说清楚“为什么这么决定”，并给选择题让别人参与；你依旧掌舵，但关系不会被压扁。',
    type_13: '把摆烂改成恢复：休息也要有边界和结束时间；用“最小块”破拖延，给自己一个稳定作息底盘再谈进步。',
    type_14: '把刺换成边界话术：温和但坚定地表达需求；每周一次主动表达喜欢，关系会更稳，你也更不委屈。',
    type_15: '把意义感落到行动：一个月只做一个主题探索，每周一次复盘“我做了什么让我更像自己”；主线会慢慢长出来。',
    type_16: '把社交冲动变成连接：先问对方需要什么，再输出观点；冲动发言前读一遍再发，你会更有魅力也更少翻车。',
  };

  const growthAdvice = growthAdviceByType[primary.id] ?? '先做一个最小动作，把情绪写下来，再决定要不要行动；边界讲清楚，节奏才可持续。';

  return (
    <div ref={containerRef} className="flex flex-1 flex-col items-center justify-start p-4 py-12 md:p-12 relative overflow-y-auto w-full">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="w-full max-w-6xl relative z-10 flex flex-col gap-24"
      >
        
        {/* ================= 1. 核心结果 (主辅标签百分比与专属形象图) ================= */}
        <section ref={posterRef} data-poster="true" className="flex flex-col items-center text-center space-y-12 relative p-12 rounded-[4rem] bg-[#0a0a0f] border border-white/10 overflow-hidden">
          {/* Ambient Glows for Poster */}
          <div className="absolute inset-0 mix-blend-screen opacity-20 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 30%, ${primary.color} 0%, transparent 70%)` }} />
          
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/60 px-6 py-2.5 text-xs tracking-widest text-white/70 shadow-2xl">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: primary.color }} />
            潜意识多维解析报告
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-12 md:gap-20 w-full max-w-5xl justify-center">
            {/* 专属形象插图 */}
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, rotate: -5 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
              className="group relative w-72 h-72 md:w-96 md:h-96 shrink-0"
            >
              <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-tr from-white/10 to-transparent border border-white/20 shadow-[0_0_80px_rgba(255,255,255,0.05)] overflow-hidden flex items-center justify-center p-2">
                <img 
                  src={primary.imageUrl} 
                  alt={primary.name} 
                  crossOrigin="anonymous"
                  className="w-full h-full object-cover rounded-[2.5rem] transition-all duration-700 group-hover:scale-[1.04] group-hover:drop-shadow-[0_0_18px_rgba(255,255,255,0.20)]"
                />
              </div>
              <div className="absolute -inset-10 -z-10 rounded-[4rem] blur-3xl opacity-30 animate-pulse" style={{ backgroundColor: primary.color }} />
            </motion.div>

            {/* 文字信息 */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-8 max-w-lg z-10">
              <h1 className="font-serif text-6xl md:text-8xl font-bold tracking-tighter drop-shadow-2xl" style={{ color: primary.color }}>
                {primary.friendlyName || primary.name}
              </h1>
              <p className="text-xl md:text-2xl font-light text-white/80 leading-relaxed">
                {primary.description}
              </p>
              {/* Poster Watermark / Footer info */}
              <div className="hidden md:flex flex-col mt-4 opacity-50 font-mono text-xs tracking-widest text-left">
                <span>棱镜 SRRA</span>
                <span>DATA ID: {Math.random().toString(36).substring(2, 10).toUpperCase()}</span>
              </div>
            </div>
          </div>

          {/* 百分比分配条 */}
        <div className="w-full max-w-4xl flex flex-col gap-4 mt-10 p-8 rounded-[2rem] border border-white/10 bg-[#111116] z-10">
          <div className="flex justify-between text-sm font-bold tracking-widest uppercase mb-2">
            <span style={{ color: primary.color }}>{primary.percentage}% {primary.friendlyName || primary.name}</span>
            <span style={{ color: secondaries[0].color }}>{secondaries[0].percentage}% {secondaries[0].friendlyName || secondaries[0].name}</span>
            <span style={{ color: secondaries[1].color }}>{secondaries[1].percentage}% {secondaries[1].friendlyName || secondaries[1].name}</span>
          </div>
          <div className="flex w-full h-3 rounded-full overflow-hidden bg-black/80 shadow-inner">
            <div className="h-full" style={{ width: `${primary.percentage}%`, backgroundColor: primary.color }} />
            <div className="h-full" style={{ width: `${secondaries[0].percentage}%`, backgroundColor: secondaries[0].color }} />
            <div className="h-full" style={{ width: `${secondaries[1].percentage}%`, backgroundColor: secondaries[1].color }} />
          </div>
        </div>
        </section>

        {/* ================= 1.5. 诗意内心叙事 ================= */}
        <section className="w-full max-w-4xl mx-auto rounded-[3rem] border border-white/5 bg-gradient-to-br from-white/5 to-transparent p-12 backdrop-blur-xl">
          <div className="flex flex-col items-center gap-4 mb-8 text-center">
            <h2 className="text-3xl font-serif tracking-widest text-white/90">INNER LANDSCAPE</h2>
            <p className="text-white/40 text-sm tracking-widest uppercase">你的内心群像</p>
          </div>
          {generatePoeticNarrative()}
        </section>

        {/* ================= 2. 以用户为中心的辐射状高端星图 ================= */}
        <section className="w-full flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2 mb-8">
            <Hexagon className="w-8 h-8 text-white/30" />
            <h2 className="text-3xl font-serif tracking-widest text-center text-white/90">引力波辐射星图</h2>
            <p className="text-white/40 text-sm tracking-widest uppercase">Gravitational Constellation</p>
          </div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 2 }}
            className="relative w-full max-w-3xl mx-auto aspect-square rounded-full border border-white/10 bg-black/40 backdrop-blur-3xl overflow-hidden flex items-center justify-center shadow-2xl"
          >
            {/* Ambient Glows */}
            <div className="absolute inset-0 mix-blend-screen opacity-20" style={{ background: `radial-gradient(circle at 50% 50%, ${primary.color} 0%, transparent 60%)` }} />
            <div className="absolute w-full h-full noise-bg opacity-40 pointer-events-none" />
            
            {/* SVG Lines for connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {constellationLayout.map(({ pt, x, y }, i) => (
                <motion.line
                  key={`line-${pt.id}`}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.26 }}
                  transition={{ delay: 1.4 + i * 0.06, duration: 1 }}
                  x1="50%" y1="50%" x2={`${x}%`} y2={`${y}%`}
                  stroke={pt.color}
                  strokeWidth="1.5"
                  strokeDasharray="4 7"
                />
              ))}
            </svg>

            {/* Nodes */}
            <motion.div
              key={primary.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1, type: "spring" }}
              className="absolute z-10 flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2 group"
              style={{ left: `50%`, top: `50%` }}
            >
              <div
                className="rounded-full border flex items-center justify-center overflow-hidden bg-black w-28 h-28 md:w-36 md:h-36 shadow-[0_0_46px_rgba(255,255,255,0.18)] transition-all group-hover:shadow-[0_0_65px_rgba(255,255,255,0.24)]"
                style={{ borderColor: primary.color }}
              >
                <img src={primary.imageUrl} alt={primary.name} className="w-full h-full object-cover opacity-100" />
              </div>
              <div className="mt-4 whitespace-nowrap text-center">
                <span className="font-bold tracking-wider text-base md:text-lg" style={{ color: primary.color }}>
                  {primary.friendlyName || primary.name}
                </span>
              </div>
            </motion.div>

            {constellationLayout.map(({ pt, x, y }, i) => (
              <motion.div
                key={pt.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1.2 + i * 0.07, type: "spring" }}
                className="absolute z-10 flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                <div
                  className="relative rounded-full border flex items-center justify-center overflow-hidden bg-black w-16 h-16 md:w-20 md:h-20 transition-all duration-300 group-hover:scale-[1.08] group-hover:shadow-[0_0_30px_rgba(255,255,255,0.18)]"
                  style={{ borderColor: pt.color }}
                >
                  <img src={pt.imageUrl} alt={pt.name} className="w-full h-full object-cover opacity-100" />
                  <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="rounded-full bg-black/70 border border-white/10 px-3 py-1 text-[11px] text-white/85 backdrop-blur-md">
                      距离 {pt.distance.toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className="mt-3 whitespace-nowrap text-center opacity-90">
                  <span className="font-bold tracking-wider text-xs md:text-sm" style={{ color: pt.color }}>
                    {pt.friendlyName || pt.name}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
          <div className="flex flex-col gap-6 text-white/80 font-serif leading-loose tracking-wide bg-white/5 border border-white/10 rounded-[2rem] p-8 mt-6 max-w-3xl mx-auto backdrop-blur-md">
            <p className="text-sm md:text-base leading-relaxed tracking-wide indent-8">{evolutionHint}</p>
          </div>
        </section>

        {/* ================= 3. 双面卡牌 (平时版 / 压力版) ================= */}
        <section className="w-full max-w-3xl mx-auto h-[400px] perspective-1000">
          <motion.div
            className="w-full h-full relative preserve-3d cursor-pointer group"
            animate={{ rotateY: showStressed ? 180 : 0 }}
            transition={{ duration: 0.8, type: "spring", stiffness: 60 }}
            onClick={() => setShowStressed(!showStressed)}
          >
            {/* Front: Normal State */}
            <div className="absolute inset-0 backface-hidden flex flex-col justify-center items-center text-center p-12 rounded-[3rem] border border-white/10 bg-gradient-to-b from-white/10 to-transparent backdrop-blur-2xl shadow-2xl group-hover:border-white/20 transition-all">
              <div className="absolute top-8 right-8 text-white/40 flex items-center gap-2 text-xs uppercase font-bold tracking-widest"><FlipHorizontal className="w-4 h-4"/> 点击翻转</div>
              <div className="mb-6 p-4 rounded-full bg-white/5" style={{ color: primary.color }}><UserCircle className="w-8 h-8" /></div>
              <h3 className="text-2xl font-serif tracking-widest mb-6" style={{ color: primary.color }}>平时版 · 待机模式</h3>
              <p className="text-lg md:text-xl text-white/80 leading-relaxed font-light">{primary.normalState}</p>
            </div>
            
            {/* Back: Stressed State */}
            <div className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col justify-center items-center text-center p-12 rounded-[3rem] border border-red-500/20 bg-gradient-to-b from-red-500/10 to-black/80 backdrop-blur-2xl shadow-2xl group-hover:border-red-500/40 transition-all">
              <div className="absolute top-8 right-8 text-white/40 flex items-center gap-2 text-xs uppercase font-bold tracking-widest"><FlipHorizontal className="w-4 h-4"/> 点击翻转</div>
              <div className="mb-6 p-4 rounded-full bg-red-500/10 text-red-400"><Shield className="w-8 h-8" /></div>
              <h3 className="text-2xl font-serif tracking-widest mb-6 text-red-400">压力版 · 黑化警戒</h3>
              <p className="text-lg md:text-xl text-white/80 leading-relaxed font-light">{primary.stressedState}</p>
            </div>
          </motion.div>
        </section>

        {/* ================= 3.8. 15 维度雷达/滑块分析 ================= */}
        <section className="w-full max-w-5xl mx-auto rounded-[3rem] border border-white/5 bg-black/20 p-8 md:p-12 backdrop-blur-xl">
          <div className="flex flex-col items-center gap-4 mb-12 text-center">
            <h2 className="text-3xl font-serif tracking-widest text-white/90">15-DIMENSIONAL SPECTRUM</h2>
            <p className="text-white/40 text-sm tracking-widest uppercase">底层人格倾向光谱</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-8">
            {Object.entries(extDimensionsMap).map(([key, info]) => {
              const scoreObj = extScores[key];
              return (
                <div key={key} className="flex flex-col gap-3">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-bold tracking-widest text-white/80">{info.label}</span>
                    <div className="flex gap-1">
                      {[0, 1, 2, 3, 4].map((level) => (
                        <div 
                          key={level} 
                          className={`w-4 h-1.5 rounded-full transition-all duration-500 ${level <= scoreObj.levelIndex ? 'opacity-100 shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'opacity-20 bg-white/20'}`}
                          style={{ backgroundColor: level <= scoreObj.levelIndex ? primary.color : undefined }}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-white/60 mt-1 leading-relaxed border-l-2 pl-3" style={{ borderColor: primary.color }}>
                    {scoreObj.text}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ================= 4. 杂志级深度诊断模块 (10+ 板块) ================= */}
        <section className="w-full">
          <div className="flex flex-col items-center gap-4 mb-16 text-center">
            <h2 className="text-4xl font-serif tracking-widest text-white/90">DEEP DIAGNOSIS</h2>
            <p className="text-white/40 text-sm tracking-widest uppercase">潜意识行为学诊断（{primary.friendlyName || primary.name}专属）</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Use 'large' for more important sections to span across columns */}
            <DiagCard title="防线崩溃场景" icon={AlertTriangle} content={primary.crashScene} color="#ef4444" large />
            <DiagCard title="自我保护机制" icon={Shield} content={primary.defenseMech} color="#f59e0b" />
            
            <DiagCard title="极度在意却不承认" icon={EyeOff} content={primary.secretCare} />
            <DiagCard title="恋爱卡点分析" icon={HeartHandshake} content={primary.romanceBlock} color="#ec4899" />
            <DiagCard title="熟人 vs 生人" icon={Users} content={primary.socialPersona} />
            
            <DiagCard title="团队沟通说明书" icon={MessageSquare} content={primary.teamComm} />
            <DiagCard title="灵魂互补类型" icon={Zap} content={primary.complementary} color="#10b981" />
            <DiagCard title="最讨厌情况" icon={Bomb} content={primary.landmine} color="#ef4444" />
            
            <DiagCard title="被深深理解的瞬间" icon={HandHeart} content={primary.feelUnderstood} color="#3b82f6" />
            <DiagCard title="健康边界设定" icon={Scale} content={primary.healthyBoundary} large />
          </div>
        </section>

        {/* ================= 5. 互动建议 (世界线 & 微实验) ================= */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
          <div className="relative overflow-hidden rounded-[3rem] border border-white/5 bg-gradient-to-br from-white/5 to-transparent p-12 backdrop-blur-xl group hover:bg-white/10 transition-all">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-4 rounded-2xl bg-accent-blue/10 text-accent-blue"><History className="w-8 h-8" /></div>
              <div>
                <h3 className="text-2xl font-serif tracking-widest text-accent-blue">世界线重置</h3>
                <p className="text-white/40 text-xs tracking-widest uppercase mt-1">If you could start over</p>
              </div>
            </div>
            <p className="text-white/80 leading-loose text-lg font-light italic">"{primary.worldline}"</p>
          </div>
          
          <div className="relative overflow-hidden rounded-[3rem] border border-white/5 bg-gradient-to-br from-white/5 to-transparent p-12 backdrop-blur-xl group hover:bg-white/10 transition-all">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-4 rounded-2xl bg-accent-pink/10 text-accent-pink"><FlaskConical className="w-8 h-8" /></div>
              <div>
                <h3 className="text-2xl font-serif tracking-widest text-accent-pink">行动微实验</h3>
                <p className="text-white/40 text-xs tracking-widest uppercase mt-1">Weekly Challenge</p>
              </div>
            </div>
            <p className="text-white/80 leading-loose text-lg font-light italic">"{primary.microExperiment}"</p>
          </div>

          <div className="relative overflow-hidden rounded-[3rem] border border-white/5 bg-gradient-to-br from-white/5 to-transparent p-12 backdrop-blur-xl group hover:bg-white/10 transition-all">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-4 rounded-2xl bg-white/5" style={{ color: primary.color }}><Sparkles className="w-8 h-8" /></div>
              <div>
                <h3 className="text-2xl font-serif tracking-widest" style={{ color: primary.color }}>成长标签</h3>
                <p className="text-white/40 text-xs tracking-widest uppercase mt-1">Growth Hint</p>
              </div>
            </div>
            <p className="text-white/80 leading-loose text-lg font-light italic">"{growthAdvice}"</p>
          </div>
        </section>

        {/* ================= 6. 16 种全量形象图鉴 ================= */}
        <section className="w-full mt-10 flex flex-col items-center">
          <div className="flex flex-col items-center gap-4 mb-16 text-center">
            <h2 className="text-4xl font-serif tracking-widest text-white/90">ALL PROTOTYPES</h2>
            <p className="text-white/40 text-sm tracking-widest uppercase">萌兽人格图鉴 · 16 种潜意识原型图鉴</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-10 gap-y-12 w-full">
            {personalityTypes.map((pt, idx) => (
              <motion.div 
                key={pt.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.02 }}
                className="flex flex-col items-center gap-4 group"
              >
                <div className="w-36 h-36 md:w-44 md:h-44 rounded-3xl overflow-hidden shadow-2xl border border-white/10 group-hover:shadow-[0_0_45px_rgba(255,255,255,0.18)] transition-all duration-300">
                  <img src={pt.imageUrl} alt={pt.name} className="w-full h-full object-cover" />
                </div>
                <div className="text-center">
                  <h4 className="font-bold text-sm md:text-base tracking-wide" style={{ color: pt.color }}>{pt.friendlyName || pt.name}</h4>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ================= 6.5. 科学测算原理 ================= */}
        <section className="w-full">
          <div className="flex flex-col items-center gap-4 mb-12 text-center">
            <h2 className="text-4xl font-serif tracking-widest text-white/90">METHOD</h2>
            <p className="text-white/40 text-sm tracking-widest uppercase">科学测算原理 · 说人话版</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <DiagCard
              title="你每一次选择，都在拨四个旋钮"
              icon={Briefcase}
              content="题目不是“选A还是选B”，而是把你的社交、理性、叛逆、野心这四个旋钮往某个方向轻轻拨动。50道题后，你会自然停在一个很具体的坐标上。"
            />
            <DiagCard
              title="我们不是贴标签，是找“更像你”的原型"
              icon={Users}
              content="系统把你的位置，和16个原型的“中心点”做对比：谁离你最近，谁就更像你现在的行事风格；离得远的，不是“坏”，只是“不是你”。"
            />
            <DiagCard
              title="主人格为什么会压倒性占比？"
              icon={Zap}
              content="我们用指数方式放大差距：最接近的那个原型会被快速拉成主导（通常 >50%）。这更接近现实体验——你不会平均地像每个人，你会更像某一个。"
            />
            <DiagCard
              title="星图上的“距离”怎么读？"
              icon={Scale}
              content="星图不是线性摆放，而是用指数分布：越靠近中心，代表越容易“稍微改一点就变成它”。远处那些，更多像你的隐藏备选人格。"
            />
            <div className="md:col-span-2">
              <DiagCard
                title="你改变前后，关键差在一个点"
                icon={HandHeart}
                content="你和第二人格的差距通常集中在某一维：比如“更愿意对人开口”、或“更愿意为目标更狠一点”。这就是你从“这一只”滑向“那一只”的关键分界线。"
                color={primary.color}
                large
              />
            </div>
          </div>
        </section>

        {/* ================= 7. 底部操作栏 ================= */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="flex flex-col sm:flex-row justify-center gap-6 pb-20"
        >
          <button
            onClick={handleGeneratePoster}
            disabled={isGeneratingPoster}
            className={`group relative overflow-hidden rounded-full bg-white/10 px-12 py-5 font-bold tracking-widest text-white transition-all hover:bg-white/20 border border-white/20 backdrop-blur-md shadow-2xl ${isGeneratingPoster ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-[0_0_50px_rgba(255,255,255,0.2)] hover:-translate-y-1'}`}
          >
            <span className="relative z-10">{isGeneratingPoster ? '生成中...' : '生成朋友圈分享小卡'}</span>
            {!isGeneratingPoster && <div className="absolute inset-0 z-0 bg-gradient-to-r from-primary/30 to-accent-pink/30 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />}
          </button>
          
          <button
            onClick={resetQuiz}
            className="group relative overflow-hidden rounded-full bg-transparent px-10 py-5 font-bold tracking-widest text-white/60 transition-all hover:text-white border border-white/10 hover:border-white/30"
          >
            重新探索流形
          </button>
        </motion.div>

        {posterPreviewUrl && (
          <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-3xl border border-white/10 bg-black/60 backdrop-blur-xl overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                <div className="text-white/85 font-bold tracking-widest text-sm">小卡预览</div>
                <button
                  onClick={() => setPosterPreviewUrl(null)}
                  className="text-white/60 hover:text-white transition-colors text-sm tracking-widest"
                >
                  关闭
                </button>
              </div>
              <div className="p-4">
                <img src={posterPreviewUrl} alt="poster" className="w-full rounded-2xl border border-white/10" />
                <div className="mt-4 flex gap-3">
                  <a
                    href={posterPreviewUrl}
                    download={`Prisma_${primary.friendlyName || primary.name}.png`}
                    className="flex-1 text-center rounded-full bg-white/10 px-5 py-3 font-bold tracking-widest text-white hover:bg-white/20 transition-all border border-white/15"
                  >
                    保存图片
                  </a>
                  <button
                    onClick={() => {
                      const w = window.open();
                      if (w) {
                        w.document.write(`<img src="${posterPreviewUrl}" style="max-width:100%;height:auto;display:block;margin:0 auto" />`);
                      }
                    }}
                    className="rounded-full bg-transparent px-5 py-3 font-bold tracking-widest text-white/70 hover:text-white transition-all border border-white/10 hover:border-white/30"
                  >
                    新标签打开
                  </button>
                </div>
                <div className="mt-3 text-xs text-white/50 tracking-wide">
                  微信里打开可长按保存；桌面端可点“保存图片”或右键另存为。
                </div>
              </div>
            </div>
          </div>
        )}

      </motion.div>
    </div>
  );
};
