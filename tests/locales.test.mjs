import test from 'node:test';
import assert from 'node:assert/strict';
import {messages as simplified} from '../tool-src/scripts/locales/zh-CN.js';
import {messages as traditional} from '../tool-src/scripts/locales/zh-TW.js';
import {createMessageTranslator} from '../tool-src/scripts/message-translator.js';

const translate = createMessageTranslator(traditional);

test('both language files contain the same explicit message keys', () => {
  assert.deepEqual(Object.keys(traditional), Object.keys(simplified));
  assert.ok(Object.keys(simplified).length > 1000);
});

test('traditional terms preserve chart symbols', () => {
  assert.equal(translate('紫微斗数：子丑寅卯辰巳午未申酉戌亥；台辅与天干地支'), '紫微斗數：子丑寅卯辰巳午未申酉戌亥；台輔與天干地支');
  assert.equal(translate('乙丑、辛丑、丑时'), '乙丑、辛丑、丑時');
  assert.equal(translate('甲干四化、戊干四化、辛干四化、次日干起时柱'), '甲干四化、戊干四化、辛干四化、次日干起時柱');
});

test('traditional terms resolve ambiguous prose by complete phrase', () => {
  assert.equal(translate('丑陋、丑恶、丑闻与丑态'), '醜陋、醜惡、醜聞與醜態');
  assert.equal(translate('干部干活，干净干燥，树干与饼干'), '幹部幹活，乾淨乾燥，樹幹與餅乾');
  assert.equal(translate('天干地支与若干设置'), '天干地支與若干設定');
});

test('calendar runtime vocabulary is translated with domain-safe phrases', () => {
  assert.equal(
    translate('抗战胜利、教师节、国际和平日、中秋节、国庆节、辛亥纪念'),
    '抗戰勝利、教師節、國際和平日、中秋節、國慶節、辛亥紀念',
  );
  assert.equal(
    translate('冲羊 · 煞东；结婚姻、进人口、阳贵'),
    '衝羊 · 煞東；結婚姻、進人口、陽貴',
  );
  assert.equal(
    translate('丑不冠带主不还乡、斗木獬'),
    '丑不冠帶主不還鄉、斗木獬',
  );
});

test('unregistered text is preserved instead of guessed character by character', () => {
  assert.equal(translate('这是一句没有登记过的自定义姓名：后发干'), '这是一句没有登记过的自定义姓名：后发干');
});
