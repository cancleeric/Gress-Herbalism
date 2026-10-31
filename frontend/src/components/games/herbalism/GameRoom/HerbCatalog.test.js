import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import HerbCatalog from './HerbCatalog';
import { HERB_CATALOG } from './herbSpecies';

const hand = HERB_CATALOG.slice(0,12).map(h=>({id:h.cardId,color:h.color}));
test('12-card hand inspection shows owned cards only; never the two hidden plants or collection previews',()=>{
 render(<HerbCatalog handCards={hand} initialGroup="blue" onClose={()=>{}}/>);
 expect(screen.getAllByRole('button',{name:/放大/})).toHaveLength(3);
 expect(screen.queryByRole('button',{name:/放大滄扇蘚/})).not.toBeInTheDocument();
 expect(screen.queryByRole('button',{name:/放大月瓷蓮/})).not.toBeInTheDocument();
 expect(screen.queryByRole('button',{name:/雙株插畫/})).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'全部 12'}));
 expect(screen.getAllByRole('button',{name:/放大/})).toHaveLength(12);
 expect(screen.getByText('只顯示你持有的 12 張手牌')).toBeInTheDocument();
});
test('14-card over-capacity layout inspection still exposes all 14 distinct cards',()=>{
 render(<HerbCatalog handCards={HERB_CATALOG.map(h=>({id:h.cardId,color:h.color}))} onClose={()=>{}}/>);
 expect(screen.getAllByRole('button',{name:/放大/})).toHaveLength(14);
 fireEvent.click(screen.getByRole('button',{name:'✦ 藍組'}));
 expect(screen.getAllByRole('button',{name:/放大/})).toHaveLength(5);
});
