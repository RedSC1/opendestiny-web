# Sources and licenses

## TuWang calendar rule

The automatic TuWang period uses the eighteen civil days before each of the
four seasonal starts, as described in the Five Elements chapter of
*Qinding Xieji Bianfang Shu* (钦定协纪辨方书).

- Text: <https://www.shidianguji.com/book/SK1619/chapter/1l9llosnxbyg2>.

## cnlunar

- Source: <https://github.com/OPN48/cnlunar>.
- License: <https://github.com/OPN48/cnlunar/blob/master/LICENSE>.
- Copyright (c) 2025 OPN48; MIT License, reproduced in `LICENSE`.
- Traditional almanac rules and data in this JavaScript package are derived
  from cnlunar; that attribution is retained here.

This package rewrites those rules in JavaScript and maintains its own rule
corrections, conflict resolution, activity filtering, provenance, boundary
handling and structured output. Its almanac metadata, flying-star formulas,
24-mountain plates and PaiLong implementation are project-maintained material.

## Shou Xing festival table

The fixed solar and lunar festival entries, importance levels, public-holiday
flags, year bounds, weekday rules and dynamic rules in `src/festival-data.js`
and `src/festivals.js` are derived from the festival definitions in Shou Xing
Tian Wen Li / Shou Xing Wan Nian Li (寿星天文历 / 寿星万年历), authored by Xu
Jianwei (许剑伟). This package adds normalized formal names, compact display
names, aliases and three display tiers.

- Original project mirror and attribution: <https://github.com/sxwnl/sxwnl>.
- Original copyright statement:
  <https://sxwnl.github.io/src/sm1.htm#copyright>.

The original copyright statement is reproduced below without modification:

> 本程序是开源的，你可以使用其中的任意部分代码，但不得随意修改“天文算法(eph.js)”及“农历算法(lunar.js)中古历部分的数据及算法”。一旦修改可能影响万年历的准确性，如果你对天文学不太了解而仅凭对历法的热情，请不要对此做任何修改，以免弄巧成拙。
>
> 如果在你自己开发的软件中使用了本程序的核心算法及数据，你可以在你的软件中申明“数据或算法来源于寿星天文历”，也可以不申明，但不可以申明为它其它来源。如有异义，可与我共内探讨。
>
> 作者：许剑伟，2008年11月于家里。xunmeng04#163.com，13850262218

The Shou Xing distribution describes the program as open source but does not
provide a conventional SPDX license for the original festival table. This
notice therefore identifies the retained festival records as third-party
material and does **not** claim to relicense those records under this package's
MIT license. The JavaScript classification, compact names, aliases and display
tiers added by this package are project-maintained adaptations.

Selected modern public and memorial names follow these sources:

- State Council, *全国年节及纪念日放假办法* (2024 revision):
  <https://app.www.gov.cn/govdata/gov/202411/12/521605/article.html>.
- Ministry of Foreign Affairs, *外交史上的今天* (September 3):
  <https://www.fmprc.gov.cn/web/ziliao_674904/historytoday_674971/200309/t20030903_9284634.shtml>.
- Nanjing Municipal Government, 2025 national memorial ceremony notice:
  <https://www.nanjing.gov.cn/zdgk/202512/t20251208_5708072.html>.
- UNESCO, *世界图书和版权日* (April 23):
  <https://www.unesco.org/zh/days/world-book-and-copyright>.

Festival labels and source public-holiday flags do not include annual holiday,
make-up workday or historical name schedules.

## Unicode simplified-to-traditional conversion data

The committed `src/zh-hant-data.js` display lookup is generated at development
time with Foundation's `Simplified-Traditional` string transform, backed by
Unicode/ICU conversion data. The published package performs table lookup only
and has no ICU runtime dependency.

- ICU project and license: <https://github.com/unicode-org/icu/blob/main/LICENSE>.
- Copyright © Unicode, Inc. All rights reserved.

## js-ephemeris-lite

The astronomical/calendar runtime is a separate dependency licensed under
MPL-2.0. Its own `LICENSE` and `THIRD_PARTY_NOTICES.md` apply to that dependency;
this package's MIT license does not relicense the ephemeris or its source data.
