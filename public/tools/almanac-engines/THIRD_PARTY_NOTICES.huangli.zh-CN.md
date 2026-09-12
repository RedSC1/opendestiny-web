# huangli-lite 第三方来源与许可声明

`huangli-lite` 的项目原创代码采用 MIT License 发布。项目许可证不取代下列
第三方规则、数据和资料各自可能适用的权利与许可条件。

## cnlunar：神煞与每日宜忌

本包的传统神煞、每日宜忌及相关基础规则和数据来源于 `cnlunar`。本项目在此
基础上进行了 JavaScript 重写，并维护了规则修正、冲突裁决、事项筛选、来源
追踪、边界处理和结构化输出等改动。

- 项目：<https://github.com/OPN48/cnlunar>
- 许可证：<https://github.com/OPN48/cnlunar/blob/master/LICENSE>
- Copyright (c) 2025 OPN48，MIT License。

`huangli-lite` 的 `LICENSE` 保留了 cnlunar 的版权署名。

## 寿星天文历：节日资料

本包的固定公历节日、农历节日、重要性标记、放假标记、适用年份、星期规则和
动态民俗规则来源于许剑伟编写的《寿星天文历／寿星万年历》节日表。本项目在
此基础上增加或维护了正式名称、月格短名、别名、显示优先级、内容分层、部分
现代纪念日名称和适用年份修正。

- 项目镜像与署名：<https://github.com/sxwnl/sxwnl>
- 原版权说明：<https://sxwnl.github.io/src/sm1.htm#copyright>

原版权说明原文如下：

> 本程序是开源的，你可以使用其中的任意部分代码，但不得随意修改“天文算法(eph.js)”及“农历算法(lunar.js)中古历部分的数据及算法”。一旦修改可能影响万年历的准确性，如果你对天文学不太了解而仅凭对历法的热情，请不要对此做任何修改，以免弄巧成拙。
>
> 如果在你自己开发的软件中使用了本程序的核心算法及数据，你可以在你的软件中申明“数据或算法来源于寿星天文历”，也可以不申明，但不可以申明为它其它来源。如有异义，可与我共内探讨。
>
> 作者：许剑伟，2008年11月于家里。xunmeng04#163.com，13850262218

寿星没有为该节日表提供常规 SPDX 许可证。本声明保留其来源，不主张将寿星
原始节日记录重新许可为本包的 MIT License。本项目新增或修改的 JavaScript
实现、短名、别名和显示策略由本项目维护。

部分现代节日和纪念日名称参考：

- 国务院《全国年节及纪念日放假办法》（2024 年修订）：
  <https://app.www.gov.cn/govdata/gov/202411/12/521605/article.html>
- 外交部“外交史上的今天”（9 月 3 日）：
  <https://www.fmprc.gov.cn/web/ziliao_674904/historytoday_674971/200309/t20030903_9284634.shtml>
- 南京市政府国家公祭仪式公告：
  <https://www.nanjing.gov.cn/zdgk/202512/t20251208_5708072.html>
- UNESCO 世界图书与版权日：
  <https://www.unesco.org/zh/days/world-book-and-copyright>

节日名称和来源表中的放假标记不等同于逐年官方放假、补班安排。

## Unicode 简繁转换资料

随包发布的 `src/zh-hant-data.js` 展示字典在开发阶段通过 Foundation 的
`Simplified-Traditional` 字符串转换生成，其转换资料由 Unicode／ICU 提供。
发布包在运行时只读取已生成的字典，不依赖 ICU。

- ICU 项目及许可证：<https://github.com/unicode-org/icu/blob/main/LICENSE>
- Copyright © Unicode, Inc. All rights reserved.

## 土王用事资料参考

四立前十八日的自动判定参考《钦定协纪辨方书》五行部分：
<https://www.shidianguji.com/book/SK1619/chapter/1l9llosnxbyg2>。

## js-ephemeris-lite

本包依赖 `js-ephemeris-lite` 提供天文与历法计算。该依赖采用 MPL-2.0，
其科学模型和历史资料来源见依赖包自己的 `LICENSE`、
`THIRD_PARTY_NOTICES.md` 和 `THIRD_PARTY_NOTICES.zh-CN.md`；本包的 MIT
License 不会将该依赖及其数据重新许可。

英文说明见 [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)。
