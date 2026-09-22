import type { Course, Word } from '../types'

/**
 * Từ vựng HSK 1 dùng cho bản demo.
 * Mỗi từ có đủ Hanzi, Pinyin, nghĩa và một câu ví dụ ngắn theo đúng mục 6 của bản thiết kế.
 */
export const WORDS: Word[] = [
  // Unit 1 — Chào hỏi
  { id: 'nihao', hanzi: '你好', pinyin: 'nǐ hǎo', meaning: 'xin chào', example: '你好，我叫 Tom。', exampleMeaning: 'Xin chào, tôi tên là Tom.' },
  { id: 'ni', hanzi: '你', pinyin: 'nǐ', meaning: 'bạn', example: '你是学生吗？', exampleMeaning: 'Bạn là học sinh phải không?' },
  { id: 'hao', hanzi: '好', pinyin: 'hǎo', meaning: 'tốt, khoẻ', example: '我很好。', exampleMeaning: 'Tôi rất khoẻ.' },
  { id: 'wo', hanzi: '我', pinyin: 'wǒ', meaning: 'tôi', example: '我是中国人。', exampleMeaning: 'Tôi là người Trung Quốc.' },
  { id: 'zaijian', hanzi: '再见', pinyin: 'zài jiàn', meaning: 'tạm biệt', example: '老师，再见！', exampleMeaning: 'Thưa thầy, tạm biệt ạ!' },
  { id: 'xiexie', hanzi: '谢谢', pinyin: 'xiè xie', meaning: 'cảm ơn', example: '谢谢你！', exampleMeaning: 'Cảm ơn bạn!' },

  { id: 'bukeqi', hanzi: '不客气', pinyin: 'bú kè qi', meaning: 'không có gì', example: '不客气，再见。', exampleMeaning: 'Không có gì, tạm biệt.' },
  { id: 'duibuqi', hanzi: '对不起', pinyin: 'duì bu qǐ', meaning: 'xin lỗi', example: '对不起，我不知道。', exampleMeaning: 'Xin lỗi, tôi không biết.' },
  { id: 'meiguanxi', hanzi: '没关系', pinyin: 'méi guān xi', meaning: 'không sao', example: '没关系，谢谢你。', exampleMeaning: 'Không sao, cảm ơn bạn.' },
  { id: 'qing', hanzi: '请', pinyin: 'qǐng', meaning: 'mời, xin', example: '请喝茶。', exampleMeaning: 'Mời uống trà.' },
  { id: 'shi', hanzi: '是', pinyin: 'shì', meaning: 'là', example: '他是我的朋友。', exampleMeaning: 'Anh ấy là bạn của tôi.' },
  { id: 'bu', hanzi: '不', pinyin: 'bù', meaning: 'không', example: '我不是老师。', exampleMeaning: 'Tôi không phải giáo viên.' },

  // Unit 2 — Giới thiệu bản thân
  { id: 'jiao', hanzi: '叫', pinyin: 'jiào', meaning: 'gọi, tên là', example: '你叫什么名字？', exampleMeaning: 'Bạn tên là gì?' },
  { id: 'mingzi', hanzi: '名字', pinyin: 'míng zi', meaning: 'tên', example: '我的名字很短。', exampleMeaning: 'Tên của tôi rất ngắn.' },
  { id: 'shenme', hanzi: '什么', pinyin: 'shén me', meaning: 'cái gì', example: '这是什么？', exampleMeaning: 'Đây là cái gì?' },
  { id: 'women', hanzi: '我们', pinyin: 'wǒ men', meaning: 'chúng tôi', example: '我们是朋友。', exampleMeaning: 'Chúng tôi là bạn.' },
  { id: 'ta-nam', hanzi: '他', pinyin: 'tā', meaning: 'anh ấy', example: '他有一个女儿。', exampleMeaning: 'Anh ấy có một cô con gái.' },
  { id: 'ta-nu', hanzi: '她', pinyin: 'tā', meaning: 'cô ấy', example: '她是医生。', exampleMeaning: 'Cô ấy là bác sĩ.' },

  { id: 'zhongguo', hanzi: '中国', pinyin: 'Zhōng guó', meaning: 'Trung Quốc', example: '我在中国学习。', exampleMeaning: 'Tôi học ở Trung Quốc.' },
  { id: 'ren', hanzi: '人', pinyin: 'rén', meaning: 'người', example: '他是中国人。', exampleMeaning: 'Anh ấy là người Trung Quốc.' },
  { id: 'laoshi', hanzi: '老师', pinyin: 'lǎo shī', meaning: 'giáo viên', example: '我的老师很好。', exampleMeaning: 'Giáo viên của tôi rất tốt.' },
  { id: 'xuesheng', hanzi: '学生', pinyin: 'xué sheng', meaning: 'học sinh', example: '我是学生。', exampleMeaning: 'Tôi là học sinh.' },
  { id: 'pengyou', hanzi: '朋友', pinyin: 'péng you', meaning: 'bạn bè', example: '我有很多朋友。', exampleMeaning: 'Tôi có rất nhiều bạn.' },
  { id: 'yisheng', hanzi: '医生', pinyin: 'yī shēng', meaning: 'bác sĩ', example: '她是一个好医生。', exampleMeaning: 'Cô ấy là một bác sĩ giỏi.' },

  // Unit 3 — Gia đình
  { id: 'baba', hanzi: '爸爸', pinyin: 'bà ba', meaning: 'bố', example: '我爸爸是老师。', exampleMeaning: 'Bố tôi là giáo viên.' },
  { id: 'mama', hanzi: '妈妈', pinyin: 'mā ma', meaning: 'mẹ', example: '妈妈在家。', exampleMeaning: 'Mẹ ở nhà.' },
  { id: 'erzi', hanzi: '儿子', pinyin: 'ér zi', meaning: 'con trai', example: '他的儿子很小。', exampleMeaning: 'Con trai anh ấy còn nhỏ.' },
  { id: 'nver', hanzi: '女儿', pinyin: 'nǚ ér', meaning: 'con gái', example: '我有一个女儿。', exampleMeaning: 'Tôi có một cô con gái.' },
  { id: 'jia', hanzi: '家', pinyin: 'jiā', meaning: 'nhà, gia đình', example: '我的家很大。', exampleMeaning: 'Nhà tôi rất rộng.' },
  { id: 'you', hanzi: '有', pinyin: 'yǒu', meaning: 'có', example: '我有三个朋友。', exampleMeaning: 'Tôi có ba người bạn.' },

  { id: 'da', hanzi: '大', pinyin: 'dà', meaning: 'to, lớn', example: '这个家很大。', exampleMeaning: 'Ngôi nhà này rất lớn.' },
  { id: 'xiao', hanzi: '小', pinyin: 'xiǎo', meaning: 'nhỏ', example: '我的猫很小。', exampleMeaning: 'Con mèo của tôi rất nhỏ.' },
  { id: 'duo', hanzi: '多', pinyin: 'duō', meaning: 'nhiều', example: '中国人很多。', exampleMeaning: 'Người Trung Quốc rất đông.' },
  { id: 'shao', hanzi: '少', pinyin: 'shǎo', meaning: 'ít', example: '今天的学生很少。', exampleMeaning: 'Hôm nay có ít học sinh.' },
  { id: 'hen', hanzi: '很', pinyin: 'hěn', meaning: 'rất', example: '她很高兴。', exampleMeaning: 'Cô ấy rất vui.' },
  { id: 'dou', hanzi: '都', pinyin: 'dōu', meaning: 'đều', example: '我们都是学生。', exampleMeaning: 'Chúng tôi đều là học sinh.' },

  // Unit 4 — Số đếm
  { id: 'yi', hanzi: '一', pinyin: 'yī', meaning: 'một', example: '我有一个哥哥。', exampleMeaning: 'Tôi có một người anh.' },
  { id: 'er', hanzi: '二', pinyin: 'èr', meaning: 'hai', example: '二月很冷。', exampleMeaning: 'Tháng Hai rất lạnh.' },
  { id: 'san', hanzi: '三', pinyin: 'sān', meaning: 'ba', example: '三个人。', exampleMeaning: 'Ba người.' },
  { id: 'si', hanzi: '四', pinyin: 'sì', meaning: 'bốn', example: '我们家有四个人。', exampleMeaning: 'Nhà tôi có bốn người.' },
  { id: 'wu', hanzi: '五', pinyin: 'wǔ', meaning: 'năm', example: '五点见。', exampleMeaning: 'Gặp lúc năm giờ.' },
  { id: 'liu', hanzi: '六', pinyin: 'liù', meaning: 'sáu', example: '六个学生。', exampleMeaning: 'Sáu học sinh.' },

  { id: 'qi', hanzi: '七', pinyin: 'qī', meaning: 'bảy', example: '一个星期有七天。', exampleMeaning: 'Một tuần có bảy ngày.' },
  { id: 'ba', hanzi: '八', pinyin: 'bā', meaning: 'tám', example: '八点上课。', exampleMeaning: 'Tám giờ vào học.' },
  { id: 'jiu', hanzi: '九', pinyin: 'jiǔ', meaning: 'chín', example: '九月来了。', exampleMeaning: 'Tháng Chín đã đến.' },
  { id: 'shi-muoi', hanzi: '十', pinyin: 'shí', meaning: 'mười', example: '我有十本书。', exampleMeaning: 'Tôi có mười quyển sách.' },
  { id: 'ji', hanzi: '几', pinyin: 'jǐ', meaning: 'mấy, bao nhiêu', example: '你家有几个人？', exampleMeaning: 'Nhà bạn có mấy người?' },
  { id: 'ge', hanzi: '个', pinyin: 'gè', meaning: 'cái, người (lượng từ)', example: '三个朋友。', exampleMeaning: 'Ba người bạn.' },

  // Unit 5 — Thời gian
  { id: 'jintian', hanzi: '今天', pinyin: 'jīn tiān', meaning: 'hôm nay', example: '今天很热。', exampleMeaning: 'Hôm nay rất nóng.' },
  { id: 'mingtian', hanzi: '明天', pinyin: 'míng tiān', meaning: 'ngày mai', example: '明天见！', exampleMeaning: 'Hẹn gặp ngày mai!' },
  { id: 'zuotian', hanzi: '昨天', pinyin: 'zuó tiān', meaning: 'hôm qua', example: '昨天我在家。', exampleMeaning: 'Hôm qua tôi ở nhà.' },
  { id: 'nian', hanzi: '年', pinyin: 'nián', meaning: 'năm', example: '今年是好年。', exampleMeaning: 'Năm nay là một năm tốt.' },
  { id: 'yue', hanzi: '月', pinyin: 'yuè', meaning: 'tháng', example: '这个月很忙。', exampleMeaning: 'Tháng này rất bận.' },
  { id: 'ri', hanzi: '日', pinyin: 'rì', meaning: 'ngày', example: '今天是十月一日。', exampleMeaning: 'Hôm nay là ngày 1 tháng 10.' },

  { id: 'xianzai', hanzi: '现在', pinyin: 'xiàn zài', meaning: 'bây giờ', example: '现在几点？', exampleMeaning: 'Bây giờ mấy giờ?' },
  { id: 'dian', hanzi: '点', pinyin: 'diǎn', meaning: 'giờ', example: '现在八点。', exampleMeaning: 'Bây giờ là tám giờ.' },
  { id: 'fenzhong', hanzi: '分钟', pinyin: 'fēn zhōng', meaning: 'phút', example: '请等五分钟。', exampleMeaning: 'Xin đợi năm phút.' },
  { id: 'xingqi', hanzi: '星期', pinyin: 'xīng qī', meaning: 'tuần, thứ', example: '今天星期几？', exampleMeaning: 'Hôm nay thứ mấy?' },
  { id: 'shihou', hanzi: '时候', pinyin: 'shí hou', meaning: 'lúc, khi', example: '什么时候上课？', exampleMeaning: 'Khi nào vào học?' },
  { id: 'shangwu', hanzi: '上午', pinyin: 'shàng wǔ', meaning: 'buổi sáng', example: '上午我有课。', exampleMeaning: 'Buổi sáng tôi có tiết học.' },
]

