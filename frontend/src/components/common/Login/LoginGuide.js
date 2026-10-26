import React from 'react';
import { CARD_COUNTS, MIN_PLAYERS, MAX_PLAYERS, HIDDEN_CARDS_COUNT } from '../../../shared/constants';

const colorNames = { red: '紅色', yellow: '黃色', green: '綠色', blue: '藍色' };

// Summaries of docs/本草/GAME_RULES.md and docs/演化論/GAME_RULES_EVOLUTION.md.
export default function LoginGuide({ isEvolution }) {
  return (
    <div className="login-guide">
      <section id="login-rules" tabIndex={-1} aria-labelledby="login-rules-title">
        <h2 id="login-rules-title">規則書・入門重點</h2>
        {isEvolution ? (
          <ol>
            <li>2-4 位玩家以卡牌建立生物，並賦予性狀。</li>
            <li>每回合依序經過演化、食物供給、進食與滅絕四個階段。</li>
            <li>讓生物取得足夠食物並存活，遊戲結束時結算分數。</li>
          </ol>
        ) : (
          <ol>
            <li>{MIN_PLAYERS}-{MAX_PLAYERS} 位玩家透過問牌，推理中央 {HIDDEN_CARDS_COUNT} 張蓋牌的顏色。</li>
            <li>輪到你時可問牌或猜牌；問牌後可預測或跳過，再結束回合。</li>
            <li>猜牌後依序決定是否跟猜，再一起查看結算結果。</li>
          </ol>
        )}
        <p>以上為入門摘要，詳細操作請依遊戲內當前階段提示。</p>
      </section>
      <section id="login-cards" tabIndex={-1} aria-labelledby="login-cards-title">
        <h2 id="login-cards-title">卡牌介紹</h2>
        {isEvolution ? (
          <p>演化論包含 84 張雙面卡。每張卡可用來建立生物或賦予性狀；能力與食物需求依卡面標示判斷。</p>
        ) : (
          <>
            <ul className="login-card-counts">
              {Object.entries(CARD_COUNTS).map(([color, count]) => (
                <li key={color}>{colorNames[color]}：{count} 張</li>
              ))}
            </ul>
            <p>你只能看到自己的手牌；其他玩家的手牌與中央蓋牌不會提前公開。</p>
          </>
        )}
      </section>
    </div>
  );
}
