import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Lang = 'en' | 'zh';
export type Theme = 'light' | 'dark';

const THEME_KEY = 'repro.theme2';
const LANG_KEY = 'pe-lang';

const EN = {
  partOf: 'part of Repro Suite',
  groupPE: 'Paper Explainer',
  groupSuite: 'Repro Suite',
  navMake: 'Make a video',
  navExamples: 'Examples',
  navHow: 'How it works',
  navPricing: 'Pricing',
  navFeedback: 'Feedback',
  appRepro: 'Paper Repro Agent',
  appBench: 'Benchmark',
  appLite: 'Repro Lite',
  appReading: 'Reading Companion',
  appIndex: 'IndexBoard',
  appAll: 'All apps',
  newTab: 'opens in a new tab',
  menu: 'Menu',
  closeMenu: 'Close menu',
  toDark: 'Switch to dark theme',
  toLight: 'Switch to light theme',
  language: 'Language',

  heroTitle: 'Understand any AI paper in under a minute.',
  heroSub:
    'Paste an arXiv link. We turn the paper into a short narrated video in English and 中文, and check every quote and number on screen against the paper text.',
  heroMake: 'Make a video',
  heroWatch: 'Watch an example',
  latestVideo: 'Latest video',
  loadingVideos: 'Loading videos',
  loadVideosError: 'Could not load the videos. Please refresh the page.',
  statVideos: 'videos made',
  statLangs: 'languages',
  statChecked: 'quotes and numbers checked',
  statRemoved: 'removed by the check',
  statTimeValue: '~4 min',
  statTime: 'about 4 minutes per video',

  makeTitle: 'Make a video',
  makeSub: 'Paste a paper link: arXiv, a PDF link or a DOI. You can make 3 free videos a day.',
  makeLabel: 'Paper link (arXiv, PDF or DOI)',
  makeBtn: 'Make my video',
  makeSending: 'Starting',
  makeEmpty: 'Paste a paper link first.',
  networkError: 'Could not reach the server. Please try again.',
  stepQueued: 'Waiting in line',
  stepRead: 'Reading the paper',
  stepScript: 'Writing the script',
  stepCheck: 'Checking quotes and numbers',
  stepEn: 'Recording English',
  stepZh: 'Recording 中文',
  stepDone: 'Done',
  waitNote: 'Usually 3 to 5 minutes. You can leave this page open.',
  supportTitle: 'Help keep the videos running',
  supportSub: 'Each video uses a little paid AI credit. When the credit runs out, new videos pause.',
  supportBody: 'If you like Paper Explainer, you can top up the credit with any amount through WeChat Pay or Alipay. Even ¥5 makes several videos.',
  supportNote: 'We top up the AI account the same day and new videos start again. Thank you!',
  supportCta: 'Top up credits',
  optModel: 'Script model',
  optVoice: 'Voice',
  optMore: 'Options',
  voiceFemale: 'Female',
  voiceMale: 'Male',
  etaLeft: 'About {m} min left',
  etaAlmost: 'Almost done',
  etaQueued: 'Waiting for a free renderer. This can add a few minutes.',
  etaElapsed: 'elapsed',
  pollRetry: 'Connection is slow. Still trying…',
  currentStage: 'Current step',
  failedTitle: 'The video could not be made.',
  failedFallback: 'Something went wrong while making this video. Please try again later.',
  pollError: 'Lost contact with the server. Your video is still being made; refresh the page in a few minutes.',
  cachedNote: 'This paper already has a video, so here it is right away.',
  makeAnother: 'Make another video',

  dlMp4: 'Download MP4',
  dlVertical: 'Download vertical (9:16) for Douyin / Xiaohongshu / Reels',
  copyLink: 'Copy link',
  copied: 'Link copied',
  shareX: 'Share on X',
  shareLinkedIn: 'Share on LinkedIn',
  shareWeibo: 'Share on Weibo',
  shareText: 'A short video explainer of "{title}"',
  share: 'Share',
  download: 'Download MP4',
  downloading: 'Downloading',

  usefulQ: 'Was this useful?',
  usefulYes: 'Useful',
  usefulNo: 'Not useful',
  commentOptional: 'Comment (optional)',
  send: 'Send',
  sending: 'Sending',
  usefulThanks: 'Thank you for the feedback.',
  saveError: 'Could not save. Please try again.',
  pickThumb: 'Choose 👍 or 👎 first.',

  exTitle: 'Examples',
  exSub: 'Recently finished videos. Every one was checked against its paper.',
  exEmpty: 'No finished videos yet.',
  checksPassed: '✓ {n} checks passed',
  removedN: '{n} removed by the check',
  play: 'Play',
  close: 'Close',
  videoLang: 'Video language',

  howTitle: 'How it works',
  howSub: 'Four steps from paper to video.',
  how1h: 'Read',
  how1: 'We fetch the paper text from arXiv.',
  how2h: 'Script',
  how2: 'An AI model (DeepSeek) writes six scenes from the paper text only.',
  how3h: 'Check',
  how3: 'Every quote must appear word for word in the paper and every number must appear in the paper. Anything that fails is removed before recording.',
  how4h: 'Record',
  how4: 'Neural voices narrate English and 中文, and the animation is recorded to MP4 in 16:9 and 9:16.',
  notCheckTitle: 'What it does not check',
  notCheck: 'Short labels in diagrams are summaries. It is a learning aid; read the paper for the details.',
  reproTitle: 'Does the result hold?',
  reproSub: 'Paper Repro Agent re-runs the experiment.',

  pricingTitle: 'Pricing',
  pricingSub: 'Start free. Order a reviewed Studio video when it matters.',
  planFree: 'Free',
  planStudio: 'Studio',
  perPaper: 'per paper',
  launchPrice: 'Launch price',
  free1: 'Any arXiv paper',
  free2: 'English and 中文',
  free3: '16:9 and 9:16 MP4',
  free4: '3 videos a day',
  studio1: 'A person reviews the script before recording',
  studio2: '60 to 90 seconds instead of 40',
  studio3: 'Your name or lab logo on the end card',
  studio4: 'Captions file (SRT) for social media',
  studio5: 'Delivered by email within 24 hours',
  orderBtn: 'Order a Studio video',
  orderTitle: 'Order a Studio video',
  orderSub: 'Launch price ¥10 per paper. Send the order, choose WeChat Pay or Alipay, pay, then tap "I have paid". We confirm every order by email.',
  email: 'Email',
  arxivLink: 'Paper link (arXiv, PDF or DOI)',
  language2: 'Language',
  langEnglish: 'English',
  langChinese: '中文',
  langBoth: 'Both',
  notes: 'Notes',
  notesPh: 'Name or lab logo for the end card, audience, anything we should know',
  required: 'required',
  optional: 'optional',
  errEmail: 'Enter a valid email address.',
  errArxiv: 'Enter an arXiv id, or a link to the paper (PDF link or DOI also work).',
  sendOrder: 'Send order',
  orderThanks: 'Order received. Choose how you would like to pay.',
  payChoose: 'How would you like to pay?',
  payScan: 'Scan this code with {m}, and pay {p}.',
  payIPaid: 'I have paid',
  payBack: 'Choose another method',
  payOrderNo: 'Order number',
  payDone: 'Thank you! We will check the payment and send your video by email within 24 hours.',
  payFail: 'Could not record the payment, please try again.',
  failedHelp: 'Tell us what went wrong',
  payTitle: 'Pay {p} with WeChat Pay or Alipay',
  payWechat: 'WeChat Pay',
  payAlipay: 'Alipay',
  payNote: 'Put your email in the payment note so we can match it to your order. Your video is delivered by email within 24 hours after we see the payment.',

  fbTitle: 'Feedback',
  fbSub: 'Tell us how Paper Explainer works for you.',
  fbCount: '{n} responses received so far',
  fbRating: 'How useful is this?',
  fbStar: '{n} of 5',
  fbUse: 'What would you use it for?',
  useStudying: 'Studying',
  useTeaching: 'Teaching',
  useOwnPaper: 'Sharing my own paper',
  useSocial: 'Social media',
  useOther: 'Other',
  fbComment: 'Comment',
  fbEmail: 'Email (optional)',
  fbSend: 'Send feedback',
  fbNeedRating: 'Choose a rating first.',
  fbThanks: 'Thank you',
  fbThanksSub: 'Your feedback helps us decide what to build next.',
  fbAnother: 'Send more feedback',

  footerLine: 'Paper Explainer is part of Repro Suite.',
  footerNote: 'Videos are made from public arXiv papers.',
};