/** Tra cứu nhanh từ theo id. */
export const WORD_BY_ID: Record<string, Word> = Object.fromEntries(
  WORDS.map((word) => [word.id, word]),
)

/** Khoá học HSK 1 — cấu trúc Course → Unit → Lesson theo mục 5 của bản thiết kế. */
export const HSK1: Course = {
  id: 'hsk1',
  title: 'HSK 1',
  description: 'Khoá nhập môn cho người chưa có nền tảng. 60 từ vựng thiết yếu nhất.',
  units: [
    {
      id: 'u1',
      title: 'Unit 1 · Chào hỏi',
      description: 'Những câu đầu tiên bạn cần khi gặp người Trung Quốc.',
      lessons: [
        {
          id: 'u1l1',
          title: 'Lời chào cơ bản',
          description: 'Chào hỏi và tạm biệt.',
          wordIds: ['nihao', 'ni', 'hao', 'wo', 'zaijian', 'xiexie'],
        },
        {
          id: 'u1l2',
          title: 'Nói chuyện lịch sự',
          description: 'Cảm ơn, xin lỗi và cách đáp lại.',
          wordIds: ['bukeqi', 'duibuqi', 'meiguanxi', 'qing', 'shi', 'bu'],
        },
      ],
    },
    {
      id: 'u2',
      title: 'Unit 2 · Giới thiệu bản thân',
      description: 'Nói tên, nghề nghiệp và quốc tịch của bạn.',
      lessons: [
        {
          id: 'u2l1',
          title: 'Tên của bạn là gì',
          description: 'Hỏi và trả lời về tên.',
          wordIds: ['jiao', 'mingzi', 'shenme', 'women', 'ta-nam', 'ta-nu'],
        },
        {
          id: 'u2l2',
          title: 'Nghề nghiệp',
          description: 'Giáo viên, học sinh, bác sĩ.',
          wordIds: ['zhongguo', 'ren', 'laoshi', 'xuesheng', 'pengyou', 'yisheng'],
        },
      ],
    },
    {
      id: 'u3',
      title: 'Unit 3 · Gia đình',
      description: 'Kể về những người thân trong nhà.',
      lessons: [
        {
          id: 'u3l1',
          title: 'Người thân',
          description: 'Bố, mẹ, con cái.',
          wordIds: ['baba', 'mama', 'erzi', 'nver', 'jia', 'you'],
        },
        {
          id: 'u3l2',
          title: 'Miêu tả đơn giản',
          description: 'To, nhỏ, nhiều, ít.',
          wordIds: ['da', 'xiao', 'duo', 'shao', 'hen', 'dou'],
        },
      ],
    },
    {
      id: 'u4',
      title: 'Unit 4 · Số đếm',
      description: 'Đếm từ 1 đến 10 và dùng lượng từ.',
      lessons: [
        {
          id: 'u4l1',
          title: 'Từ 1 đến 6',
          description: 'Những con số đầu tiên.',
          wordIds: ['yi', 'er', 'san', 'si', 'wu', 'liu'],
        },
        {
          id: 'u4l2',
          title: 'Từ 7 đến 10',
          description: 'Hoàn thiện bảng số và lượng từ 个.',
          wordIds: ['qi', 'ba', 'jiu', 'shi-muoi', 'ji', 'ge'],
        },
      ],
    },
    {
      id: 'u5',
      title: 'Unit 5 · Thời gian',
      description: 'Nói về ngày tháng và giờ giấc.',
      lessons: [
        {
          id: 'u5l1',
          title: 'Ngày tháng',
          description: 'Hôm qua, hôm nay, ngày mai.',
          wordIds: ['jintian', 'mingtian', 'zuotian', 'nian', 'yue', 'ri'],
        },
        {
          id: 'u5l2',
          title: 'Giờ giấc',
          description: 'Bây giờ mấy giờ rồi?',
          wordIds: ['xianzai', 'dian', 'fenzhong', 'xingqi', 'shihou', 'shangwu'],
        },
      ],
    },
  ],
}

/** Danh sách phẳng mọi bài học, theo đúng thứ tự học. */
export const ALL_LESSONS = HSK1.units.flatMap((unit) =>
  unit.lessons.map((lesson) => ({ ...lesson, unitId: unit.id, unitTitle: unit.title })),
)

/** Lấy danh sách Word của một bài học. */
export function wordsOfLesson(lessonId: string): Word[] {
  const lesson = ALL_LESSONS.find((item) => item.id === lessonId)
  if (!lesson) return []
  return lesson.wordIds.map((id) => WORD_BY_ID[id]).filter(Boolean)
}
