/**
 * 擴充包相容性檢查器
 *
 * 檢查擴充包組合的依賴關係、衝突和玩家數範圍
 *
 * @module expansions/compatibility
 */

const { expansionLoader } = require('./loader');

/**
 * 相容性檢查結果
 */
class CompatibilityResult {
  constructor() {
    this.compatible = true;
    this.issues = [];
    this.suggestions = [];
  }

  /**
   * 新增問題
   * @param {string} type - 問題類型
   * @param {string} message - 問題訊息
   * @param {Object} details - 詳細資訊
   */
  addIssue(type, message, details = {}) {
    this.compatible = false;
    this.issues.push({ type, message, details });
  }

  /**
   * 新增建議
   * @param {string} message - 建議訊息
   */
  addSuggestion(message) {
    this.suggestions.push(message);
  }

  /**
   * 轉換為 JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      compatible: this.compatible,
      issues: this.issues,
      suggestions: this.suggestions,
    };
  }
}

/**
 * 擴充包相容性檢查器
 */
class CompatibilityChecker {
  /**
   * 檢查擴充包組合相容性
   * @param {string[]} expansionIds - 擴充包 ID 列表
   * @returns {Promise<CompatibilityResult>}
   */
  async check(expansionIds) {
    const result = new CompatibilityResult();

    // 確保基礎版存在
    if (!expansionIds.includes('base')) {
      result.addIssue('missing_base', 'Base expansion is required');
      return result;
    }

    // 載入所有擴充包
    const expansions = await this._loadAll(expansionIds, result);
    if (!result.compatible) {
      return result;
    }

    // 檢查依賴
    this._checkDependencies(expansions, result);

    // 檢查衝突
    this._checkConflicts(expansions, result);

    // 檢查玩家數
    this._checkPlayerRange(expansions, result);

    // 檢查性狀衝突
    this._checkTraitConflicts(expansions, result);

    // 建議
    this._generateSuggestions(expansions, result);

    return result;
  }

  /**
   * 取得擴充包組合的玩家數範圍
   * @param {string[]} expansionIds - 擴充包 ID 列表
   * @returns {Promise<{ minPlayers: number, maxPlayers: number }>}
   */
  async getPlayerRange(expansionIds) {
    let minPlayers = 2;
    let maxPlayers = 4;

    for (const id of expansionIds) {
      const loadResult = expansionLoader.getLoaded(id);
      if (loadResult?.manifest) {
        const manifest = loadResult.manifest;
        if (manifest.minPlayers !== undefined) {
          minPlayers = Math.max(minPlayers, manifest.minPlayers);
        }
        if (manifest.maxPlayers !== undefined) {
          maxPlayers = Math.min(maxPlayers, manifest.maxPlayers);
        }
      }
    }

    return { minPlayers, maxPlayers };
  }

  /**
   * 載入所有擴充包
   * @private
   * @param {string[]} expansionIds
   * @param {CompatibilityResult} result
   * @returns {Promise<Map>}
   */
  async _loadAll(expansionIds, result) {
    const expansions = new Map();

    for (const id of expansionIds) {
      try {
        const loadResult = await expansionLoader.load(id);
        if (!loadResult.success) {
          result.addIssue('load_failed', `Failed to load expansion: ${id}`, {
            expansionId: id,
            error: loadResult.error,
          });
        } else {
          expansions.set(id, loadResult);
        }
      } catch (error) {
        result.addIssue('load_error', `Error loading expansion: ${id}`, {
          expansionId: id,
          error: error.message,
        });
      }
    }

    return expansions;
  }

  /**
   * 檢查依賴關係
   * @private
   * @param {Map} expansions
   * @param {CompatibilityResult} result
   */
  _checkDependencies(expansions, result) {
    for (const [id, loadResult] of expansions) {
      const manifest = loadResult.manifest;
      if (!manifest.dependencies) continue;

      for (const [depId, versionRange] of Object.entries(manifest.dependencies)) {
        // 檢查依賴是否存在
        if (!expansions.has(depId)) {
          result.addIssue('missing_dependency', `Expansion "${id}" requires "${depId}"`, {
            expansionId: id,
            dependencyId: depId,
            requiredVersion: versionRange,
          });
          continue;
        }

        // 檢查版本
        const depManifest = expansions.get(depId).manifest;
        if (!this._matchVersion(depManifest.version, versionRange)) {
          result.addIssue('version_mismatch',
            `Expansion "${id}" requires "${depId}" version ${versionRange}, but ${depManifest.version} is installed`, {
              expansionId: id,
              dependencyId: depId,
              requiredVersion: versionRange,
              installedVersion: depManifest.version,
            });
        }
      }
    }
  }

