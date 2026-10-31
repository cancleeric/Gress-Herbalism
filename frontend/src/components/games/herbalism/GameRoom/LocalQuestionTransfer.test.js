import React from 'react';
import {render,screen,fireEvent} from '@testing-library/react';
import LocalQuestionTransfer from './LocalQuestionTransfer';

const request = {playerId:'ai', fromPlayer:'阿哲', questionType:2, colors:['red','yellow'],
  hand:[{id:1,color:'red'},{id:2,color:'yellow'},{id:3,color:'yellow'}]};
test('先選擇給色、確認，再等最後一張交牌動畫完成才提交一次',()=>{
  const complete=jest.fn();
  const {container}=render(<LocalQuestionTransfer request={request} onComplete={complete}/>);
  expect(screen.getByRole('button',{name:'確認交牌'})).toBeDisabled();
  fireEvent.click(screen.getByRole('button',{name:/交出黃色全部/}));
  expect(screen.getByRole('status')).toHaveTextContent('你將交出 2 張黃牌');
  expect(complete).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{name:'確認交牌'}));
  expect(complete).not.toHaveBeenCalled();
  const flights=container.querySelectorAll('.local-transfer-flying-card');
  expect(flights).toHaveLength(2);
  fireEvent.animationEnd(flights[0]);
  expect(complete).not.toHaveBeenCalled();
  fireEvent.animationEnd(flights[1]);
  fireEvent.animationEnd(flights[1]);
  expect(complete).toHaveBeenCalledTimes(1);
  expect(complete).toHaveBeenCalledWith('yellow');
});
test('無牌可給也須確認，不自動掠過',()=>{
  const complete=jest.fn();
  render(<LocalQuestionTransfer request={{...request,hand:[]}} onComplete={complete}/>);
  expect(screen.getByText('沒有符合的牌可交出')).toBeInTheDocument();
  expect(complete).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{name:'確認交牌'}));
  expect(complete).toHaveBeenCalledTimes(1);
});

test('置中桌面動畫使用視窗座標',()=>{
  const table=document.createElement('div');table.className='app--console';
  table.getBoundingClientRect=()=>({left:200,top:30,width:400,height:700});
  document.body.append(table);
  const {container}=render(<LocalQuestionTransfer request={{...request,hand:[{id:2,color:'yellow'}]}} onComplete={()=>{}}/>);
  fireEvent.click(screen.getByRole('button',{name:'確認交牌'}));
  const card=container.querySelector('.local-transfer-flying-card');
  expect(card.style.getPropertyValue('--flight-x')).toBe('400px');
  expect(card.style.getPropertyValue('--flight-y')).toBe('625px');
  table.remove();
});
