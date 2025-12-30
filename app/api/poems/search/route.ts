import { NextResponse } from 'next/server';

// Real database of famous poems scraped from haitang-three.vercel.app/collections/88
const POEM_DATABASE = [
  {
    "title": "咏鹅",
    "author": "骆宾王",
    "dynasty": "唐",
    "genre": "五言古诗",
    "content": "鹅，鹅，鹅，曲项向天歌。\n白毛浮绿水，红掌拨清波。"
  },
  {
    "title": "江南",
    "author": "两汉乐府",
    "dynasty": "汉",
    "genre": "乐府诗",
    "content": "江南可采莲，莲叶何田田。\n鱼戏莲叶间。\n鱼戏莲叶东，鱼戏莲叶西，鱼戏莲叶南，鱼戏莲叶北。"
  },
  {
    "title": "画",
    "author": "王维",
    "dynasty": "唐",
    "genre": "五言绝句",
    "content": "远看山有色，近听水无声。\n春去花还在，人来鸟不惊。"
  },
  {
    "title": "悯农（其二）",
    "author": "李绅",
    "dynasty": "唐",
    "genre": "五言绝句",
    "content": "锄禾日当午，汗滴禾下土。\n谁知盘中餐，粒粒皆辛苦？"
  },
  {
    "title": "古朗月行",
    "author": "李白",
    "dynasty": "唐",
    "genre": "五言古诗",
    "content": "小时不识月，呼作白玉盘。\n又疑瑶台镜，飞在青云端。\n仙人垂两足，桂树何团团。\n白兔捣药成，问言与谁餐？\n蟾蜍蚀圆影，大明夜已残。\n羿昔落九乌，天人清且安。\n阴精此沦惑，去去不足观。\n忧来其如何？凄怆摧心肝。"
  },
  {
    "title": "风",
    "author": "李峤",
    "dynasty": "唐",
    "genre": "五言绝句",
    "content": "解落三秋叶，能开二月花。\n过江千尺浪，入竹万竿斜。"
  },
  {
    "title": "春晓",
    "author": "孟浩然",
    "dynasty": "唐",
    "genre": "五言绝句",
    "content": "春眠不觉晓，处处闻啼鸟。\n夜来风雨声，花落知多少。"
  },
  {
    "title": "赠汪伦",
    "author": "李白",
    "dynasty": "唐",
    "genre": "七言绝句",
    "content": "李白乘舟将欲行，忽闻岸上踏歌声。\n桃花潭水深千尺，不及汪伦送我情。"
  },
  {
    "title": "静夜思",
    "author": "李白",
    "dynasty": "唐",
    "genre": "五言绝句",
    "content": "床前明月光，疑是地上霜。\n举头望明月，低头思故乡。"
  },
  {
    "title": "寻隐者不遇",
    "author": "贾岛",
    "dynasty": "唐",
    "genre": "五言绝句",
    "content": "松下问童子，言师采药去。\n只在此山中，云深不知处。"
  },
  {
    "title": "池上二绝",
    "author": "白居易",
    "dynasty": "唐",
    "genre": "五言绝句",
    "content": "山僧对棋坐，局上竹阴清。\n映竹无人见，时闻下子声。\n小娃撑小艇，偷采白莲回。\n不解藏踪迹，浮萍一道开。"
  },
  {
    "title": "小池",
    "author": "杨万里",
    "dynasty": "宋",
    "genre": "七言绝句",
    "content": "泉眼无声惜细流，树阴照水爱晴柔。\n小荷才露尖尖角，早有蜻蜓立上头。"
  },
  {
    "title": "画鸡",
    "author": "唐寅",
    "dynasty": "明",
    "genre": "七言绝句",
    "content": "头上红冠不用裁，满身雪白走将来。\n平生不敢轻言语，一叫千门万户开。"
  },
  {
    "title": "梅花",
    "author": "王安石",
    "dynasty": "宋",
    "genre": "五言绝句",
    "content": "墙角数枝梅，凌寒独自开。\n遥知不是雪，为有暗香来。"
  },
  {
    "title": "小儿垂钓",
    "author": "胡令能",
    "dynasty": "唐",
    "genre": "七言绝句",
    "content": "蓬头稚子学垂纶，侧坐莓苔草映身。\n路人借问遥招手，怕得鱼惊不应人。"
  },
  {
    "title": "登鹳雀楼",
    "author": "王之涣",
    "dynasty": "唐",
    "genre": "五言绝句",
    "content": "白日依山尽，黄河入海流。\n欲穷千里目，更上一层楼。"
  },
  {
    "title": "望庐山瀑布",
    "author": "李白",
    "dynasty": "唐",
    "genre": "七言绝句",
    "content": "日照香炉生紫烟，遥看瀑布挂前川。\n飞流直下三千尺，疑是银河落九天。"
  },
  {
    "title": "江雪",
    "author": "柳宗元",
    "dynasty": "唐",
    "genre": "五言绝句",
    "content": "千山鸟飞绝，万径人踪灭。\n孤舟蓑笠翁，独钓寒江雪。"
  },
  {
    "title": "夜宿山寺",
    "author": "李白",
    "dynasty": "唐",
    "genre": "五言绝句",
    "content": "危楼高百尺，手可摘星辰。\n不敢高声语，恐惊天上人。"
  },
  {
    "title": "敕勒歌",
    "author": "无名氏",
    "dynasty": "南北朝",
    "genre": "乐府诗",
    "content": "敕勒川，阴山下。\n天似穹庐，笼盖四野。\n天苍苍，野茫茫，\n风吹草低见牛羊。"
  },
  {
    "title": "村居",
    "author": "高鼎",
    "dynasty": "清",
    "genre": "七言绝句",
    "content": "草长莺飞二月天，拂堤杨柳醉春烟。\n儿童散学归来早，忙趁东风放纸鸢。"
  },
  {
    "title": "咏柳",
    "author": "贺知章",
    "dynasty": "唐",
    "genre": "七言绝句",
    "content": "碧玉妆成一树高，万条垂下绿丝绦。\n不知细叶谁裁出，二月春风似剪刀。"
  },
  {
    "title": "赋得古原草送别",
    "author": "白居易",
    "dynasty": "唐",
    "genre": "五言律诗",
    "content": "离离原上草，一岁一枯荣。\n野火烧不尽，春风吹又生。\n远芳侵古道，晴翠接荒城。\n又送王孙去，萋萋满别情。"
  },
  {
    "title": "晓出净慈寺送林子方",
    "author": "杨万里",
    "dynasty": "宋",
    "genre": "七言绝句",
    "content": "毕竟西湖六月中，风光不与四时同。\n接天莲叶无穷碧，映日荷花别样红。"
  },
  {
    "title": "绝句四首（其三）",
    "author": "杜甫",
    "dynasty": "唐",
    "genre": "七言绝句",
    "content": "两个黄鹂鸣翠柳，一行白鹭上青天。\n窗含西岭千秋雪，门泊东吴万里船。"
  },
  {
    "title": "悯农（其一）",
    "author": "李绅",
    "dynasty": "唐",
    "genre": "五言绝句",
    "content": "春种一粒粟，秋收万颗子。\n四海无闲田，农夫犹饿死。"
  },
  {
    "title": "舟夜书所见",
    "author": "查慎行",
    "dynasty": "清",
    "genre": "五言绝句",
    "content": "月黑见渔灯，孤光一点萤。\n微微风簇浪，散作满河星。"
  },
  {
    "title": "所见",
    "author": "袁枚",
    "dynasty": "清",
    "genre": "五言绝句",
    "content": "牧童骑黄牛，歌声振林樾。\n意欲捕鸣蝉，忽然闭口立。"
  },
  {
    "title": "山行",
    "author": "杜牧",
    "dynasty": "唐",
    "genre": "七言绝句",
    "content": "远上寒山石径斜，白云生处有人家。\n停车坐爱枫林晚，霜叶红于二月花。"
  }
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('keyword');

  if (!keyword) {
    return NextResponse.json({ poems: [] });
  }

  // Simulate minimal network latency
  await new Promise(resolve => setTimeout(resolve, 300));

  const lowerKeyword = keyword.toLowerCase();
  
  const filtered = POEM_DATABASE.filter(p => 
    p.title.includes(keyword) || 
    p.author.includes(keyword) || 
    p.content.includes(keyword)
  );

  return NextResponse.json({ poems: filtered });
}
