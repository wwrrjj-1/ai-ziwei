import { useState, useMemo, useEffect, useRef } from 'react';
import { Layout, FileText, Settings2, Info, Bot, MessageCircle, Send, Sparkles, Clock, RefreshCw, User, Calendar } from 'lucide-react';
import { astro } from 'iztro';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import axios from 'axios';
import dayjs from 'dayjs';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import './App.css';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Gender = 'male' | 'female';
type ViewType = 'chart' | 'text' | 'analysis' | 'chat';

interface UserData {
  solarDate: string;
  time: string;
  gender: Gender;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// EXACT Prompt refined for deeper utility and proactivity
const EXPERT_SYSTEM_PROMPT = `你现在是顶级紫微斗数及国学易经术数专家，拥有数十年的实战命理经验。请根据提供的文墨天机格式命盘数据，进行深度、精准且极具参考价值的挖掘分析。

### 核心分析要求：
1. **深度挖掘：** 不停留于表面星曜解释。需综合使用三合、飞星、钦天四化等核心技法。重点分析“生年四化”、“宫位自化（离心/向心）”以及“星曜组合”带来的深层影响。
2. **多维洞察：** 全面覆盖健康、学业、事业（含行业选择及职场机遇）、财运（正财/偏财/存财能力）、人际（贵人/小人位置）、婚姻（缘分强弱/配偶特征）及感情生活。
3. **精准时效：** 必须列出未来关键事件及其发生的时间跨度（误差控制在流月级别更好）、吉凶属性（吉、凶、平）及命主应对策略。
4. **流年大限全景：** 详细分析前八个大限的走势，并对每个大限内的所有流年进行逐年扫描，指出由于“限流叠宫”产生的重大转折点和具体注意事项。
5. **极具针对性的方案：** 拒绝套话。必须结合命主命格的“弱点”与“优势”，给出改运、规避风险、抓住机遇的实操性专家建议。
6. **主动与专业性：** 文风需体现深厚的国学底蕴，用词专业、严谨且富有洞察力。主动识别命盘中潜藏的特殊格局（如：杀破狼格、机月同临格等）并解读其现代意义。

*重要：结尾请务必告知用户：“以上分析基于术数理论，仅供国学研究及娱乐参考，人生掌握在自己手中。”*`;

// Utility to generate the EXACT Tree Format requested by User
const generateProfessionalTreeText = (astrolabe: any) => {
  const getMutagenPrefix = (s: any) => {
    if (s.mutagen) return `[生年${s.mutagen}]`;
    if (s.selfMutagen) return `(↓:${s.selfMutagen})`;
    if (s.xiangXinMutagen) return `(↑:${s.xiangXinMutagen})`;
    return '';
  };

  let text = "文墨天机紫微斗数命盘\n│\n";
  text += "├API 版本 : 1.1.1\n";
  text += "├App版本 : 2.5.3\n";
  text += "├安星码 : C5VUC\n";
  text += "├符号定义\n";
  text += "│ ├(↓:离心自化)\n";
  text += "│ ├(↑:向心自化，从对宫化入)\n";
  text += "│ ├(┏ : 生日前小限)\n";
  text += "│ └( ┓: 生日后小限)\n│\n";

  text += "├基本信息\n";
  text += "│ │\n";
  text += ` │ ├性别 : ${astrolabe.gender}\n`;
  text += ` │ ├公历时间 : ${astrolabe.solarDate}\n`;
  text += ` │ ├农历时间 : ${astrolabe.lunarDate.toString()}\n`;
  text += ` │ ├五行局数 : ${astrolabe.fiveElementsClass}\n`;
  const bodyPalace = astrolabe.palaces.find((p: any) => p.isBodyPalace);
  text += ` │ └身主:${astrolabe.body}; 命主:${astrolabe.soul}; 子年斗君:巳; 身宫:${bodyPalace ? bodyPalace.earthlyBranch : ''}\n│\n`;

  text += "├命盘十二宫\n│ │ \n";
  astrolabe.palaces.forEach((p: any) => {
    text += ` ├${p.name}宫[${p.heavenlyStem}${p.earthlyBranch}]\n`;
    text += ` │ ├主星 : ${p.majorStars.map((s: any) => `${s.name}[${s.brightness}]${getMutagenPrefix(s)}`).join(', ') || '无'}\n`;
    text += ` │ ├辅星 : ${p.minorStars.map((s: any) => `${s.name}[${s.brightness}]${getMutagenPrefix(s)}`).join(', ') || '无'}\n`;
    text += ` │ ├小星 : ${p.adjectiveStars.map((s: any) => s.name).join(', ') || '无'}\n`;
    text += ` │ ├神煞\n`;
    text += ` │ │ ├岁前星 : ${p.suiqian12 || ''}\n`;
    text += ` │ │ ├将前星 : ${p.jiangqian12 || ''}\n`;
    text += ` │ │ ├十二长生 : ${p.changsheng12 || ''}\n`;
    text += ` │ │ └太岁煞禄 : ${p.boshi12 || ''}\n`;
    text += ` │ ├大限 : ${p.decadal.range[0]}~${p.decadal.range[1]}虚岁\n`;
    text += ` │ ├小限 : ${p.ages.join(',')}虚岁\n`;
    text += ` │ ├流年 : ${p.ages.join(',')}虚岁\n`;
    text += ` │ └限流叠宫 : 无\n │ \n`;
  });

  text += "├大限流年信息\n";
  text += "└[备注: 无]";
  return text;
};

// --- Visual Components (Chart) ---

// Vertical Star Component (Wenmo Style)
const VerticalStar = ({ star, type }: { star: any, type: 'major' | 'minor' | 'adj' }) => {
  const name = typeof star === 'string' ? star : star.name;
  const bright = star.brightness || '';
  const mutagen = star.mutagen || '';
  const selfMutagen = star.selfMutagen || '';
  const xiangXinMutagen = star.xiangXinMutagen || '';

  const getBrightColor = (b: string) => {
    if (['庙', '旺'].includes(b)) return 'text-[#D32F2F]'; // Wenmo Red
    if (['平', '得'].includes(b)) return 'text-[#333]';
    return 'text-[#1976D2]'; // Wenmo Blue
  };

  const colorClass = type === 'major' ? getBrightColor(bright) : 'text-[#424242]';

  return (
    <div className={cn("flex flex-col items-center leading-none w-[1.1rem] shrink-0", colorClass)}>
      <div className={cn("flex flex-col items-center select-none",
        type === 'major' ? "text-[15px] font-bold" : (type === 'minor' ? "text-[13px] font-semibold" : "text-[11px] font-normal")
      )}>
        {name.split('').map((char: string, i: number) => (
          <span key={i} className="block leading-[1.1]">{char}</span>
        ))}
      </div>

      {bright && <span className="text-[9px] mt-0.5 transform scale-90 opacity-80">{bright}</span>}

      {mutagen && (
        <span className={cn("text-[9px] text-white px-[2px] rounded-[2px] mt-0.5 font-bold leading-tight transform scale-90",
          mutagen === '禄' && 'bg-[#388E3C]',
          mutagen === '权' && 'bg-[#D32F2F]',
          mutagen === '科' && 'bg-[#7B1FA2]',
          mutagen === '忌' && 'bg-[#1976D2]'
        )}>
          {mutagen}
        </span>
      )}

      {selfMutagen && <span className="text-[#D32F2F] text-[10px] font-black leading-none mt-0.5">↓{selfMutagen}</span>}
      {xiangXinMutagen && <span className="text-[#388E3C] text-[10px] font-black leading-none mt-0.5">↑{xiangXinMutagen}</span>}
    </div>
  );
};

const FIVE_ELEMENTS: Record<string, string> = {
  '甲': '木', '乙': '木', '寅': '木', '卯': '木',
  '丙': '火', '丁': '火', '巳': '火', '午': '火',
  '戊': '土', '己': '土', '辰': '土', '戌': '土', '丑': '土', '未': '土',
  '庚': '金', '辛': '金', '申': '金', '酉': '金',
  '壬': '水', '癸': '水', '子': '水', '亥': '水',
};

const ELEMENT_COLORS: Record<string, string> = {
  '木': 'text-[#2E7D32]',
  '火': 'text-[#D32F2F]',
  '土': 'text-[#8D6E63]',
  '金': 'text-[#757575]',
  '水': 'text-[#0277BD]',
};

const getElementColor = (char: string) => {
  const element = FIVE_ELEMENTS[char] || '';
  return ELEMENT_COLORS[element] || 'text-gray-800';
};

// Palace Component (Wenmo Style)
const Palace = ({ palace, gridArea }: { palace: any, gridArea: string }) => {
  const { name, heavenlyStem, earthlyBranch, majorStars, minorStars, adjectiveStars, decadal, ages } = palace;
  const shenSha = {
    boshi12: palace.boshi12 || '',
    jiangqian12: palace.jiangqian12 || '',
    suiqian12: palace.suiqian12 || '',
    changsheng12: palace.changsheng12 || ''
  };

  return (
    <div className={cn("border border-[#BDBDBD] relative p-1 md:p-1.5 flex flex-col justify-between bg-white min-h-[140px] md:min-h-0", gridArea)}>
      {/* Stars Flow */}
      <div className="flex gap-0.5 flex-wrap items-start content-start min-h-[60px]">
        {majorStars.map((s: any, idx: number) => <VerticalStar key={`maj-${idx}`} star={s} type="major" />)}
        {minorStars.map((s: any, idx: number) => <VerticalStar key={`min-${idx}`} star={s} type="minor" />)}
        {adjectiveStars.map((s: any, idx: number) => <VerticalStar key={`adj-${idx}`} star={s} type="adj" />)}
      </div>

      {/* Shen Sha & Limits */}
      <div className="flex-grow flex flex-col justify-end mt-0.5 md:mt-1">
        <div className="flex gap-1 md:gap-1.5 flex-wrap mb-1 text-[9px] md:text-[10px] text-[#757575]">
          <span>{shenSha.boshi12}</span>
          <span className="hidden md:inline">{shenSha.jiangqian12}</span>
          <span className="hidden md:inline">{shenSha.suiqian12}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <div className="text-[8px] md:text-[9px] text-[#616161] flex gap-1">
            <span className="opacity-60">小限:</span> {ages.slice(0, 6).join(' ')}
          </div>
        </div>
      </div>

      {/* Overlay - ChangSheng */}
      <div className="absolute right-1 top-[40%] text-[11px] text-[#757575] font-medium [writing-mode:vertical-lr] tracking-widest opacity-80 select-none">
        {shenSha.changsheng12}
      </div>

      {/* Footer - Palace Name & Decade */}
      <div className="flex justify-between items-end pt-1 border-t border-[#E0E0E0] mt-1 select-none">
        <div className="text-[11px] md:text-[13px] font-bold text-[#212121] leading-none mb-0.5">{decadal.range[0]} - {decadal.range[1]}</div>
        <div className="flex items-end gap-1">
          <span className="text-[9px] md:text-[11px] font-bold text-[#9E9E9E] leading-none mb-0.5">{heavenlyStem}{earthlyBranch}</span>
          <div className="bg-[#FF9800] text-white px-1 md:px-2 py-[1px] md:py-[2px] rounded-[3px] text-[10px] md:text-[12px] font-bold shadow-sm">
            {name}
          </div>
        </div>
      </div>
    </div>
  );
};

// Tree Text Component
const TreeAnalysis = ({ astrolabe }: { astrolabe: any }) => {
  const treeText = useMemo(() => generateProfessionalTreeText(astrolabe), [astrolabe]);

  return (
    <div className="h-full bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col overflow-hidden">
      <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
        <h3 className="font-bold text-gray-700 flex items-center gap-2"><FileText className="w-4 h-4" /> 结构化文本报告 (文墨标准)</h3>
        <button className="text-xs text-blue-600 hover:text-blue-800" onClick={() => navigator.clipboard.writeText(treeText)}>复制全文</button>
      </div>
      <pre className="p-6 text-xs font-mono leading-relaxed text-gray-600 overflow-auto flex-grow bg-slate-50">
        {treeText}
      </pre>
    </div>
  );
};

// Tree Text Generation Utility completed above.

// AI Streaming Utility
const streamAIResponse = async (
  url: string,
  key: string,
  body: any,
  onToken: (token: string) => void,
  onComplete?: (fullText: string) => void,
  onError?: (err: any) => void
) => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        ...body,
        stream: true
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.error?.message || `HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder('utf-8');
    let fullContent = '';

    if (!reader) throw new Error('ReadableStream not supported');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || '';
            if (content) {
              fullContent += content;
              onToken(content);
            }
          } catch (e) {
            // Partial JSON or other data
          }
        }
      }
    }
    onComplete?.(fullContent);
  } catch (err: any) {
    console.error("Stream AI Error:", err);
    onError?.(err);
  }
};

// AI Analysis Component
const AIAnalysis = ({ chartData, analysis, setAnalysis }: { chartData: string, analysis: string, setAnalysis: (s: string) => void | any }) => {
  const [loading, setLoading] = useState(false);

  const startAnalysis = async () => {
    setLoading(true);
    setAnalysis(''); // Clear previous for streaming

    await streamAIResponse(
      'https://api.deepseek.com/chat/completions',
      import.meta.env.VITE_DEEPSEEK_API_KEY,
      {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: EXPERT_SYSTEM_PROMPT },
          { role: 'user', content: chartData }
        ],
        temperature: 0.7,
        max_tokens: 4096
      },
      (token) => {
        setAnalysis((prev: string) => prev + token);
      },
      () => {
        setLoading(false);
      },
      (err) => {
        setAnalysis(`分析失败: ${err.message || '网络连接或 API Key 异常'}`);
        setLoading(false);
      }
    );
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b flex justify-between items-center bg-purple-50">
        <div className="flex items-center gap-2 text-purple-800 font-bold">
          <Bot className="w-5 h-5" /> DeepSeek 专家级深度命理报告
        </div>
        <button
          onClick={startAnalysis}
          disabled={loading}
          className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-full text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <span className="flex items-center justify-center w-4 h-4">
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          </span>
          <span>{analysis ? '重新排盘分析' : '开始专家分析'}</span>
        </button>
      </div>
      <div className="flex-grow overflow-auto p-8 relative">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-4">
            <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
            <p className="animate-pulse font-medium">大师正在推演流年大限，请稍候...</p>
          </div>
        ) : analysis ? (
          <div className="prose prose-slate max-w-none text-gray-800 leading-relaxed font-sans">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysis}</ReactMarkdown>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4">
            <Bot className="w-20 h-20 opacity-10" />
            <p>点击上方按钮，生成万字深度详批</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Chat Component
const ChatInterface = ({ chartData, messages, setMessages, existingAnalysis }: { chartData: string, messages: ChatMessage[], setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>, existingAnalysis?: string }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const newMsg: ChatMessage = { role: 'user', content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setLoading(true);

    const assistantMsg: ChatMessage = { role: 'assistant', content: '', timestamp: Date.now() };
    setMessages(prev => [...prev, assistantMsg]);

    await streamAIResponse(
      'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      import.meta.env.VITE_ZHIPU_API_KEY,
      {
        model: 'glm-4-plus',
        messages: [
          {
            role: 'system', content: EXPERT_SYSTEM_PROMPT + `
          
