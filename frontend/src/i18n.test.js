/**
 * i18n 多語系設定測試
 */

describe('i18n 翻譯檔案', () => {
  const zhTW = require('./locales/zh-TW/translation.json');
  const zhCN = require('./locales/zh-CN/translation.json');
  const en = require('./locales/en/translation.json');
  const ja = require('./locales/ja/translation.json');

  const allLanguages = { zhTW, zhCN, en, ja };

  /**
   * 取得物件所有鍵值路徑（展平）
   */
  function flattenKeys(obj, prefix = '') {
    return Object.keys(obj).reduce((acc, key) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        acc.push(...flattenKeys(obj[key], fullKey));
      } else {
        acc.push(fullKey);
      }
      return acc;
    }, []);
  }

  test('繁體中文翻譯檔案應包含所有必要的鍵值', () => {
    const keys = flattenKeys(zhTW);
    expect(keys).toContain('common.loading');
    expect(keys).toContain('login.brandTitle');
    expect(keys).toContain('gameSelection.title');
    expect(keys).toContain('gameStatus.title');
    expect(keys).toContain('herbalism.colors.red');
    expect(keys).toContain('evolution.traits.carnivore');
    expect(keys).toContain('settings.language');
  });

  test('所有語系應包含相同的頂層 namespace', () => {
    const namespaces = ['common', 'app', 'login', 'gameSelection', 'lobby', 'gameStatus', 'gamePhase', 'herbalism', 'evolution', 'settings', 'connection'];
    for (const lang of Object.keys(allLanguages)) {
      const translation = allLanguages[lang];
      for (const ns of namespaces) {
        expect(translation).toHaveProperty(ns, expect.anything());
      }
    }
  });

  test('所有語系的鍵數量應相同', () => {
    const zhTWKeys = flattenKeys(zhTW).sort();
    for (const [lang, translation] of Object.entries(allLanguages)) {
      const keys = flattenKeys(translation).sort();
      expect(keys.length).toBe(zhTWKeys.length);
    }
  });

  test('繁體中文：顏色翻譯應完整', () => {
    expect(zhTW.herbalism.colors.red).toBe('紅色');
    expect(zhTW.herbalism.colors.yellow).toBe('黃色');
    expect(zhTW.herbalism.colors.green).toBe('綠色');
    expect(zhTW.herbalism.colors.blue).toBe('藍色');
  });

  test('英文：顏色翻譯應完整', () => {
    expect(en.herbalism.colors.red).toBe('Red');
    expect(en.herbalism.colors.yellow).toBe('Yellow');
    expect(en.herbalism.colors.green).toBe('Green');
    expect(en.herbalism.colors.blue).toBe('Blue');
  });

  test('所有語系應包含 19 種演化論性狀', () => {
    const traitKeys = [
      'carnivore', 'scavenger', 'keen_vision', 'camouflage', 'burrowing',
      'venom', 'aquatic', 'agility', 'gigantism', 'autotomy', 'mimicry',
      'fat_tissue', 'hibernation', 'parasite', 'piracy', 'communication',
      'cooperation', 'symbiosis', 'stomping'
    ];
    for (const lang of Object.keys(allLanguages)) {
      const traits = allLanguages[lang].evolution.traits;
      for (const trait of traitKeys) {
        expect(traits).toHaveProperty(trait);
      }
    }
  });

  test('所有語系應包含演化論遊戲階段', () => {
    const phaseKeys = ['waiting', 'evolution', 'foodSupply', 'feeding', 'extinction', 'gameEnd'];
    for (const lang of Object.keys(allLanguages)) {
      const phases = allLanguages[lang].evolution.phases;
      for (const phase of phaseKeys) {
        expect(phases).toHaveProperty(phase);
      }
    }
  });

  test('日文：問牌類型翻譯應完整', () => {
    expect(ja.herbalism.questionTypes['1']).toBeTruthy();
    expect(ja.herbalism.questionTypes['2']).toBeTruthy();
    expect(ja.herbalism.questionTypes['3']).toBeTruthy();
  });

  test('設定頁面語系名稱應包含四種語言', () => {
    for (const lang of Object.keys(allLanguages)) {
      const languages = allLanguages[lang].settings.languages;
      expect(languages).toHaveProperty('zh-TW');
      expect(languages).toHaveProperty('zh-CN');
      expect(languages).toHaveProperty('en');
      expect(languages).toHaveProperty('ja');
    }
  });
});

describe('setupTests mockT 插值功能', () => {
  /**
   * 直接測試 setupTests.js 中的 mockT 邏輯
   */
  const zhTW = require('./locales/zh-TW/translation.json');

  function getNestedValue(obj, key) {
    return key.split('.').reduce((acc, k) => (acc && acc[k] !== undefined ? acc[k] : undefined), obj);
  }

  function mockT(key, options) {
    const value = getNestedValue(zhTW, key);
    if (value === undefined) {
      return options?.defaultValue !== undefined ? options.defaultValue : key;
    }
    if (typeof value === 'string' && options) {
      return value.replace(/\{\{(\w+)\}\}/g, (_, k) =>
        options[k] !== undefined ? String(options[k]) : `{{${k}}}`
      );
    }
    return typeof value === 'string' ? value : key;
  }

  test('應正確翻譯無插值的鍵值', () => {
    expect(mockT('common.loading')).toBe('載入中...');
    expect(mockT('gameStatus.title')).toBe('遊戲狀態');
  });

  test('應正確處理 {{count}} 插值', () => {
    const result = mockT('gameStatus.moreHistory', { count: 5 });
    expect(result).toBe('還有 5 條更早的記錄');
  });

  test('應正確處理多個插值變數', () => {
    const result = mockT('gameStatus.questionAction', {
      player: '玩家1', target: '玩家2', type: '各一張', count: 3
    });
    expect(result).toBe('玩家1 向 玩家2 問牌（各一張），收到 3 張');
  });

  test('找不到鍵值時應返回鍵名', () => {
    expect(mockT('nonexistent.key')).toBe('nonexistent.key');
  });

  test('找不到鍵值但有 defaultValue 時應返回 defaultValue', () => {
    expect(mockT('nonexistent.key', { defaultValue: '預設值' })).toBe('預設值');
  });

  test('插值變數不存在時應保留原始佔位符', () => {
    const result = mockT('gameStatus.moreHistory', {});
    expect(result).toBe('還有 {{count}} 條更早的記錄');
  });
});
