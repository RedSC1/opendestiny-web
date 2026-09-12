// tarot.js
// 纯逻辑的 Rider-Waite-Smith 塔罗牌堆模拟器（无 DOM / 无 UI / 无第三方依赖）。
// 设计目标：一副牌在创建时一次性完成「洗牌 + 正逆位定序」，之后整个生命周期只读。

"use strict";

/* ------------------------------------------------------------------ */
/* 1. 完整的 78 张牌定义（canonical deck 顺序，仅作初始顺序）            */
/* ------------------------------------------------------------------ */

const MAJOR_ARCANA_NAMES = [
  "The Fool", "The Magician", "The High Priestess", "The Empress",
  "The Emperor", "The Hierophant", "The Lovers", "The Chariot",
  "Strength", "The Hermit", "Wheel of Fortune", "Justice",
  "The Hanged Man", "Death", "Temperance", "The Devil",
  "The Tower", "The Star", "The Moon", "The Sun",
  "Judgement", "The World",
];

const SUITS = ["Wands", "Cups", "Swords", "Pentacles"];

const RANK_NAMES = [
  "Ace", "Two", "Three", "Four", "Five", "Six", "Seven",
  "Eight", "Nine", "Ten", "Page", "Knight", "Queen", "King",
];

/**
 * 构建canonical 顺序的 78 张牌。
 * id 规则：Major Arcana 为 0–21；Minor Arcana 为 22–77（按花色 × 点数顺序）。
 * Major 牌：suit = null，rank 用牌在大阿卡纳中的序号（0–21）表示。
 * Minor 牌：rank 1–14（1=Ace … 14=King）。
 */
function buildCanonicalDeck() {
  const cards = [];

  for (let i = 0; i < 22; i++) {
    cards.push({
      id: i,
      name: MAJOR_ARCANA_NAMES[i],
      arcana: "major",
      suit: null,
      rank: i,
    });
  }

  let id = 22;
  for (const suit of SUITS) {
    for (let rank = 1; rank <= 14; rank++) {
      cards.push({
        id: id++,
        name: `${RANK_NAMES[rank - 1]} of ${suit}`,
        arcana: "minor",
        suit,
        rank,
      });
    }
  }

  return cards;
}

/* ------------------------------------------------------------------ */
/* 2. 安全随机数（crypto + rejection sampling，无 modulo bias）          */
/* ------------------------------------------------------------------ */

/**
 * 在 [0, maxExclusive) 内返回密码学安全的均匀随机整数。
 *
 * 使用 rejection sampling：先把 32 位随机空间截断到 maxExclusive 的
 * 最大整数倍（limit），落在 [limit, 2^32) 的样本整体丢弃重抽。
 * 只有这样每个余数出现的概率才严格相等，避免 `random % n` 的 modulo bias。
 *
 * 每个 maxExclusive 对应的拒绝概率 < 50%，期望重抽次数 < 2，性能足够。
 */
function secureRandomInt(maxExclusive) {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
    throw new RangeError(`maxExclusive 必须是正整数，收到: ${maxExclusive}`);
  }
  if (maxExclusive > 0x100000000) {
    throw new RangeError("maxExclusive 不能超过 2^32");
  }

  const cryptoObj = globalThis.crypto;
  if (!cryptoObj || typeof cryptoObj.getRandomValues !== "function") {
    throw new Error("当前环境缺少 globalThis.crypto.getRandomValues()，无法提供安全随机数");
  }

  const RANGE = 0x100000000; // 2^32
  const limit = RANGE - (RANGE % maxExclusive); // maxExclusive 的最大整数倍
  const buf = new Uint32Array(1);

  do {
    cryptoObj.getRandomValues(buf);
  } while (buf[0] >= limit); // 拒绝采样：丢弃会引入偏差的区间

  return buf[0] % maxExclusive; // 此时余数严格均匀
}

/* ------------------------------------------------------------------ */
/* 3. TarotDeck                                                        */
/* ------------------------------------------------------------------ */

