export const articles = [
  {
    id: 'practice',
    title: '实践论',
    subtitle: '论认识和实践的关系——知和行的关系',
    category: '哲学思想',
    year: '1937年7月',
    summary: '从认识来源、发展与检验阐述实践第一性。',
    content: `马克思主义者认为：人类的生产活动是最基本的实践活动，是决定其他一切活动的东西。

人的正确思想，只能从社会实践中来，只能从社会的生产斗争、阶级斗争和科学实验这三项实践中来。

通过实践而发现真理，又通过实践而证实真理和发展真理。`,
  },
  {
    id: 'contradiction',
    title: '矛盾论',
    subtitle: '关于事物矛盾问题的哲学思考',
    category: '哲学思想',
    year: '1937年8月',
    summary: '强调矛盾普遍性与特殊性、主要矛盾与次要矛盾。',
    content: `事物发展的根本原因，不是在事物的外部而是在事物的内部，在于事物内部的矛盾性。

矛盾的普遍性寓于特殊性之中，特殊性也离不开普遍性。

在复杂事物发展过程中，存在许多矛盾，其中必有一种是主要的，起着领导和决定作用。`,
  },
  {
    id: 'against-bookism',
    title: '反对本本主义',
    subtitle: '没有调查，没有发言权',
    category: '调查研究',
    year: '1930年5月',
    summary: '倡导深入调查研究，反对教条主义。',
    content: `你对于某个问题没有调查，就停止你对某个问题的发言权。

没有调查，没有发言权。

调查就像“十月怀胎”，解决问题就像“一朝分娩”。调查就是解决问题。`,
  },
  {
    id: 'reform-study',
    title: '改造我们的学习',
    subtitle: '反对主观主义，树立实事求是学风',
    category: '学风建设',
    year: '1941年5月',
    summary: '强调理论联系实际，反对空谈。',
    content: `实事求是，不但是我们党的思想路线，也是我们学习和工作的基本方法。

有的同志满足于一知半解，夸夸其谈，这是极其有害的。

学习的目的全在于应用。`,
  },
  {
    id: 'serve-people',
    title: '为人民服务',
    subtitle: '中国共产党人的根本宗旨',
    category: '党建理论',
    year: '1944年9月',
    summary: '阐释全心全意为人民服务的宗旨。',
    content: `我们这个队伍完全是为着解放人民的，是彻底地为人民的利益工作的。

人总是要死的，但死的意义有不同。

为人民利益而死，就比泰山还重。`,
  },
  {
    id: 'foolish-old-man',
    title: '愚公移山',
    subtitle: '在中国共产党第七次全国代表大会上的闭幕词',
    category: '精神品质',
    year: '1945年6月',
    summary: '强调持之以恒与群众力量。',
    content: `下定决心，不怕牺牲，排除万难，去争取胜利。

中国人民正在受难，我们有责任解救他们。

只要我们坚持下去，就一定能够达到目的。`,
  },
  {
    id: 'protracted-war',
    title: '论持久战（节选）',
    subtitle: '抗日战争战略问题',
    category: '军事战略',
    year: '1938年5月',
    summary: '提出抗日战争将经过战略防御、相持、反攻三个阶段。',
    content: `抗日战争是持久战，最后胜利是中国的。

战争的伟力之最深厚的根源，存在于民众之中。

兵民是胜利之本。`,
  },
  {
    id: 'spark',
    title: '星星之火，可以燎原',
    subtitle: '关于中国革命道路的论述',
    category: '革命道路',
    year: '1930年1月',
    summary: '阐明农村包围城市、武装夺取政权道路。',
    content: `它是站在海岸遥望海中已经看得见桅杆尖头了的一只航船。

星星之火，可以燎原。

中国革命的高潮快要到来。`,
  },
]

export const categories = ['全部', ...new Set(articles.map((a) => a.category))]

export function getArticleById(id) {
  return articles.find((a) => a.id === id)
}
