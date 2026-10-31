/**
 * 遊戲選擇頁面
 *
 * @module GameSelection
 * @description 登入後的遊戲選擇頁面
 * 工單 0276
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../firebase/AuthContext";
import "./GameSelection.css";
import BotanicalFan from "../BotanicalFan/BotanicalFan";

/**
 * 遊戲選擇頁面組件
 */
function GameSelection() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const displayName = user?.isAnonymous
    ? "訪客"
    : user?.displayName || user?.email?.split("@")[0] || "訪客";

  /**
   * 處理遊戲選擇
   */
  const handleSelectGame = (gameType) => {
    if (gameType === "herbalism") {
      navigate("/lobby/herbalism");
    } else if (gameType === "evolution") {
      navigate("/lobby/evolution");
    }
  };

  /**
   * 處理登出
   */
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("登出失敗:", error);
    }
  };

  return (
    <div className="game-selection">
      <header className="gs-header">
        <a className="gs-brand" href="/herbalism">
          ✳{" "}
          <span>
            本草<small>主選單</small>
          </span>
        </a>
        <div className="gs-user-info">
          <span className="gs-avatar-placeholder" aria-hidden="true">
            {displayName.charAt(0).toUpperCase()}
          </span>
          <span className="gs-username">{displayName}</span>
          <button className="gs-logout-btn" onClick={handleLogout}>
            登出
          </button>
        </div>
      </header>
      <main className="gs-main">
        <div className="gs-screen-heading">
          <h1 className="gs-title">選擇遊戲</h1>
          <span>選一桌，開始玩。</span>
        </div>
        <div className="gs-games">
          <button
            className="gs-game-card herbalism"
            onClick={() => handleSelectGame("herbalism")}
          >
            <span className="gs-game-number">01 · 推理桌遊</span>
            <span className="gs-game-art" aria-hidden="true">
              <BotanicalFan />
            </span>
            <span className="gs-game-title" role="heading" aria-level="2">
              本草<span>Herbalism</span>
            </span>
            <span className="gs-game-info">
              <span>3–4 人 · 可與 AI 練習</span>
              <span>15–30 分鐘</span>
            </span>
            <span className="gs-game-cta">
              進入本草大廳 <span aria-hidden="true">↗</span>
            </span>
          </button>
          <button
            className="gs-game-card evolution"
            onClick={() => handleSelectGame("evolution")}
          >
            <span className="gs-game-number">02 · 策略卡牌</span>
            <span className="gs-game-art" aria-hidden="true">
              ❋
            </span>
            <span className="gs-game-title" role="heading" aria-level="2">
              演化論<span>Evolution</span>
            </span>
            <span className="gs-game-info">
              <span>2–4 人</span>
              <span>30–60 分鐘</span>
            </span>
            <span className="gs-game-cta">
              進入演化論大廳 <span aria-hidden="true">↗</span>
            </span>
          </button>
        </div>
        <nav className="gs-nav" aria-label="玩家功能">
          <button className="gs-nav-btn" onClick={() => navigate("/profile")}>
            個人資料
          </button>
          <button className="gs-nav-btn" onClick={() => navigate("/friends")}>
            好友
          </button>
          <button
            className="gs-nav-btn"
            onClick={() => navigate("/leaderboard")}
          >
            排行榜
          </button>
        </nav>
        <p className="gs-footer">選擇卡片進入大廳 · Tab 切換，Enter 確認</p>
      </main>
    </div>
  );
}
export default GameSelection;
