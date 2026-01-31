# 工作單 0268

## 編號
0268

## 日期
2026-01-31

## 工作單標題
前端組件單元測試

## 工單主旨
為演化論前端組件撰寫單元測試

## 內容

### 任務描述

為所有演化論前端組件撰寫單元測試，確保 UI 正確呈現和互動。

### 測試檔案結構

```
frontend/src/components/games/evolution/__tests__/
├── EvolutionRoom.test.js
├── GameBoard.test.js
├── CreatureCard.test.js
├── TraitCard.test.js
├── PlayerArea.test.js
├── HandCards.test.js
├── PhaseIndicator.test.js
├── AttackResolver.test.js
├── DiceRoller.test.js
└── ScoreBoard.test.js
```

### 測試項目

#### 1. CreatureCard.test.js

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import CreatureCard from '../CreatureCard';

describe('CreatureCard', () => {
  const mockCreature = {
    id: 'c1',
    traits: [{ id: 't1', type: 'carnivore', name: '肉食' }],
    food: { red: 1, blue: 1, yellow: 0 },
    foodNeeded: 3,
    isFed: false,
    hibernating: false
  };

  test('renders creature with traits', () => {
    render(<CreatureCard creature={mockCreature} />);
    expect(screen.getByText('肉食')).toBeInTheDocument();
  });

  test('shows food indicators', () => {
    render(<CreatureCard creature={mockCreature} />);
    // Check food display
  });

  test('shows fed status when fed', () => {
    const fedCreature = { ...mockCreature, isFed: true };
    render(<CreatureCard creature={fedCreature} />);
    expect(screen.getByText('飽')).toBeInTheDocument();
  });

  test('shows hibernate status', () => {
    const hibernatingCreature = { ...mockCreature, hibernating: true };
    render(<CreatureCard creature={hibernatingCreature} />);
    expect(screen.getByText('眠')).toBeInTheDocument();
  });

  test('calls onSelect when clicked and targetable', () => {
    const onSelect = jest.fn();
    render(<CreatureCard creature={mockCreature} isTargetable={true} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith('c1');
  });
});
```

#### 2. PhaseIndicator.test.js

```javascript
describe('PhaseIndicator', () => {
  test('highlights current phase', () => {
    render(<PhaseIndicator phase="evolution" round={1} />);
    expect(screen.getByText('演化階段')).toHaveClass('active');
  });

  test('shows last round warning', () => {
    render(<PhaseIndicator phase="feeding" round={5} isLastRound={true} />);
    expect(screen.getByText('最後一回合!')).toBeInTheDocument();
  });

  test('shows current player name', () => {
    render(<PhaseIndicator phase="evolution" round={1} currentPlayerName="玩家A" />);
    expect(screen.getByText(/玩家A/)).toBeInTheDocument();
  });
});
```

#### 3. AttackResolver.test.js

```javascript
describe('AttackResolver', () => {
  const mockAttack = {
    attackerId: 'a1',
    defenderId: 'd1',
    attackerName: '攻擊者',
    defenderName: '防守者',
    pendingResponse: 'tailLoss'
  };

  test('renders tail loss options', () => {
    const traits = [{ id: 't1', name: '肉食' }, { id: 't2', name: '斷尾' }];
    render(
      <AttackResolver
        attack={mockAttack}
        defenderTraits={traits}
        isDefender={true}
        onResolve={() => {}}
      />
    );
    expect(screen.getByText('斷尾防禦')).toBeInTheDocument();
    expect(screen.getByText('肉食')).toBeInTheDocument();
  });

  test('calls onResolve with selected trait', () => {
    const onResolve = jest.fn();
    const traits = [{ id: 't1', name: '肉食' }];
    render(
      <AttackResolver
        attack={mockAttack}
        defenderTraits={traits}
        isDefender={true}
        onResolve={onResolve}
      />
    );
    fireEvent.click(screen.getByText('肉食'));
    fireEvent.click(screen.getByText('確認斷尾'));
    expect(onResolve).toHaveBeenCalledWith({ useTailLoss: true, traitId: 't1' });
  });

  test('shows waiting message for non-defender', () => {
    render(
      <AttackResolver
        attack={mockAttack}
        isDefender={false}
        onResolve={() => {}}
      />
    );
    expect(screen.getByText(/等待.*選擇防禦方式/)).toBeInTheDocument();
  });
});
```

#### 4. DiceRoller.test.js

```javascript
describe('DiceRoller', () => {
  test('shows roll button when not auto roll', () => {
    render(<DiceRoller onResult={() => {}} autoRoll={false} />);
    expect(screen.getByText('擲骰')).toBeInTheDocument();
  });

  test('shows escape success for 4-6', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.8); // Results in 5
    render(<DiceRoller onResult={() => {}} autoRoll={true} />);
    await waitFor(() => {
      expect(screen.getByText('逃脫成功！')).toBeInTheDocument();
    });
    Math.random.mockRestore();
  });

  test('shows escape failure for 1-3', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.1); // Results in 1
    render(<DiceRoller onResult={() => {}} autoRoll={true} />);
    await waitFor(() => {
      expect(screen.getByText('逃脫失敗...')).toBeInTheDocument();
    });
    Math.random.mockRestore();
  });
});
```

### 測試覆蓋率目標

| 組件 | 目標覆蓋率 |
|------|-----------|
| EvolutionRoom | ≥ 70% |
| CreatureCard | ≥ 80% |
| TraitCard | ≥ 80% |
| PhaseIndicator | ≥ 90% |
| AttackResolver | ≥ 80% |
| DiceRoller | ≥ 90% |

### 前置條件
- 工單 0252-0259 已完成（前端組件實作）

### 驗收標準
- [ ] 所有測試案例通過
- [ ] 整體組件覆蓋率 ≥ 70%
- [ ] 互動行為有測試
- [ ] 條件渲染有測試

### 相關檔案
- `frontend/src/components/games/evolution/**/*.test.js` — 新建

### 參考計畫書
`docs/演化論/PLAN_EVOLUTION_DEVELOPMENT.md` 第七章
