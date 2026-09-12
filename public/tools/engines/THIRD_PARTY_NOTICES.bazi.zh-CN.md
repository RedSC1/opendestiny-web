# bazi-lite 第三方来源与许可声明

`bazi-lite` 的八字规则、数据结构、JavaScript／TypeScript 实现及随包默认数据
由本项目自行编写和维护，未引入独立的第三方八字规则库或数据包。开发期间用于
回归测试的本项目 C++ 实现与测试夹具同样属于本项目，不是第三方运行时材料。

本包采用 Mozilla Public License 2.0（MPL-2.0），完整条款见 `LICENSE`。

## js-ephemeris-lite

本包依赖 `js-ephemeris-lite` 提供历法、四柱边界、节气和太阳时计算。
`js-ephemeris-lite` 是独立 npm 包，其科学模型、历史历法和年号资料来源不在
本包中重复声明，请参阅该依赖包随附的：

- `LICENSE`
- `THIRD_PARTY_NOTICES.md`
- `THIRD_PARTY_NOTICES.zh-CN.md`

依赖关系不表示 `bazi-lite` 将核心包的第三方材料重新许可，也不表示核心包的
第三方材料属于 `bazi-lite` 自行创作的八字规则。