export type StringKey = keyof typeof EN;

const ZH: Record<StringKey, string> = {
  partOf: 'Repro Suite 旗下应用',
  groupPE: 'Paper Explainer',
  groupSuite: 'Repro Suite',
  navMake: '制作视频',
  navExamples: '示例',
  navHow: '工作原理',
  navPricing: '价格',
  navFeedback: '反馈',
  appRepro: 'Paper Repro Agent',
  appBench: '基准测试',
  appLite: 'Repro Lite',
  appReading: 'Reading Companion',
  appIndex: 'IndexBoard',
  appAll: '全部应用',
  newTab: '在新标签页打开',
  menu: '菜单',
  closeMenu: '关闭菜单',
  toDark: '切换到深色主题',
  toLight: '切换到浅色主题',
  language: '语言',

  heroTitle: '一分钟内读懂任何一篇 AI 论文。',
  heroSub: '粘贴 arXiv 链接，我们会把论文变成一段带旁白的英文和中文短视频，并把屏幕上的每一句引用和每一个数字与论文原文逐一核对。',
  heroMake: '制作视频',
  heroWatch: '观看示例',
  latestVideo: '最新视频',
  loadingVideos: '正在加载视频',
  loadVideosError: '视频加载失败，请刷新页面。',
  statVideos: '个视频已制作',
  statLangs: '种语言',
  statChecked: '处引用和数字已核对',
  statRemoved: '处被核对移除',
  statTimeValue: '约 4 分钟',
  statTime: '每个视频的制作时间',

  makeTitle: '制作视频',
  makeSub: '粘贴论文链接：arXiv、PDF 链接或 DOI。每天可免费制作 3 个视频。',
  makeLabel: '论文链接（arXiv、PDF 或 DOI）',
  makeBtn: '生成我的视频',
  makeSending: '正在提交',
  makeEmpty: '请先粘贴论文链接。',
  networkError: '无法连接服务器，请重试。',
  stepQueued: '排队中',
  stepRead: '阅读论文',
  stepScript: '撰写脚本',
  stepCheck: '核对引用和数字',
  stepEn: '录制英文版',
  stepZh: '录制中文版',
  stepDone: '完成',
  waitNote: '通常需要 3 到 5 分钟。您可以保持此页面打开。',
  supportTitle: '帮忙让视频持续制作',
  supportSub: '每个视频都会消耗一点付费 AI 额度。额度用完后，新视频会暂停。',
  supportBody: '如果你喜欢 Paper Explainer，可以用微信支付或支付宝充值任意金额。哪怕 ¥5 也能做好几个视频。',
  supportNote: '我们会当天为 AI 账户充值，新视频随即恢复。谢谢！',
  supportCta: '为额度充值',
  optModel: '脚本模型',
  optVoice: '声音',
  optMore: '选项',
  voiceFemale: '女声',
  voiceMale: '男声',
  etaLeft: '大约还需 {m} 分钟',
  etaAlmost: '即将完成',
  etaQueued: '正在等待空闲的渲染器，可能需要多等几分钟。',
  etaElapsed: '已用时',
  pollRetry: '网络较慢，仍在重试…',
  currentStage: '当前步骤',
  failedTitle: '视频制作失败。',
  failedFallback: '制作视频时出现问题，请稍后再试。',
  pollError: '与服务器的连接中断。视频仍在制作中，请几分钟后刷新页面。',
  cachedNote: '这篇论文已有视频，直接为您呈现。',
  makeAnother: '再制作一个视频',

  dlMp4: '下载 MP4',
  dlVertical: '下载竖版 (9:16)，适用于抖音 / 小红书 / Reels',
  copyLink: '复制链接',
  copied: '链接已复制',
  shareX: '分享到 X',
  shareLinkedIn: '分享到 LinkedIn',
  shareWeibo: '分享到微博',
  shareText: '《{title}》的视频讲解',
  share: '分享',
  download: '下载 MP4',
  downloading: '正在下载',

  usefulQ: '这个视频有帮助吗？',
  usefulYes: '有帮助',
  usefulNo: '没帮助',
  commentOptional: '评论（可选）',
  send: '发送',
  sending: '正在发送',
  usefulThanks: '感谢您的反馈。',
  saveError: '保存失败，请重试。',
  pickThumb: '请先选择 👍 或 👎。',

  exTitle: '示例',
  exSub: '最近完成的视频，每一个都已与论文原文核对。',
  exEmpty: '还没有完成的视频。',
  checksPassed: '✓ {n} 项核对通过',
  removedN: '{n} 处被核对移除',
  play: '播放',
  close: '关闭',
  videoLang: '视频语言',

  howTitle: '工作原理',
  howSub: '从论文到视频的四个步骤。',
  how1h: '阅读',
  how1: '我们从 arXiv 获取论文文本。',
  how2h: '脚本',
  how2: 'AI 模型（DeepSeek）仅依据论文文本撰写六个场景。',
  how3h: '核对',
  how3: '每句引用都必须在论文中逐字出现，每个数字也必须出现在论文中；未通过的内容会在录制前被移除。',
  how4h: '录制',
  how4: '神经网络语音分别用英文和中文朗读旁白，动画录制为 16:9 和 9:16 两种 MP4。',
  notCheckTitle: '不核对的内容',
  notCheck: '图示中的简短标签是概括性文字。这是学习辅助工具，细节请阅读论文原文。',
  reproTitle: '结果站得住吗？',
  reproSub: 'Paper Repro Agent 会重新运行实验。',

  pricingTitle: '价格',
  pricingSub: '免费开始。重要场合可订购经人工审核的 Studio 视频。',
  planFree: '免费版',
  planStudio: 'Studio',
  perPaper: '每篇论文',
  launchPrice: '首发价',
  free1: '任何 arXiv 论文',
  free2: '英文和中文',
  free3: '16:9 和 9:16 MP4',
  free4: '每天 3 个视频',
  studio1: '录制前由真人审核脚本',
  studio2: '时长 60 到 90 秒，而非 40 秒',
  studio3: '片尾展示您的姓名或实验室标志',
  studio4: '适用于社交媒体的字幕文件（SRT）',
  studio5: '24 小时内通过邮件交付',
  orderBtn: '订购 Studio 视频',
  orderTitle: '订购 Studio 视频',
  orderSub: '首发价每篇论文 ¥10。提交订单后，选择微信支付或支付宝，付款后点击“我已付款”。每个订单我们都会通过邮件确认。',
  email: '邮箱',
  arxivLink: '论文链接（arXiv、PDF 或 DOI）',
  language2: '语言',
  langEnglish: 'English',
  langChinese: '中文',
  langBoth: '两种都要',
  notes: '备注',
  notesPh: '片尾使用的姓名或实验室标志、目标观众，或其他需求',
  required: '必填',
  optional: '可选',
  errEmail: '请输入有效的邮箱地址。',
  errArxiv: '请输入 arXiv 编号，或论文链接（PDF 链接或 DOI 也可以）。',
  sendOrder: '提交订单',
  orderThanks: '订单已收到，请选择付款方式。',
  payChoose: '请选择付款方式',
  payScan: '请用{m}扫描二维码，支付 {p}。',
  payIPaid: '我已付款',
  payBack: '换一种方式',
  payOrderNo: '订单号',
  payDone: '谢谢！我们会核对付款，并在 24 小时内通过邮件发送视频。',
  payFail: '付款记录失败，请重试。',
  failedHelp: '告诉我们哪里出了问题',
  payTitle: '用微信支付或支付宝支付 {p}',
  payWechat: '微信支付',
  payAlipay: '支付宝',
  payNote: '付款时请在备注里填写你的邮箱，方便我们对应订单。收到付款后 24 小时内通过邮件发送视频。',

  fbTitle: '反馈',
  fbSub: '告诉我们 Paper Explainer 用起来怎么样。',
  fbCount: '目前已收到 {n} 条反馈',
  fbRating: '它对您有多大帮助？',
  fbStar: '{n} 星（共 5 星）',
  fbUse: '您会用它来做什么？',
  useStudying: '学习',
  useTeaching: '教学',
  useOwnPaper: '分享我自己的论文',
  useSocial: '社交媒体',
  useOther: '其他',
  fbComment: '评论',
  fbEmail: '邮箱（可选）',
  fbSend: '发送反馈',
  fbNeedRating: '请先选择评分。',
  fbThanks: '谢谢！',
  fbThanksSub: '您的反馈将帮助我们决定下一步做什么。',
  fbAnother: '再发送一条反馈',

  footerLine: 'Paper Explainer 是 Repro Suite 的一部分。',
  footerNote: '视频基于公开的 arXiv 论文制作。',
};

