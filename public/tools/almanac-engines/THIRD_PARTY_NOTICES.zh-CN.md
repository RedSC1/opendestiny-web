# 第三方来源与许可声明

`js-ephemeris-lite` 的项目原创源代码采用 Mozilla Public License 2.0
（MPL-2.0）发布。该许可证不取代下列科学模型、系数表、参考星历和历史资料
各自可能适用的权利与许可条件。

本包分发经过筛选的数值系数、JavaScript 求值器、本项目拟合的修正系数、
历史历法数据和中国年号数据。具体来源如下。

## 寿星天文历

本项目下列材料来源于许剑伟编写的《寿星天文历／寿星万年历》：

- `oba.getHuiLi()` 的算术回历规则；本项目改为整数周期计算，并补充反向转换；
- `src/generated/historical-calendar-data.js` 中的古代历法规则与历日归属；
- `src/generated/chinese-era-data.js` 中 529 条年号记录的起始年、名义时长、
  已使用年数、政权、君主称号、君主姓名和年号名称。

本项目对上述材料进行了压缩、保守匹配和明确记录的纠错或规范化；这些处理
不表示本项目将寿星原始材料重新许可为 MPL-2.0。

- 项目镜像与署名：<https://github.com/sxwnl/sxwnl>
- 原版权说明：<https://sxwnl.github.io/src/sm1.htm#copyright>

原版权说明原文如下：

> 本程序是开源的，你可以使用其中的任意部分代码，但不得随意修改“天文算法(eph.js)”及“农历算法(lunar.js)中古历部分的数据及算法”。一旦修改可能影响万年历的准确性，如果你对天文学不太了解而仅凭对历法的热情，请不要对此做任何修改，以免弄巧成拙。
>
> 如果在你自己开发的软件中使用了本程序的核心算法及数据，你可以在你的软件中申明“数据或算法来源于寿星天文历”，也可以不申明，但不可以申明为它其它来源。如有异义，可与我共内探讨。
>
> 作者：许剑伟，2008年11月于家里。xunmeng04#163.com，13850262218

本声明只描述当前 npm 包实际分发的内容。

## `huangli-lite` 使用的 cnlunar 规则

同仓库的 `huangli-lite` 包中，传统神煞、每日宜忌及相关基础规则和数据来源于
**cnlunar**。本项目在此基础上进行了 JavaScript 重写，并维护自己的规则修正、
冲突裁决、事项筛选、来源追踪、边界处理和结构化输出。

- 项目：<https://github.com/OPN48/cnlunar>
- 许可证：<https://github.com/OPN48/cnlunar/blob/master/LICENSE>
- Copyright (c) 2025 OPN48，MIT License。

黄历子包同时分发独立声明：
`packages/huangli/THIRD_PARTY_NOTICES.zh-CN.md`。

## VSOP2013

`src/planet-series.js` 中水星、金星、地球和火星的日心黄经、黄纬、距离系数，
由完整 VSOP2013 椭圆轨道要素解离线转换、展开并筛选生成。针对 JPL DE441
拟合的残差系数由本项目生成，并非复制自 VSOP2013。水星、金星、地球和火星
均发布为普通时间幂乘周期项的经典 Poisson 形式。快速事件路径按同频率的完整
多项式包络裁剪地球级数，不会把各时间幂拆开选择。四颗行星运行时分别使用
299/160/242、156/82/153、386/50/475 和 489/101/528 个经度／黄纬／距离项，
不再求解开普勒方程。地球表在生成阶段已经合入由地月质心到物理地心的月球
位移，运行时不需要再次计算并扣除月球位置。

- IMCCE VSOP2013 数据与文档：
  <https://ftp.imcce.fr/pub/ephem/planets/vsop2013/solution/>
- 模型文档：
  <https://ftp.imcce.fr/pub/ephem/planets/vsop2013/solution/README.pdf>

MPL-2.0 仅适用于本项目实现，不表示对 VSOP2013 理论或原始系数重新许可。

## TOP2013

木星、土星、天王星和海王星的级数包含从 IMCCE 官方 `TOP2013LBR.dat`
筛选、换基并结合本项目拟合修正得到的系数，发布表采用普通时间幂乘周期项的
经典 Poisson 形式。四颗行星均按 DE441 目标筛选，拟合得到的多项式和周期残差
直接折入同一张表；部分残差频率先从训练样本频谱中选取，再作局部优化。每颗
行星只使用一套覆盖完整支持区间的全局系数，不按年代切换分区表，也没有独立
修正表。运行时目标是各行星系统质心相对太阳的位置，不求解开普勒方程。拟合
残差由本项目生成，并非复制自 TOP2013；早期分段式天王星、海王星修正不再分发。