  /**
   * 檢查衝突
   * @private
   * @param {Map} expansions
   * @param {CompatibilityResult} result
   */
  _checkConflicts(expansions, result) {
    for (const [id, loadResult] of expansions) {
      const manifest = loadResult.manifest;
      if (!manifest.conflicts) continue;

      for (const [conflictId, reason] of Object.entries(manifest.conflicts)) {
        if (expansions.has(conflictId)) {
          result.addIssue('conflict',
            `Expansion "${id}" conflicts with "${conflictId}": ${reason}`, {
              expansionId: id,
              conflictingId: conflictId,
              reason,
            });
        }
      }
    }
  }

  /**
   * 檢查玩家數範圍
   * @private
   * @param {Map} expansions
   * @param {CompatibilityResult} result
   */
  _checkPlayerRange(expansions, result) {
    let minPlayers = 0;
    let maxPlayers = Infinity;

    for (const [id, loadResult] of expansions) {
      const manifest = loadResult.manifest;
      if (manifest.minPlayers !== undefined) {
        minPlayers = Math.max(minPlayers, manifest.minPlayers);
      }
      if (manifest.maxPlayers !== undefined) {
        maxPlayers = Math.min(maxPlayers, manifest.maxPlayers);
      }
    }

    if (minPlayers > maxPlayers) {
      result.addIssue('player_range',
        `Incompatible player ranges: min ${minPlayers} > max ${maxPlayers}`, {
          minPlayers,
          maxPlayers,
        });
    }
  }

  /**
   * 檢查性狀衝突
   * @private
   * @param {Map} expansions
   * @param {CompatibilityResult} result
   */
  _checkTraitConflicts(expansions, result) {
    const traitSources = new Map();

    for (const [id, loadResult] of expansions) {
      const module = loadResult.module;
      if (!module.traits) continue;

      for (const traitType of Object.keys(module.traits)) {
        if (traitSources.has(traitType)) {
          const existingSource = traitSources.get(traitType);
          // 基礎版可被擴充包覆寫
          if (existingSource === 'base') {
            result.addSuggestion(`Trait "${traitType}" will be overridden by "${id}"`);
            traitSources.set(traitType, id);
          } else {
            result.addIssue('trait_conflict',
              `Trait "${traitType}" defined in multiple expansions: "${existingSource}" and "${id}"`, {
                traitType,
                expansions: [existingSource, id],
              });
          }
        } else {
          traitSources.set(traitType, id);
        }
      }
    }
  }

  /**
   * 產生建議
   * @private
   * @param {Map} expansions
   * @param {CompatibilityResult} result
   */
  _generateSuggestions(expansions, result) {
    // 計算總卡牌數
    let totalCards = 0;
    for (const [id, loadResult] of expansions) {
      const manifest = loadResult.manifest;
      if (manifest.contents?.cards) {
        totalCards += manifest.contents.cards;
      }
    }

    if (totalCards > 150) {
      result.addSuggestion(
        `Total cards (${totalCards}) is high. Consider longer game sessions.`
      );
    }
  }

  /**
   * 版本匹配
   * @private
   * @param {string} version - 實際版本
   * @param {string} range - 要求的版本範圍
   * @returns {boolean}
   */
  _matchVersion(version, range) {
    if (range.startsWith('>=')) {
      const required = range.slice(2);
      return this._compareVersions(version, required) >= 0;
    }
    if (range.startsWith('^')) {
      const required = range.slice(1);
      const [major1] = version.split('.');
      const [major2] = required.split('.');
      return major1 === major2 && this._compareVersions(version, required) >= 0;
    }
    return version === range;
  }

  /**
   * 比較版本
   * @private
   * @param {string} a
   * @param {string} b
   * @returns {number}
   */
  _compareVersions(a, b) {
    const pa = a.split('.').map(Number);
    const pb = b.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
      if ((pa[i] || 0) > (pb[i] || 0)) return 1;
      if ((pa[i] || 0) < (pb[i] || 0)) return -1;
    }
    return 0;
  }
}

// 預設實例
const compatibilityChecker = new CompatibilityChecker();

module.exports = {
  CompatibilityResult,
  CompatibilityChecker,
  compatibilityChecker,
};
