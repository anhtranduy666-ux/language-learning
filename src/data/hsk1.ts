import type { Course, ExampleSentence, Word } from '../types'

/** Viết gọn một câu mẫu: chữ Hán, pinyin theo từng âm tiết, nghĩa. */
function ex(hanzi: string, pinyin: string, meaning: string): ExampleSentence {
  return { hanzi, pinyin, meaning }
}

/**
 * Từ vựng HSK 1 dùng cho bản demo.
 *
 * Mỗi từ có đủ Hanzi, Pinyin, nghĩa theo đúng mục 6 của bản thiết kế, kèm ba
 * câu mẫu ghép từ đó với những từ khác thành câu hoàn chỉnh. Câu nào cũng có
 * audio đọc cả câu, sinh từ chính pinyin ghi ở đây — quy ước viết pinyin nằm
 * ở `src/lib/speechTokens.ts` và `docs/example-sentences.md`.
 */
export const WORDS: Word[] = [
  // Unit 1 — Chào hỏi
  {
    id: 'nihao',
    hanzi: '你好',
    pinyin: 'nǐ hǎo',
    meaning: 'xin chào',
    examples: [
      ex('你好，我叫小明。', 'Nǐ hǎo, wǒ jiào Xiǎo míng.', 'Xin chào, tôi tên là Tiểu Minh.'),
      ex('老师，你好！', 'Lǎo shī, nǐ hǎo!', 'Em chào thầy ạ!'),
      ex('你好，很高兴认识你。', 'Nǐ hǎo, hěn gāo xìng rèn shi nǐ.', 'Xin chào, rất vui được làm quen với bạn.'),
    ],
  },
  {
    id: 'ni',
    hanzi: '你',
    pinyin: 'nǐ',
    meaning: 'bạn',
    examples: [
      ex('你叫什么名字？', 'Nǐ jiào shén me míng zi?', 'Bạn tên là gì?'),
      ex('你好吗？', 'Nǐ hǎo ma?', 'Bạn có khoẻ không?'),
      ex('你是学生吗？', 'Nǐ shì xué sheng ma?', 'Bạn là học sinh phải không?'),
    ],
  },
  {
    id: 'hao',
    hanzi: '好',
    pinyin: 'hǎo',
    meaning: 'tốt, khoẻ',
    examples: [
      ex('我很好。', 'Wǒ hěn hǎo.', 'Tôi rất khoẻ.'),
      ex('今天天气很好。', 'Jīn tiān tiān qì hěn hǎo.', 'Hôm nay thời tiết rất đẹp.'),
      ex('你的汉语很好。', 'Nǐ de Hàn yǔ hěn hǎo.', 'Tiếng Trung của bạn rất giỏi.'),
    ],
  },
  {
    id: 'wo',
    hanzi: '我',
    pinyin: 'wǒ',
    meaning: 'tôi',
    examples: [
      ex('我是中国人。', 'Wǒ shì Zhōng guó rén.', 'Tôi là người Trung Quốc.'),
      ex('我爱我的家。', 'Wǒ ài wǒ de jiā.', 'Tôi yêu gia đình mình.'),
      ex('我想喝茶。', 'Wǒ xiǎng hē chá.', 'Tôi muốn uống trà.'),
    ],
  },
  {
    id: 'zaijian',
    hanzi: '再见',
    pinyin: 'zài jiàn',
    meaning: 'tạm biệt',
    examples: [
      ex('老师，再见！', 'Lǎo shī, zài jiàn!', 'Tạm biệt thầy ạ!'),
      ex('再见，明天见！', 'Zài jiàn, míng tiān jiàn!', 'Tạm biệt, mai gặp lại nhé!'),
      ex('我们明天再见！', 'Wǒ men míng tiān zài jiàn!', 'Mai chúng ta gặp lại nhé!'),
    ],
  },
  {
    id: 'xiexie',
    hanzi: '谢谢',
    pinyin: 'xiè xie',
    meaning: 'cảm ơn',
    examples: [
      ex('谢谢你！', 'Xiè xie nǐ!', 'Cảm ơn bạn!'),
      ex('谢谢老师！', 'Xiè xie lǎo shī!', 'Em cảm ơn thầy ạ!'),
      ex('谢谢，我很好。', 'Xiè xie, wǒ hěn hǎo.', 'Cảm ơn, tôi khoẻ.'),
    ],
  },

  {
    id: 'bukeqi',
    hanzi: '不客气',
    pinyin: 'bú kè qi',
    meaning: 'không có gì',
    examples: [
      ex('不客气，再见。', 'Bú kè qi, zài jiàn.', 'Không có gì, tạm biệt.'),
      ex('不客气，请喝茶。', 'Bú kè qi, qǐng hē chá.', 'Đừng khách sáo, mời uống trà.'),
      ex('老师，不客气！', 'Lǎo shī, bú kè qi!', 'Không có gì đâu thầy ạ!'),
    ],
  },
  {
    id: 'duibuqi',
    hanzi: '对不起',
    pinyin: 'duì bu qǐ',
    meaning: 'xin lỗi',
    examples: [
      ex('对不起，我不知道。', 'Duì bu qǐ, wǒ bù zhī dào.', 'Xin lỗi, tôi không biết.'),
      ex('对不起，我来晚了。', 'Duì bu qǐ, wǒ lái wǎn le.', 'Xin lỗi, tôi đến muộn.'),
      ex('对不起，我不会说汉语。', 'Duì bu qǐ, wǒ bú huì shuō Hàn yǔ.', 'Xin lỗi, tôi không biết nói tiếng Trung.'),
    ],
  },
  {
    id: 'meiguanxi',
    hanzi: '没关系',
    pinyin: 'méi guān xi',
    meaning: 'không sao',
    examples: [
      ex('没关系，谢谢你。', 'Méi guān xi, xiè xie nǐ.', 'Không sao, cảm ơn bạn.'),
      ex('没关系，我们明天去。', 'Méi guān xi, wǒ men míng tiān qù.', 'Không sao, mai chúng ta đi.'),
      ex('没关系，请坐。', 'Méi guān xi, qǐng zuò.', 'Không sao đâu, mời ngồi.'),
    ],
  },
  {
    id: 'qing',
    hanzi: '请',
    pinyin: 'qǐng',
    meaning: 'mời, xin',
    examples: [
      ex('请喝茶。', 'Qǐng hē chá.', 'Mời uống trà.'),
      ex('请坐。', 'Qǐng zuò.', 'Mời ngồi.'),
      ex('请问，你叫什么名字？', 'Qǐng wèn, nǐ jiào shén me míng zi?', 'Xin hỏi, bạn tên là gì?'),
    ],
  },
  {
    id: 'shi',
    hanzi: '是',
    pinyin: 'shì',
    meaning: 'là',
    examples: [
      ex('他是我的朋友。', 'Tā shì wǒ de péng you.', 'Anh ấy là bạn của tôi.'),
      ex('她是我妈妈。', 'Tā shì wǒ mā ma.', 'Cô ấy là mẹ tôi.'),
      ex('那是我的书。', 'Nà shì wǒ de shū.', 'Đó là sách của tôi.'),
    ],
  },
  {
    id: 'bu',
    hanzi: '不',
    pinyin: 'bù',
    meaning: 'không',
    examples: [
      ex('我不是老师。', 'Wǒ bú shì lǎo shī.', 'Tôi không phải giáo viên.'),
      ex('我不喝茶。', 'Wǒ bù hē chá.', 'Tôi không uống trà.'),
      ex('今天不热。', 'Jīn tiān bú rè.', 'Hôm nay không nóng.'),
    ],
  },

  // Unit 2 — Giới thiệu bản thân
  {
    id: 'jiao',
    hanzi: '叫',
    pinyin: 'jiào',
    meaning: 'gọi, tên là',
    examples: [
      ex('你叫什么名字？', 'Nǐ jiào shén me míng zi?', 'Bạn tên là gì?'),
      ex('妈妈叫我回家。', 'Mā ma jiào wǒ huí jiā.', 'Mẹ gọi tôi về nhà.'),
      ex('你的猫叫什么？', 'Nǐ de māo jiào shén me?', 'Con mèo của bạn tên là gì?'),
    ],
  },
  {
    id: 'mingzi',
    hanzi: '名字',
    pinyin: 'míng zi',
    meaning: 'tên',
    examples: [
      ex('我的名字很短。', 'Wǒ de míng zi hěn duǎn.', 'Tên của tôi rất ngắn.'),
      ex('这是我朋友的名字。', 'Zhè shì wǒ péng you de míng zi.', 'Đây là tên của bạn tôi.'),
      ex('我不知道他的名字。', 'Wǒ bù zhī dào tā de míng zi.', 'Tôi không biết tên anh ấy.'),
    ],
  },
  {
    id: 'shenme',
    hanzi: '什么',
    pinyin: 'shén me',
    meaning: 'cái gì',
    examples: [
      ex('这是什么？', 'Zhè shì shén me?', 'Đây là cái gì?'),
      ex('你喝什么？', 'Nǐ hē shén me?', 'Bạn uống gì?'),
      ex('你想吃什么？', 'Nǐ xiǎng chī shén me?', 'Bạn muốn ăn gì?'),
    ],
  },
  {
    id: 'women',
    hanzi: '我们',
    pinyin: 'wǒ men',
    meaning: 'chúng tôi',
    examples: [
      ex('我们是朋友。', 'Wǒ men shì péng you.', 'Chúng tôi là bạn.'),
      ex('我们去学校吧。', 'Wǒ men qù xué xiào ba.', 'Chúng ta đi đến trường nào.'),
      ex('我们一起喝茶吧。', 'Wǒ men yì qǐ hē chá ba.', 'Chúng ta cùng uống trà nhé.'),
    ],
  },
  {
    id: 'ta-nam',
    hanzi: '他',
    pinyin: 'tā',
    meaning: 'anh ấy',
    examples: [
      ex('他有一个女儿。', 'Tā yǒu yí ge nǚ ér.', 'Anh ấy có một cô con gái.'),
      ex('他是我哥哥。', 'Tā shì wǒ gē ge.', 'Anh ấy là anh trai tôi.'),
      ex('他在医院工作。', 'Tā zài yī yuàn gōng zuò.', 'Anh ấy làm việc ở bệnh viện.'),
    ],
  },
  {
    id: 'ta-nu',
    hanzi: '她',
    pinyin: 'tā',
    meaning: 'cô ấy',
    examples: [
      ex('她是医生。', 'Tā shì yī shēng.', 'Cô ấy là bác sĩ.'),
      ex('她是我的老师。', 'Tā shì wǒ de lǎo shī.', 'Cô ấy là cô giáo của tôi.'),
      ex('她有两个儿子。', 'Tā yǒu liǎng ge ér zi.', 'Cô ấy có hai cậu con trai.'),
    ],
  },

  {
    id: 'zhongguo',
    hanzi: '中国',
    pinyin: 'Zhōng guó',
    meaning: 'Trung Quốc',
    examples: [
      ex('我在中国学习。', 'Wǒ zài Zhōng guó xué xí.', 'Tôi học ở Trung Quốc.'),
      ex('我想去中国。', 'Wǒ xiǎng qù Zhōng guó.', 'Tôi muốn đi Trung Quốc.'),
      ex('中国很大。', 'Zhōng guó hěn dà.', 'Trung Quốc rất rộng lớn.'),
    ],
  },
  {
    id: 'ren',
    hanzi: '人',
    pinyin: 'rén',
    meaning: 'người',
    examples: [
      ex('他是中国人。', 'Tā shì Zhōng guó rén.', 'Anh ấy là người Trung Quốc.'),
      ex('你是哪国人？', 'Nǐ shì nǎ guó rén?', 'Bạn là người nước nào?'),
      ex('我是越南人。', 'Wǒ shì Yuè nán rén.', 'Tôi là người Việt Nam.'),
    ],
  },
  {
    id: 'laoshi',
    hanzi: '老师',
    pinyin: 'lǎo shī',
    meaning: 'giáo viên',
    examples: [
      ex('我的老师很好。', 'Wǒ de lǎo shī hěn hǎo.', 'Giáo viên của tôi rất tốt.'),
      ex('她是汉语老师。', 'Tā shì Hàn yǔ lǎo shī.', 'Cô ấy là giáo viên tiếng Trung.'),
      ex('老师，我有问题。', 'Lǎo shī, wǒ yǒu wèn tí.', 'Thưa thầy, em có câu hỏi.'),
    ],
  },
  {
    id: 'xuesheng',
    hanzi: '学生',
    pinyin: 'xué sheng',
    meaning: 'học sinh',
    examples: [
      ex('我是学生。', 'Wǒ shì xué sheng.', 'Tôi là học sinh.'),
      ex('我们班有二十个学生。', 'Wǒ men bān yǒu èr shí ge xué sheng.', 'Lớp chúng tôi có hai mươi học sinh.'),
      ex('他是好学生。', 'Tā shì hǎo xué sheng.', 'Cậu ấy là học sinh giỏi.'),
    ],
  },
  {
    id: 'pengyou',
    hanzi: '朋友',
    pinyin: 'péng you',
    meaning: 'bạn bè',
    examples: [
      ex('我有很多朋友。', 'Wǒ yǒu hěn duō péng you.', 'Tôi có rất nhiều bạn.'),
      ex('他是我的好朋友。', 'Tā shì wǒ de hǎo péng you.', 'Anh ấy là bạn thân của tôi.'),
      ex('我和朋友去喝茶。', 'Wǒ hé péng you qù hē chá.', 'Tôi đi uống trà với bạn.'),
    ],
  },
  {
    id: 'yisheng',
    hanzi: '医生',
    pinyin: 'yī shēng',
    meaning: 'bác sĩ',
    examples: [
      ex('她是一个好医生。', 'Tā shì yí ge hǎo yī shēng.', 'Cô ấy là một bác sĩ giỏi.'),
      ex('我爸爸是医生。', 'Wǒ bà ba shì yī shēng.', 'Bố tôi là bác sĩ.'),
      ex('我想当医生。', 'Wǒ xiǎng dāng yī shēng.', 'Tôi muốn làm bác sĩ.'),
    ],
  },

  // Unit 3 — Gia đình
  {
    id: 'baba',
    hanzi: '爸爸',
    pinyin: 'bà ba',
    meaning: 'bố',
    examples: [
      ex('我爸爸是老师。', 'Wǒ bà ba shì lǎo shī.', 'Bố tôi là giáo viên.'),
      ex('爸爸，我爱你！', 'Bà ba, wǒ ài nǐ!', 'Bố ơi, con yêu bố!'),
      ex('爸爸在家吗？', 'Bà ba zài jiā ma?', 'Bố có ở nhà không?'),
    ],
  },
  {
    id: 'mama',
    hanzi: '妈妈',
    pinyin: 'mā ma',
    meaning: 'mẹ',
    examples: [
      ex('妈妈在家。', 'Mā ma zài jiā.', 'Mẹ ở nhà.'),
      ex('妈妈，我回来了！', 'Mā ma, wǒ huí lai le!', 'Mẹ ơi, con về rồi!'),
      ex('我妈妈很忙。', 'Wǒ mā ma hěn máng.', 'Mẹ tôi rất bận.'),
    ],
  },
  {
    id: 'erzi',
    hanzi: '儿子',
    pinyin: 'ér zi',
    meaning: 'con trai',
    examples: [
      ex('他的儿子很小。', 'Tā de ér zi hěn xiǎo.', 'Con trai anh ấy còn nhỏ.'),
      ex('我儿子在学校。', 'Wǒ ér zi zài xué xiào.', 'Con trai tôi đang ở trường.'),
      ex('她儿子是学生。', 'Tā ér zi shì xué sheng.', 'Con trai cô ấy là học sinh.'),
    ],
  },
  {
    id: 'nver',
    hanzi: '女儿',
    pinyin: 'nǚ ér',
    meaning: 'con gái',
    examples: [
      ex('我有一个女儿。', 'Wǒ yǒu yí ge nǚ ér.', 'Tôi có một cô con gái.'),
      ex('他女儿三岁。', 'Tā nǚ ér sān suì.', 'Con gái anh ấy ba tuổi.'),
      ex('我女儿会说汉语。', 'Wǒ nǚ ér huì shuō Hàn yǔ.', 'Con gái tôi biết nói tiếng Trung.'),
    ],
  },
  {
    id: 'jia',
    hanzi: '家',
    pinyin: 'jiā',
    meaning: 'nhà, gia đình',
    examples: [
      ex('我的家很大。', 'Wǒ de jiā hěn dà.', 'Nhà tôi rất rộng.'),
      ex('我们回家吧。', 'Wǒ men huí jiā ba.', 'Chúng ta về nhà thôi.'),
      ex('欢迎来我家！', 'Huān yíng lái wǒ jiā!', 'Chào mừng đến nhà tôi!'),
    ],
  },
  {
    id: 'you',
    hanzi: '有',
    pinyin: 'yǒu',
    meaning: 'có',
    examples: [
      ex('我有三个朋友。', 'Wǒ yǒu sān ge péng you.', 'Tôi có ba người bạn.'),
      ex('你有猫吗？', 'Nǐ yǒu māo ma?', 'Bạn có nuôi mèo không?'),
      ex('我没有钱。', 'Wǒ méi yǒu qián.', 'Tôi không có tiền.'),
    ],
  },

  {
    id: 'da',
    hanzi: '大',
    pinyin: 'dà',
    meaning: 'to, lớn',
    examples: [
      ex('这个家很大。', 'Zhè ge jiā hěn dà.', 'Ngôi nhà này rất lớn.'),
      ex('你多大？', 'Nǐ duō dà?', 'Bạn bao nhiêu tuổi?'),
      ex('北京很大。', 'Běi jīng hěn dà.', 'Bắc Kinh rất rộng.'),
    ],
  },
  {
    id: 'xiao',
    hanzi: '小',
    pinyin: 'xiǎo',
    meaning: 'nhỏ',
    examples: [
      ex('我的猫很小。', 'Wǒ de māo hěn xiǎo.', 'Con mèo của tôi rất nhỏ.'),
      ex('这个杯子太小了。', 'Zhè ge bēi zi tài xiǎo le.', 'Cái cốc này nhỏ quá.'),
      ex('我家有一只小狗。', 'Wǒ jiā yǒu yì zhī xiǎo gǒu.', 'Nhà tôi có một chú chó nhỏ.'),
    ],
  },
  {
    id: 'duo',
    hanzi: '多',
    pinyin: 'duō',
    meaning: 'nhiều',
    examples: [
      ex('中国人很多。', 'Zhōng guó rén hěn duō.', 'Người Trung Quốc rất đông.'),
      ex('我有很多书。', 'Wǒ yǒu hěn duō shū.', 'Tôi có rất nhiều sách.'),
      ex('多少钱？', 'Duō shao qián?', 'Bao nhiêu tiền?'),
    ],
  },
  {
    id: 'shao',
    hanzi: '少',
    pinyin: 'shǎo',
    meaning: 'ít',
    examples: [
      ex('今天的学生很少。', 'Jīn tiān de xué sheng hěn shǎo.', 'Hôm nay có ít học sinh.'),
      ex('我的钱很少。', 'Wǒ de qián hěn shǎo.', 'Tôi có rất ít tiền.'),
      ex('他很少喝茶。', 'Tā hěn shǎo hē chá.', 'Anh ấy ít khi uống trà.'),
    ],
  },
  {
    id: 'hen',
    hanzi: '很',
    pinyin: 'hěn',
    meaning: 'rất',
    examples: [
      ex('她很高兴。', 'Tā hěn gāo xìng.', 'Cô ấy rất vui.'),
      ex('我很喜欢你。', 'Wǒ hěn xǐ huan nǐ.', 'Tôi rất thích bạn.'),
      ex('这个苹果很好吃。', 'Zhè ge píng guǒ hěn hǎo chī.', 'Quả táo này rất ngon.'),
    ],
  },
  {
    id: 'dou',
    hanzi: '都',
    pinyin: 'dōu',
    meaning: 'đều',
    examples: [
      ex('我们都是学生。', 'Wǒ men dōu shì xué sheng.', 'Chúng tôi đều là học sinh.'),
      ex('他们都是中国人。', 'Tā men dōu shì Zhōng guó rén.', 'Họ đều là người Trung Quốc.'),
      ex('我们都很好。', 'Wǒ men dōu hěn hǎo.', 'Chúng tôi đều khoẻ cả.'),
    ],
  },

  // Unit 4 — Số đếm
  {
    id: 'yi',
    hanzi: '一',
    pinyin: 'yī',
    meaning: 'một',
    examples: [
      ex('我有一个哥哥。', 'Wǒ yǒu yí ge gē ge.', 'Tôi có một người anh trai.'),
      ex('请给我一杯茶。', 'Qǐng gěi wǒ yì bēi chá.', 'Cho tôi một cốc trà nhé.'),
      ex('今天星期一。', 'Jīn tiān xīng qī yī.', 'Hôm nay là thứ Hai.'),
    ],
  },
  {
    id: 'er',
    hanzi: '二',
    pinyin: 'èr',
    meaning: 'hai',
    examples: [
      ex('二月很冷。', 'Èr yuè hěn lěng.', 'Tháng Hai rất lạnh.'),
      ex('我家在二楼。', 'Wǒ jiā zài èr lóu.', 'Nhà tôi ở tầng hai.'),
      ex('今天是二号。', 'Jīn tiān shì èr hào.', 'Hôm nay là mùng hai.'),
    ],
  },
  {
    id: 'san',
    hanzi: '三',
    pinyin: 'sān',
    meaning: 'ba',
    examples: [
      ex('我三点回家。', 'Wǒ sān diǎn huí jiā.', 'Tôi về nhà lúc ba giờ.'),
      ex('三个苹果多少钱？', 'Sān ge píng guǒ duō shao qián?', 'Ba quả táo bao nhiêu tiền?'),
      ex('他有三个孩子。', 'Tā yǒu sān ge hái zi.', 'Anh ấy có ba đứa con.'),
    ],
  },
  {
    id: 'si',
    hanzi: '四',
    pinyin: 'sì',
    meaning: 'bốn',
    examples: [
      ex('我们家有四个人。', 'Wǒ men jiā yǒu sì ge rén.', 'Nhà tôi có bốn người.'),
      ex('我四点下课。', 'Wǒ sì diǎn xià kè.', 'Bốn giờ tôi tan học.'),
      ex('我学汉语四个月了。', 'Wǒ xué Hàn yǔ sì ge yuè le.', 'Tôi học tiếng Trung được bốn tháng rồi.'),
    ],
  },
  {
    id: 'wu',
    hanzi: '五',
    pinyin: 'wǔ',
    meaning: 'năm',
    examples: [
      ex('五点见。', 'Wǔ diǎn jiàn.', 'Hẹn gặp lúc năm giờ.'),
      ex('我儿子五岁了。', 'Wǒ ér zi wǔ suì le.', 'Con trai tôi năm tuổi rồi.'),
      ex('这个五块钱。', 'Zhè ge wǔ kuài qián.', 'Cái này năm tệ.'),
    ],
  },
  {
    id: 'liu',
    hanzi: '六',
    pinyin: 'liù',
    meaning: 'sáu',
    examples: [
      ex('我六点起床。', 'Wǒ liù diǎn qǐ chuáng.', 'Tôi dậy lúc sáu giờ.'),
      ex('六月很热。', 'Liù yuè hěn rè.', 'Tháng Sáu rất nóng.'),
      ex('星期六我不上课。', 'Xīng qī liù wǒ bú shàng kè.', 'Thứ Bảy tôi không đi học.'),
    ],
  },

  {
    id: 'qi',
    hanzi: '七',
    pinyin: 'qī',
    meaning: 'bảy',
    examples: [
      ex('一个星期有七天。', 'Yí ge xīng qī yǒu qī tiān.', 'Một tuần có bảy ngày.'),
      ex('我七点吃早饭。', 'Wǒ qī diǎn chī zǎo fàn.', 'Tôi ăn sáng lúc bảy giờ.'),
      ex('她七岁了。', 'Tā qī suì le.', 'Cô bé bảy tuổi rồi.'),
    ],
  },
  {
    id: 'ba',
    hanzi: '八',
    pinyin: 'bā',
    meaning: 'tám',
    examples: [
      ex('八点上课。', 'Bā diǎn shàng kè.', 'Tám giờ vào học.'),
      ex('八月我去中国。', 'Bā yuè wǒ qù Zhōng guó.', 'Tháng Tám tôi đi Trung Quốc.'),
      ex('这本书八块钱。', 'Zhè běn shū bā kuài qián.', 'Quyển sách này tám tệ.'),
    ],
  },
  {
    id: 'jiu',
    hanzi: '九',
    pinyin: 'jiǔ',
    meaning: 'chín',
    examples: [
      ex('九月来了。', 'Jiǔ yuè lái le.', 'Tháng Chín đã đến.'),
      ex('现在九点。', 'Xiàn zài jiǔ diǎn.', 'Bây giờ là chín giờ.'),
      ex('他九点睡觉。', 'Tā jiǔ diǎn shuì jiào.', 'Anh ấy đi ngủ lúc chín giờ.'),
    ],
  },
  {
    id: 'shi-muoi',
    hanzi: '十',
    pinyin: 'shí',
    meaning: 'mười',
    examples: [
      ex('我有十本书。', 'Wǒ yǒu shí běn shū.', 'Tôi có mười quyển sách.'),
      ex('十块钱一个。', 'Shí kuài qián yí ge.', 'Mười tệ một cái.'),
      ex('我们十点见。', 'Wǒ men shí diǎn jiàn.', 'Chúng ta gặp nhau lúc mười giờ.'),
    ],
  },
  {
    id: 'ji',
    hanzi: '几',
    pinyin: 'jǐ',
    meaning: 'mấy, bao nhiêu',
    examples: [
      ex('你家有几个人？', 'Nǐ jiā yǒu jǐ ge rén?', 'Nhà bạn có mấy người?'),
      ex('你几岁了？', 'Nǐ jǐ suì le?', 'Con mấy tuổi rồi?'),
      ex('今天几号？', 'Jīn tiān jǐ hào?', 'Hôm nay ngày mấy?'),
    ],
  },
  {
    id: 'ge',
    hanzi: '个',
    pinyin: 'gè',
    meaning: 'cái, người (lượng từ)',
    examples: [
      ex('我有两个哥哥。', 'Wǒ yǒu liǎng ge gē ge.', 'Tôi có hai người anh trai.'),
      ex('这个是什么？', 'Zhè ge shì shén me?', 'Cái này là cái gì?'),
      ex('我要一个苹果。', 'Wǒ yào yí ge píng guǒ.', 'Tôi muốn một quả táo.'),
    ],
  },

  // Unit 5 — Thời gian
  {
    id: 'jintian',
    hanzi: '今天',
    pinyin: 'jīn tiān',
    meaning: 'hôm nay',
    examples: [
      ex('今天很热。', 'Jīn tiān hěn rè.', 'Hôm nay rất nóng.'),
      ex('今天你忙吗？', 'Jīn tiān nǐ máng ma?', 'Hôm nay bạn có bận không?'),
      ex('今天我不去学校。', 'Jīn tiān wǒ bú qù xué xiào.', 'Hôm nay tôi không đến trường.'),
    ],
  },
  {
    id: 'mingtian',
    hanzi: '明天',
    pinyin: 'míng tiān',
    meaning: 'ngày mai',
    examples: [
      ex('明天见！', 'Míng tiān jiàn!', 'Hẹn gặp ngày mai!'),
      ex('明天是星期六。', 'Míng tiān shì xīng qī liù.', 'Ngày mai là thứ Bảy.'),
      ex('明天我去医院。', 'Míng tiān wǒ qù yī yuàn.', 'Ngày mai tôi đi bệnh viện.'),
    ],
  },
  {
    id: 'zuotian',
    hanzi: '昨天',
    pinyin: 'zuó tiān',
    meaning: 'hôm qua',
    examples: [
      ex('昨天我在家。', 'Zuó tiān wǒ zài jiā.', 'Hôm qua tôi ở nhà.'),
      ex('昨天很冷。', 'Zuó tiān hěn lěng.', 'Hôm qua rất lạnh.'),
      ex('昨天是星期几？', 'Zuó tiān shì xīng qī jǐ?', 'Hôm qua là thứ mấy?'),
    ],
  },
  {
    id: 'nian',
    hanzi: '年',
    pinyin: 'nián',
    meaning: 'năm',
    examples: [
      ex('今年我二十岁。', 'Jīn nián wǒ èr shí suì.', 'Năm nay tôi hai mươi tuổi.'),
      ex('明年我去中国。', 'Míng nián wǒ qù Zhōng guó.', 'Sang năm tôi đi Trung Quốc.'),
      ex('新年快乐！', 'Xīn nián kuài lè!', 'Chúc mừng năm mới!'),
    ],
  },
  {
    id: 'yue',
    hanzi: '月',
    pinyin: 'yuè',
    meaning: 'tháng',
    examples: [
      ex('这个月很忙。', 'Zhè ge yuè hěn máng.', 'Tháng này rất bận.'),
      ex('我下个月去北京。', 'Wǒ xià ge yuè qù Běi jīng.', 'Tháng sau tôi đi Bắc Kinh.'),
      ex('一年有十二个月。', 'Yì nián yǒu shí èr ge yuè.', 'Một năm có mười hai tháng.'),
    ],
  },
  {
    id: 'ri',
    hanzi: '日',
    pinyin: 'rì',
    meaning: 'ngày',
    examples: [
      ex('今天是十月一日。', 'Jīn tiān shì shí yuè yī rì.', 'Hôm nay là ngày 1 tháng 10.'),
      ex('我的生日是五月六日。', 'Wǒ de shēng rì shì wǔ yuè liù rì.', 'Sinh nhật tôi là ngày 6 tháng 5.'),
      ex('生日快乐！', 'Shēng rì kuài lè!', 'Chúc mừng sinh nhật!'),
    ],
  },

  {
    id: 'xianzai',
    hanzi: '现在',
    pinyin: 'xiàn zài',
    meaning: 'bây giờ',
    examples: [
      ex('现在几点？', 'Xiàn zài jǐ diǎn?', 'Bây giờ mấy giờ?'),
      ex('我现在很忙。', 'Wǒ xiàn zài hěn máng.', 'Bây giờ tôi rất bận.'),
      ex('他现在不在家。', 'Tā xiàn zài bú zài jiā.', 'Bây giờ anh ấy không có nhà.'),
    ],
  },
  {
    id: 'dian',
    hanzi: '点',
    pinyin: 'diǎn',
    meaning: 'giờ',
    examples: [
      ex('现在八点。', 'Xiàn zài bā diǎn.', 'Bây giờ là tám giờ.'),
      ex('我们几点去？', 'Wǒ men jǐ diǎn qù?', 'Mấy giờ chúng ta đi?'),
      ex('我十二点吃饭。', 'Wǒ shí èr diǎn chī fàn.', 'Tôi ăn cơm lúc mười hai giờ.'),
    ],
  },
  {
    id: 'fenzhong',
    hanzi: '分钟',
    pinyin: 'fēn zhōng',
    meaning: 'phút',
    examples: [
      ex('请等五分钟。', 'Qǐng děng wǔ fēn zhōng.', 'Xin đợi năm phút.'),
      ex('我们休息十分钟。', 'Wǒ men xiū xi shí fēn zhōng.', 'Chúng ta nghỉ mười phút nhé.'),
      ex('还有三分钟。', 'Hái yǒu sān fēn zhōng.', 'Còn ba phút nữa.'),
    ],
  },
  {
    id: 'xingqi',
    hanzi: '星期',
    pinyin: 'xīng qī',
    meaning: 'tuần, thứ',
    examples: [
      ex('今天星期几？', 'Jīn tiān xīng qī jǐ?', 'Hôm nay thứ mấy?'),
      ex('下个星期见！', 'Xià ge xīng qī jiàn!', 'Tuần sau gặp nhé!'),
      ex('星期天我在家。', 'Xīng qī tiān wǒ zài jiā.', 'Chủ nhật tôi ở nhà.'),
    ],
  },
  {
    id: 'shihou',
    hanzi: '时候',
    pinyin: 'shí hou',
    meaning: 'lúc, khi',
    examples: [
      ex('什么时候上课？', 'Shén me shí hou shàng kè?', 'Khi nào vào học?'),
      ex('你什么时候回家？', 'Nǐ shén me shí hou huí jiā?', 'Khi nào bạn về nhà?'),
      ex('我小的时候很喜欢猫。', 'Wǒ xiǎo de shí hou hěn xǐ huan māo.', 'Hồi nhỏ tôi rất thích mèo.'),
    ],
  },
  {
    id: 'shangwu',
    hanzi: '上午',
    pinyin: 'shàng wǔ',
    meaning: 'buổi sáng',
    examples: [
      ex('上午我有课。', 'Shàng wǔ wǒ yǒu kè.', 'Buổi sáng tôi có tiết học.'),
      ex('明天上午你在家吗？', 'Míng tiān shàng wǔ nǐ zài jiā ma?', 'Sáng mai bạn có ở nhà không?'),
      ex('我上午九点上课。', 'Wǒ shàng wǔ jiǔ diǎn shàng kè.', 'Tôi vào học lúc chín giờ sáng.'),
    ],
  },
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