const STRINGS: Record<Lang, Record<StringKey, string>> = { en: EN, zh: ZH };

type Vars = Record<string, string | number>;

interface PrefsValue {
  lang: Lang;
  theme: Theme;
  setLang: (lang: Lang) => void;
  toggleTheme: () => void;
  t: (key: StringKey, vars?: Vars) => string;
}

const PrefsContext = createContext<PrefsValue | null>(null);

function readTheme(): Theme {
  try {
    return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

function readLang(): Lang {
  try {
    const v = localStorage.getItem(LANG_KEY);
    if (v === 'en' || v === 'zh') return v;
  } catch {
    /* storage unavailable */
  }
  return navigator.language?.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'dark') root.setAttribute('data-theme', 'dark');
  else root.removeAttribute('data-theme');
  root.classList.remove('dark');
}

applyTheme(readTheme());

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readLang);
  const [theme, setTheme] = useState<Theme>(readTheme);

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* storage unavailable */
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {
      /* storage unavailable */
    }
  }, [lang]);

  const setLang = useCallback((next: Lang) => setLangState(next), []);
  const toggleTheme = useCallback(() => setTheme((cur) => (cur === 'dark' ? 'light' : 'dark')), []);
  const t = useCallback(
    (key: StringKey, vars?: Vars) => {
      let s = STRINGS[lang][key];
      if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
      return s;
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, theme, setLang, toggleTheme, t }), [lang, theme, setLang, toggleTheme, t]);
  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs(): PrefsValue {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error('usePrefs must be used inside PrefsProvider');
  return ctx;
}