- TOP2013 数据：<https://ftp.imcce.fr/pub/ephem/planets/top2013/>
- TOP2013 文档：<https://ftp.imcce.fr/pub/ephem/planets/top2013/README.pdf>

## 冥王星近似模型

`src/planet-series.js` 中的 `PLUTO_NEAR_*` 和 `PLUTO_FALLBACK_*` 数组，是本项目
对 JPL DE441 中冥王星系统质心（目标 9）相对太阳位置的直接拟合。推荐的
1600～2200 年范围使用带外扩区间的 Chebyshev 拟合；其他日期仍可由低精度的
混合频率后备模型计算。后备模型的频率字典只把若干 TOP2013 平均运动用作候选
频率，不包含 TOP2013 的冥王星振幅系数。试验过的宽年代高精度候选没有进入
发布包。

该模型计算的是冥王星系统质心，不是冥王星本体中心或光心；推荐范围外的结果
不能用于高精度掩星计时。视圆面近似半径 1188.3 km 参考
[JPL 行星物理参数表](https://ssd.jpl.nasa.gov/planets/phys_par.html)。

## ELP/MPP02

`src/moon-series.js` 使用从 ELP/MPP02 DE405 模式系数表
`ELP_MAIN.S1..S3` 和 `ELP_PERT.S1..S3` 中截断、重排后得到的子集。

- J. Chapront、G. Francou，*The lunar theory ELP revisited. Introduction
  of new planetary perturbations*，Astronomy & Astrophysics 404 (2003)，
  735–742：<https://doi.org/10.1051/0004-6361:20030529>
- 巴黎天文台／SYRTE 原始表目录：
  `ftp://cyrano-se.obspm.fr/pub/2_lunar_solutions/2_elpmpp02`

生成本包时使用的原始系数文件未附常规 SPDX 或其他明确软件许可证。本声明
用于保留来源，不主张这些原始系数已按 MPL-2.0 重新许可。

## IAU 岁差与章动模型

坐标层实现 IAU 2000B 章动、IAU 2006 平黄赤交角，以及 Vondrák、
Capitaine 和 Wallace 发布的长期岁差表达式。

- Vondrák 等，*New precession expressions, valid for long time intervals*：
  <https://doi.org/10.1051/0004-6361/201117274>
- IAU SOFA：<https://www.iausofa.org/>
- SOFA 使用条款：<https://www.iausofa.org/terms-and-conditions>

SOFA 版权归 IAU Standards of Fundamental Astronomy Board 所有。
`js-ephemeris-lite` 不是 IAU SOFA Board 提供或认可的软件。

## JPL DE441 参考拟合

地球、月球以及各行星模型中的部分修正系数由本项目根据 JPL DE441 样本拟合。
发布包包含拟合后的系数，不包含 DE441 二进制星历核。

- Park 等，*The JPL Planetary and Lunar Ephemerides DE440 and DE441*：
  <https://doi.org/10.3847/1538-3881/abd414>
- JPL/NAIF 行星星历核目录：
  <https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/planets/>

## 中国历史历法归日数据

`src/generated/historical-calendar-data.js` 保存由上文所列古历数据和规则推导出的
历日归属。本项目把结果编码成“分段线性基线 + 稀疏残差”的紧凑表示。该文件
属于第三方资料的派生表示，不主张按 MPL-2.0 对原始古历材料重新许可。需要完全
采用独立许可历史历法数据的使用者，可以替换或省略该生成文件，改用
`china-astronomical` 或 `local-astronomical` 模式。

上游文档说明，其古历部分曾参校张培瑜《三千五百年历日天象》、陈垣
《二十史朔闰表》和方诗铭的中西历日对照资料。这些出版物仅作为历史参考文献，
本仓库不包含其内容。

## 中国年号与精确边界

`src/generated/chinese-era-data.js` 综合三套分别署名的数据，由
`tools/build-chinese-era-data.mjs` 生成。

### 上游 `JNB` 年号表

529 条年号记录的前七个字段来自上游 `src/lunar.js` 的 `JNB` 表，依次为起始年、
名义时长、此前已使用年数、政权、君主称号、君主姓名和年号名称；相关来源与
版权说明见本文开头。

生成时有两处明确记录的源字段规范化：

- 现代开放记录以有限的 `9999` 年作为哨兵值，生成表把它扩展为 `999999999`
  年，使记录在本项目扩展星历范围内保持开放；起始年、年号和纪年方式不变，
  源偏移量 `1948` 也保持不变；
- 后汉天福记录原为 `947,12,0`，其中名义时长与此前已用年数对调。本项目规范为
  `947,1,11`，表示后汉沿用天福十二年一年后改元乾祐；若保留 `12,0`，会错误地
  把刘知远和天福延续到 958 年，并从元年重新起算。

运行 `npm run verify:chinese-era-data` 可将生成记录与本地上游检出版本比较，检查
源字段是否发生非预期变化。

### DDBC 时间规范资料库

177 条经过保守匹配的中国历日边界来自法鼓佛教學院图书资讯馆整理的
**DDBC 时间规范资料库**。生成数据保留来源，不主张将这些边界重新许可为
MPL-2.0。生成器读取 2010 年 10 月快照中的 `authority_time_chinese.sql`，只采用
状态为 `S` 的规范月份记录，并连接朝代、帝王、年号和月份表。DDBC 的中国历日
数字会转换为 UTC+8 午夜的双精度 UT 儒略日。匹配采取保守策略：名称有歧义或
证据不足的记录保持 `null`，不会赋予看似精确但无法可靠支持的边界。

第八字段为 `null` 时，源表只提供名义起始年和时长。运行时会把边界标为“年精度”，
并以该历史农历年的初一作为有文档说明的后备起点。1912 和 1949 两个现代民用
边界在 `src/chinese-era.js` 中单独维护，不归于 DDBC。

- 下载页：<https://authority.dila.edu.tw/docs/open_content/download.php>
- 资料库归档文件声明 CC BY-SA 3.0 Unported；下载页同时标示
  CC BY-SA 2.5 Taiwan：
  <https://creativecommons.org/licenses/by-sa/3.0/>、
  <https://creativecommons.org/licenses/by-sa/2.5/tw/>

### manakai/data-locale

部分年号的精确起止日、补充政权及君主标签来自 `manakai/data-locale` 的
`calendar-era-defs.json` 与 `tags.json`。本项目只导入可保守匹配的规范边界，
并对显示名称作少量有记录的中文规范化。匹配依据包括年号、名义起始年、政权、
君主和君主称号；第八字段可以保存规范的首个及最后适用民用日。补充君主标签
通过 `tags.json` 的标签 ID 解析，简体显示使用 `name_cn`／`label_cn`，繁体显示
保留 `name_tw`／`label_tw`。少量经过复核的显示表会把封号、契丹／女真本名、
乳名或不常见非汉名规范为常见庙号、君主称号和中文史学姓名，同时在来源元数据
中保留上游标签 ID。

上游数据区分年号首日、颁布、启用、可能日期和史料误记等不同事件；本项目只
导入年号定义选定的规范 `start_day` 和含尾日的 `end_day`。一个年号区间若跨越
有独立史料支持的君主更替，可以用经过复核的分段表拆分显示标签而不改变年号和
纪年。当前东丹甘露在耶律倍离境与耶律安端受封处拆分，不确定的中间区间故意不
显示个人君主名称。

仅由 manakai 补入的保守子集包括上游 `JNB` 表缺少的蜀汉、孙吴、战国七雄、
部分五代十国、契丹／辽、西夏、金、渤海及相关短期政权。战国层仅从公元前
500 年起收入秦、齐、楚、燕、韩、赵、魏，不扩展到所有春秋政权。补充记录通常
必须具有明确政权、君主、首日和尾日；西夏是范围很窄的例外：若资料给出政权、
君主、名义首年和准确尾日而缺少 `start_day`，运行时以相应历史农历年初一开始，
并报告“年精度（月日不详）”。同等可信但互相冲突的边界不会猜选；标记为复开、
中断、恢复、旧称、争议、错误或虚构的记录也不进入连续边界层。

自动补充止于 1912 年以前，之后的政治或傀儡政权纪年不会自动导入。民国、现代
公历和洪宪规则是 `src/chinese-era.js` 中另行维护的例外。上游日对象同时给出 JD、
儒略历、公历和历史历法写法；本项目导入 JD，把中国民用边界规范为 UTC+8 午夜，
并将含尾日的 `end_day` 转成半开区间 `endJdExclusive`，不会把 1582 年以前的
儒略历日期误解释为逆推公历。生成文件头会记录本次所用合并 JSON 的 SHA-256。

上游将相关 JSON 和文档在法律允许的范围内以 CC0 贡献至公有领域。

- 仓库：<https://github.com/manakai/data-locale>
- 数据模型与许可：
  <https://github.com/manakai/data-locale/blob/master/doc/calendar-era-defs.txt>
- CC0 1.0：<https://creativecommons.org/publicdomain/zero/1.0/>

## 本项目生成的内容

下列内容由本项目生成和维护：

- 级数截断选择与排序；
- 低项数事件估算器及其低频修正；
- DE441 残差拟合系数；
- JavaScript 求值器、求解器、时间类型、历法 API 与测试；
- 历史归日资料的 32 位压缩运行时表示。
