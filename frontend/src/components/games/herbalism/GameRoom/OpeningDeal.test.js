import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import OpeningDeal from './OpeningDeal';

test('cards reach each actual seat center, including after responsive reflow, without revealing hands', () => {
  let mobile = false;
  const rect = jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
    if (this.classList.contains('opening-deal-stage')) return {left:100, top:80, width:800, height:600};
    if (this.classList.contains('tabletop3d-canvas')) return {left:100, top:180, width:600, height:400};
    if (this.dataset.playerId === 'left') return {left:mobile ? 120 : 200, top:100, width:160, height:50};
    if (this.dataset.playerId === 'right') return {left:mobile ? 300 : 600, top:100, width:160, height:50};
    return {left:0, top:0, width:0, height:0};
  });
  const players = [{id:'right', hand:[{color:'secret-blue'}]}, {id:'left', hand:[{}, {}]}];
  const {container} = render(<section className="tabletop3d">
    <div className="tabletop3d-canvas" />
    <div className="tabletop-seat" data-player-id="left" />
    <div className="tabletop-seat" data-player-id="right" />
    <OpeningDeal players={players} />
  </section>);
  const cards = [...container.querySelectorAll('.opening-deal-card')];
  expect(cards).toHaveLength(3);
  const right = cards.find(card => card.dataset.recipientId === 'right');
  const left = cards.find(card => card.dataset.recipientId === 'left');
  // Start = (400,500) viewport; landing = measured seat center, not scene coordinates.
  expect(right.style.getPropertyValue('--deal-dx')).toBe('280px');
  expect(left.style.getPropertyValue('--deal-dx')).toBe('-120px');
  expect(right.style.getPropertyValue('--deal-dy')).toBe('-375px');
  expect(container.innerHTML).not.toContain('secret-blue');
  mobile = true;
  fireEvent(window, new Event('resize'));
  expect(right.style.getPropertyValue('--deal-dx')).toBe('-20px');
  expect(left.style.getPropertyValue('--deal-dx')).toBe('-200px');
  fireEvent.animationEnd(right);
  expect(container.querySelectorAll('.opening-deal-card')).toHaveLength(2);
  rect.mockRestore();
});

test('exactly two anonymous backs enter the treasure box, then close only after the second arrival', () => {
  let shifted = false;
  const rect = jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
    if (this.classList.contains('opening-deal-stage')) return {left:100, top:80, width:800, height:600};
    if (this.classList.contains('tabletop3d-canvas')) return {left:100, top:180, width:600, height:400};
    if (this.classList.contains('tabletop3d-treasure-box')) return {left:shifted ? 140 : 80, top:160, width:100, height:100};
    return {left:0, top:0, width:0, height:0};
  });
  const sealed = jest.fn();
  const players = [];
  const { container } = render(<section className="tabletop3d">
    <div className="tabletop3d-canvas" /><button className="tabletop3d-treasure-box" />
    <OpeningDeal players={players} sealedCount={2} onSealed={sealed} />
  </section>);
  const cards = [...container.querySelectorAll('.opening-sealed-card')];
  expect(cards).toHaveLength(2);
  expect(cards[0].dataset.recipientId).toBe('treasure');
  expect(cards[0].style.getPropertyValue('--deal-dx')).toBe('-270px');
  expect(cards[0].style.getPropertyValue('--deal-dy')).toBe('-288px');
  expect(cards[1].style.animationDelay).toBe('950ms');
  shifted = true;
  fireEvent(window, new Event('resize'));
  expect(cards[0].style.getPropertyValue('--deal-dx')).toBe('-210px');
  fireEvent.animationEnd(cards[0]);
  expect(sealed).not.toHaveBeenCalled();
  fireEvent.animationEnd(cards[1]);
  expect(sealed).toHaveBeenCalledTimes(1);
  expect(container.querySelectorAll('.opening-sealed-card')).toHaveLength(0);
  rect.mockRestore();
});