class TarotDeck {
  constructor({ cardIds } = {}) {
    // canonical 顺序 → 一次性 Fisher-Yates 洗成随机排列
    const canonical = buildCanonicalDeck();
    if (cardIds !== undefined && (!Array.isArray(cardIds) || cardIds.length === 0 ||
        new Set(cardIds).size !== cardIds.length ||
        cardIds.some(id => !Number.isInteger(id) || id < 0 || id >= canonical.length))) {
      throw new RangeError("cardIds 必须是非空、不重复的有效 card id 数组");
    }
    // 先确定参与的牌，再使用原 Fisher-Yates 算法；调用方传入顺序不影响 canonical 起点。
    const selected = cardIds === undefined ? null : new Set(cardIds);
    const cards = selected ? canonical.filter(card => selected.has(card.id)) : canonical;
    for (let i = cards.length - 1; i > 0; i--) {
      const j = secureRandomInt(i + 1);
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }

    // 一次性确定整副牌的正逆位：BigInt mask，第 i 位 = 牌位 i 是否逆位。
    // 每一位独立 50%（secureRandomInt(2)），创建后不再改变。
    let mask = 0n;
    for (let i = 0; i < cards.length; i++) {
      if (secureRandomInt(2) === 1) {
        mask |= 1n << BigInt(i);
      }
    }

    this._stack = Object.freeze(cards);       // 固定的随机排列
    this._orientationMask = mask;             // 固定的正逆位
    this._next = 0;                           // 已抽张数
    this._remaining = cards.map((_, i) => i); // 未抽牌的原始物理位置
    this._drawnPositions = [];                // 按抽出顺序记录原始位置
  }

  /** 牌位 i 是否逆位（只读，不产生随机数） */
  _isReversedAt(position) {
    return ((this._orientationMask >> BigInt(position)) & 1n) === 1n;
  }

  /**
   * 从牌堆顶部抽牌，无放回。
   * draw() 抽 1 张；draw(n) 连续抽 n 张（保持抽出顺序）。
   * 牌不够或已抽空时抛出清晰错误。
   */
  draw(count = 1) {
    if (!Number.isInteger(count) || count <= 0) {
      throw new RangeError(`draw(count) 要求正整数，收到: ${count}`);
    }
    const remaining = this.remainingCount;
    if (remaining === 0) {
      throw new Error("牌堆已空：所有牌已全部抽出，无法继续抽牌。请创建一副新的 TarotDeck。");
    }
    if (count > remaining) {
      throw new Error(`牌堆剩余 ${remaining} 张，不足以抽出 ${count} 张。`);
    }

    const drawn = [];
    for (let k = 0; k < count; k++) {
      drawn.push(this.drawAt(0));
    }
    return count === 1 ? drawn[0] : drawn;
  }

  /** 取出当前剩余牌带的第 index 张；保留原洗牌位置和正逆位，不产生随机数。 */
  drawAt(index) {
    if (!Number.isInteger(index) || index < 0 || index >= this.remainingCount) {
      throw new RangeError(`drawAt(index) 位置超出剩余牌堆范围: ${index}`);
    }
    const [position] = this._remaining.splice(index, 1);
    this._drawnPositions.push(position);
    this._next++;
    return { ...this._stack[position], reversed: this._isReversedAt(position) };
  }

  /** 剩余未抽的张数 */
  get remainingCount() {
    return this._stack.length - this._next;
  }

  /** 剩余的牌（牌面朝下，因此不暴露正逆位）。返回副本，修改不影响牌堆。 */
  getRemainingCards() {
    return this._remaining.map((position) => this._stack[position]).map((c) => ({
      id: c.id, name: c.name, arcana: c.arcana, suit: c.suit, rank: c.rank,
    }));
  }

  /** 已抽出的牌（含正逆位），按抽出顺序。返回副本。 */
  getDrawnCards() {
    const drawn = [];
    for (const pos of this._drawnPositions) {
      const c = this._stack[pos];
      drawn.push({
        id: c.id, name: c.name, arcana: c.arcana, suit: c.suit, rank: c.rank,
        reversed: this._isReversedAt(pos),
      });
    }
    return drawn;
  }
}

export { TarotDeck, buildCanonicalDeck, secureRandomInt };