          ### 交互解读准则：
          1. **紧扣命盘：** 你的所有回答必须以提供的【命盘数据】和【前期分析结果】为唯一依据。严禁脱离实际数据空谈或给出通用的星座式建议。
          2. **直击痛点：** 针对用户的问题，先从命盘中找到支撑数据（如：看事业先看官禄宫及三方四正），再给出详尽解答。
          3. **拒绝说教与空话：** 回答要详尽、专业、客观。必须分析出用户未察觉的深层逻辑（如：为何某年财运好却存不住钱）。
          4. **极致主动：** 
             - 答完用户问题后，必须根据命盘现状主动指出：
               - a. 用户目前（当前流年）最应该关注的一件事。
               - b. 命盘中下一个即将到来的重大机遇或挑战的时间点。
               - c. 建议用户接下来可以深入咨询的命理方向。
          5. **专家底蕴：** 回答要体现出“大师级”的全局观和细致观察。你已开启 glm-4-plus 联网搜索，可结合当前年份的宏观背景给出更务实的建议。`
          },
          { role: 'system', content: `当前时间为${new Date().toLocaleDateString('zh-CN')}` },
          { role: 'user', content: `这是我的命盘数据：\n${chartData}${existingAnalysis ? `\n\n此前的专家深度分析报告：\n${existingAnalysis}` : ''}` },
          ...messages.map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content: input }
        ],
        max_tokens: 4096
      },
      (token) => {
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last.role === 'assistant') {
            return [...prev.slice(0, -1), { ...last, content: last.content + token }];
          }
          return prev;
        });
      },
      () => {
        setLoading(false);
      },
      (err) => {
        setMessages(prev => {
          const last = prev[prev.length - 1];
          return [...prev.slice(0, -1), { ...last, content: `连接异常: ${err.message || '请重试'}` }];
        });
        setLoading(false);
      }
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#f0f2f5]">
      <div className="h-14 bg-white border-b flex items-center px-4 shadow-sm shrink-0">
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-3">
          <Bot className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-gray-800">智谱 AI 命理解读</h3>
          <p className="text-xs text-green-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Expert Mode
          </p>
        </div>
      </div>

      <div className="flex-grow overflow-auto p-4 space-y-4" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-10 text-sm">
            <p>命盘数据已加载</p>
            <p className="mt-2 text-gray-500 font-medium">您可以咨询关于事业、财运、婚姻的详细流年运势</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {['分析我未来三年的财运', '我的婚姻状况如何？', '今年工作有变动吗？'].map(q => (
                <button key={q} onClick={() => setInput(q)} className="bg-white px-3 py-1 rounded-full border hover:bg-gray-50 transition-colors text-blue-600">{q}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={cn("flex w-full", m.role === 'user' ? 'justify-end' : 'justify-start')}>
            {m.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2 mt-1 shrink-0">
                <Bot className="w-4 h-4 text-blue-600" />
              </div>
            )}
            <div className={cn(
              "max-w-[85%] rounded-2xl px-6 py-4 text-sm shadow-sm leading-relaxed",
              m.role === 'user'
                ? 'bg-blue-600 text-white rounded-br-none'
                : 'bg-white text-gray-800 rounded-tl-none border border-gray-100 prose prose-slate'
            )}>
              {m.role === 'assistant' ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown> : m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start items-center">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2 shrink-0">
              <Bot className="w-4 h-4 text-blue-600" />
            </div>
            <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-sm border border-gray-100">
              <div className="flex gap-1.5">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200"></span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t shrink-0">
        <div className="relative flex items-center">
          <input
            className="w-full bg-gray-100 text-gray-800 rounded-full px-5 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all text-sm"
            placeholder="输入您的问题..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="absolute right-2 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---
export default function App() {
  const [view, setView] = useState<ViewType>('chart');
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Default to CURRENT time
  const [data, setData] = useState<UserData>(() => {
    const now = dayjs();
    return {
      solarDate: now.format('YYYY-MM-DD'),
      time: now.format('HH:mm'),
      gender: 'male'
    };
  });

  // Calculate Chart
  // Responsive Chart Scaling Logic
  const [chartScale, setChartScale] = useState(1);
  const chartOuterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateScale = () => {
      if (window.innerWidth < 768 && chartOuterRef.current) {
        const containerWidth = chartOuterRef.current.clientWidth;
        // Target 700px min width for the chart to be readable
        const scale = (containerWidth - 16) / 700;
        setChartScale(Math.min(scale, 1));
      } else {
        setChartScale(1);
      }
    };

    window.addEventListener('resize', updateScale);
    updateScale();
    return () => window.removeEventListener('resize', updateScale);
  }, [view]);

  const astrolabe = useMemo(() => {
    const [h] = data.time.split(':').map(Number);
    const timeIndex = h === 23 ? 0 : Math.floor((h + 1) / 2);
    return astro.bySolar(data.solarDate, timeIndex, data.gender === 'male' ? '男' : '女', true, 'zh-CN');
  }, [data]);

  // EXACT Tree format for AI context
  const expertChartText = useMemo(() => generateProfessionalTreeText(astrolabe), [astrolabe]);

  // Reset analysis when data changes substantially (conceptually user might want to keep it, but usually new chart = new analysis)
  // For now, let's keep it manual clear or just let user regenerate. 
  // Actually, if chart changes, the previous analysis is invalid.
  // We remove the auto-reset effect to ensure persistence
  // Analysis and messages only clear when the user manually changes the birth date or name significantly (if we had specific user data)
  // For now, let's keep them across view changes.
  useEffect(() => {
    // Only reset if it's a completely new calculation, but we want persistence as per user feedback.
    // So we don't clear them here anymore.
  }, [data.solarDate, data.time, data.gender]);


  const setToCurrent = () => {
    const now = dayjs();
    setData(prev => ({
      ...prev,
      solarDate: now.format('YYYY-MM-DD'),
      time: now.format('HH:mm')
    }));
  };

  // Improved Date Input Handler
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = e.target.value;
    const currentMonthDay = data.solarDate.substring(5);
    setData(prev => ({ ...prev, solarDate: `${newYear}-${currentMonthDay}` }));
  };

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const yrs = [];
    for (let i = currentYear; i >= 1900; i--) {
      yrs.push(i);
    }
    return yrs;
  }, []);

  const PALACE_GRID: Record<string, string> = {
    '巳': 'col-start-1 row-start-1', '午': 'col-start-2 row-start-1', '未': 'col-start-3 row-start-1', '申': 'col-start-4 row-start-1',
    '辰': 'col-start-1 row-start-2', '酉': 'col-start-4 row-start-2',
    '卯': 'col-start-1 row-start-3', '戌': 'col-start-4 row-start-3',
    '寅': 'col-start-1 row-start-4', '丑': 'col-start-2 row-start-4', '子': 'col-start-3 row-start-4', '亥': 'col-start-4 row-start-4',
  };

  return (
    <div className="h-screen w-screen bg-[#f3f4f6] flex flex-col text-[#333] font-sans overflow-hidden">
      {/* Top Navigation - Responsive Height */}
      <header className="h-14 md:h-16 bg-white shadow-sm flex items-center justify-between px-3 md:px-6 z-20 shrink-0">
        <div className="flex items-center gap-1.5 md:gap-2">
          <div className="w-7 h-7 md:w-8 md:h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-base md:text-lg shadow-sm">
            紫
          </div>
          <span className="font-bold text-base md:text-lg tracking-tight text-gray-800">
            紫微<span className="hidden sm:inline">斗数</span>
            <span className="text-gray-400 font-normal text-[10px] ml-1 hidden xs:inline">PRO</span>
          </span>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-lg gap-1">
          {[
            { id: 'chart', label: '命盘', icon: Layout },
            { id: 'text', label: '报告', icon: FileText },
            { id: 'analysis', label: 'AI', icon: Sparkles },
            { id: 'chat', label: '咨询', icon: MessageCircle },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setView(item.id as ViewType)}
              className={cn("px-2 md:px-4 py-1.5 rounded-md text-xs md:text-sm font-medium flex items-center gap-1.5 transition-all",
                view === item.id
                  ? "bg-white text-orange-600 shadow-sm font-bold"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
              )}
            >
              <item.icon className="w-3.5 h-3.5 md:w-4 h-4" />
              <span className={cn(view === item.id ? "inline" : "hidden sm:inline")}>{item.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Main Content - Vertical on Mobile, Horizontal on Desktop */}
      <div className="flex-grow flex flex-col md:flex-row overflow-hidden relative">
        {/* Sidebar Controls - Drawer-like on Mobile, Fixed on Desktop */}
        <aside className={cn(
          "bg-white border-r border-gray-200 flex flex-col p-4 md:p-5 gap-4 md:gap-6 z-10 shrink-0 overflow-y-auto transition-all",
          "w-full md:w-80 h-auto md:h-full border-b md:border-b-0",
          view !== 'chart' && "hidden md:flex" // Hide sidebar on analysis/chat views on mobile
        )}>

          {/* Date/Time Control */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Settings2 className="w-4 h-4" /> 基础信息
              </h3>
              <button
                onClick={setToCurrent}
                className="text-xs flex items-center gap-1 text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
              >
                <Clock className="w-3 h-3" /> 设为此时
              </button>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setData(d => ({ ...d, gender: 'male' }))}
                  className={cn("flex flex-col items-center justify-center py-3 rounded-lg border transition-all",
                    data.gender === 'male' ? "bg-blue-50 border-blue-200 text-blue-700 font-bold ring-1 ring-blue-200" : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                  )}
                >
                  <User className="w-5 h-5 mb-1" /> 乾造 (男)
                </button>
                <button
                  onClick={() => setData(d => ({ ...d, gender: 'female' }))}
                  className={cn("flex flex-col items-center justify-center py-3 rounded-lg border transition-all",
                    data.gender === 'female' ? "bg-pink-50 border-pink-200 text-pink-700 font-bold ring-1 ring-pink-200" : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                  )}
                >
                  <User className="w-5 h-5 mb-1" /> 坤造 (女)
                </button>
              </div>

              <div className="space-y-3">
                {/* Year Shortcut */}
                <div>
                  <label className="text-xs text-gray-500 font-medium ml-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> 快速年份</label>
                  <select
                    className="w-full mt-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-200 outline-none"
                    value={data.solarDate.substring(0, 4)}
                    onChange={handleYearChange}
                  >
                    {years.map(y => <option key={y} value={y}>{y}年</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-500 font-medium ml-1">详细公历日期</label>
                  <input
                    type="date"
                    value={data.solarDate}
                    onChange={e => setData(d => ({ ...d, solarDate: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium ml-1">出生时辰</label>
                  <input
                    type="time"
                    value={data.time}
                    onChange={e => setData(d => ({ ...d, time: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
            <h4 className="flex items-center gap-2 text-orange-800 font-bold text-sm mb-2">
              <Info className="w-4 h-4" /> 实时计算中
            </h4>
            <p className="text-xs text-orange-700 leading-relaxed opacity-80">
              当前排盘基于 <strong>Iztro</strong> 专业引擎计算。
              已启用专家级 AI 分析模式。
            </p>
          </div>
        </aside>

        {/* View Area - Reduced padding on mobile */}
        <main className="flex-grow bg-[#F5F7FA] p-2 md:p-8 overflow-auto flex justify-center relative pb-20 md:pb-8">
          <div className="w-full max-w-[1000px] h-full flex flex-col">
            {view === 'chart' && (
              <div ref={chartOuterRef} className="w-full bg-white shadow-lg md:shadow-xl rounded-sm border border-gray-200 p-0.5 md:p-1 overflow-hidden">
                <div
                  className="min-w-[700px] aspect-square grid grid-cols-4 grid-rows-4 w-full bg-[#FAFAFA] border border-gray-300 transition-transform duration-300 ease-out origin-top-left"
                  style={{ transform: chartScale < 1 ? `scale(${chartScale})` : 'none' }}
                >
                  {/* Center Box */}
                  <div className="col-start-2 col-end-4 row-start-2 row-end-4 flex flex-col items-center p-4 border border-[#BDBDBD] bg-white text-[#424242] overflow-hidden">
                    {/* Bazi Pillars */}
                    <div className="w-full flex justify-around items-center mb-6 pt-2 border-b border-dashed border-gray-100 pb-4">
                      {astrolabe.chineseDate.split(' ').map((pillar: string, pillarIdx: number) => (
                        <div key={pillarIdx} className="flex flex-col items-center gap-1">
                          <div className="flex flex-col items-center leading-none">
                            <span className={cn("text-2xl font-serif font-bold", getElementColor(pillar[0]))}>{pillar[0]}</span>
                            <span className={cn("text-2xl font-serif font-bold", getElementColor(pillar[1]))}>{pillar[1]}</span>
                          </div>
                          <span className="text-[10px] text-gray-400 mt-1">
                            {['年', '月', '日', '时'][pillarIdx]}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs mb-6 px-4">
                      <div className="flex justify-between w-28"><span className="text-gray-400">局数</span> <span className="font-bold">{astrolabe.fiveElementsClass}</span></div>
                      <div className="flex justify-between w-28"><span className="text-gray-400">性别</span> <span className="font-bold">{data.gender === 'male' ? '男' : '女'}</span></div>
                      <div className="flex justify-between w-28"><span className="text-gray-400">命主</span> <span className="font-bold">{astrolabe.soul}</span></div>
                      <div className="flex justify-between w-28"><span className="text-gray-400">身主</span> <span className="font-bold">{astrolabe.body}</span></div>
                    </div>

                    {/* Major Cycles (Da Yun) */}
                    <div className="w-full mt-auto overflow-hidden">
                      <div className="text-[10px] text-gray-400 text-center mb-2 flex items-center justify-center gap-2">
                        <div className="h-px w-8 bg-gray-100"></div> 大运走势 <div className="h-px w-8 bg-gray-100"></div>
                      </div>
                      <div className="flex overflow-x-auto no-scrollbar gap-3 pb-2 px-1">
                        {[...astrolabe.palaces]
                          .filter((p: any) => p.decadal && p.decadal.range?.[0] !== undefined)
                          .sort((a: any, b: any) => a.decadal.range[0] - b.decadal.range[0])
                          .map((p: any, idx: number) => {
                            const birthYear = parseInt(data.solarDate.split('-')[0]);
                            const startYear = birthYear + p.decadal.range[0] - 1;
                            return (
                              <div key={idx} className="flex flex-col items-center min-w-[3.5rem] shrink-0">
                                <span className={cn("text-sm font-bold", getElementColor(p.heavenlyStem))}>{p.heavenlyStem}{p.earthlyBranch}</span>
                                <span className="text-[10px] text-gray-500 font-medium">{p.decadal.range[0]}岁</span>
                                <span className="text-[9px] text-gray-400 transform scale-90">{startYear}</span>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    <div className="mt-4 pt-2 border-t border-gray-100 w-full text-center">
                      <div className="text-[10px] text-gray-400 italic">公历 {data.solarDate} {data.time} | 农历 {astrolabe.lunarDate.toString()}</div>
                    </div>
                  </div>

                  {astrolabe.palaces.map((p: any, idx: number) => (
                    <Palace key={idx} palace={p} gridArea={PALACE_GRID[p.earthlyBranch]} />
                  ))}
                </div>
              </div>
            )}

            {view === 'text' && <TreeAnalysis astrolabe={astrolabe} />}
            {view === 'analysis' && (
              <AIAnalysis
                chartData={expertChartText}
                analysis={aiAnalysisResult}
                setAnalysis={setAiAnalysisResult}
              />
            )}
            {view === 'chat' && (
              <div className="h-full rounded-xl overflow-hidden shadow-lg border border-gray-200">
                <ChatInterface
                  chartData={expertChartText}
                  messages={chatMessages}
                  setMessages={setChatMessages}
                  existingAnalysis={aiAnalysisResult}
                />
              </div>
            )}
          </div>

          {/* Mobile Bottom Quick Actions */}
          {view === 'chart' && (
            <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-100 p-3 flex gap-3 md:hidden z-30 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
              <button
                onClick={() => setView('analysis')}
                className="flex-1 bg-purple-600 text-white rounded-xl py-3 px-4 flex items-center justify-center gap-2 font-bold shadow-lg shadow-purple-200 active:scale-95 transition-all text-sm"
              >
                <Sparkles className="w-4 h-4" /> 专家深度分析
              </button>
              <button
                onClick={() => setView('chat')}
                className="flex-1 bg-blue-600 text-white rounded-xl py-3 px-4 flex items-center justify-center gap-2 font-bold shadow-lg shadow-blue-200 active:scale-95 transition-all text-sm"
              >
                <MessageCircle className="w-4 h-4" /> 命理专家咨询
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
