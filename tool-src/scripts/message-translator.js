export function createMessageTranslator(messages) {
  const exact = new Map(Object.entries(messages));
  const trie = new Map();

  for (const [source, target] of exact) {
    // An unchanged fragment has no work to do inside a longer message. Keeping
    // it in the trie can consume text before a meaningful phrase begins, e.g.
    // `· 煞` would otherwise prevent the following `煞东` from becoming `煞東`.
    if (source === target) continue;
    let node = trie;
    for (const character of source) {
      if (!node.has(character)) node.set(character, new Map());
      node = node.get(character);
    }
    node.target = target;
  }

  return function translate(source) {
    const direct = exact.get(source);
    if (direct !== undefined) return direct;
    let result = '';
    for (let index = 0; index < source.length;) {
      let node = trie;
      let cursor = index;
      let matchedTarget;
      let matchedEnd = index;
      while (cursor < source.length && node.has(source[cursor])) {
        node = node.get(source[cursor]);
        cursor += 1;
        if (node.target !== undefined) {
          matchedTarget = node.target;
          matchedEnd = cursor;
        }
      }
      if (matchedTarget !== undefined) {
        result += matchedTarget;
        index = matchedEnd;
      } else {
        result += source[index];
        index += 1;
      }
    }
    return result;
  };
}
