// @vitest-environment jsdom
import React from 'react';
import {it,expect,afterEach} from 'vitest';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {ChronicleExhibition} from '../components/chronicle/ChronicleExhibition';
import {assetForExhibit,assetIdFor,getAsset} from '../lib/chronicle/assets';
import {researchRoutes} from '../lib/chronicle/researchRoutes';
afterEach(cleanup);
it('history exact event media wins and other years retain their own route background',()=>{const r=researchRoutes['超级电容'];expect(assetForExhibit(r.historySubject,'history',r.timeline.find(n=>n.yearNumber===2021)!)?.id).toBe('supercapacitor-inl-ultracap-test');expect(assetForExhibit(r.historySubject,'history',r.timeline[0])?.id).toBe('supercapacitor-skeleton-d60-cells');});
it('electromagnetic equipment, paper and storage use independent relevant images',()=>{for(const name of ['超级电容','超导磁储能']){const r=researchRoutes[name];const ids=[assetForExhibit(r.historySubject,'history',r.timeline[0])?.id,assetForExhibit(r.historySubject,'papers',r.papers!)?.id,assetForExhibit(r.historySubject,'storage',r.storage!)?.id];expect(new Set(ids).size).toBe(3);expect(ids.every(Boolean)).toBe(true);}expect(getAsset(assetIdFor('company:smes-kyuden'))?.kind).toBe('real-photo');expect(getAsset(assetIdFor('company:hydrogen-gas-nrel-hitrf'))?.id).toBe('hydrogen-hitrf-official');});
it('year and section switching update actual stage photo without changing navigation',()=>{render(<ChronicleExhibition/>);fireEvent.change(screen.getByRole('combobox',{name:'家族'}),{target:{value:'电磁储能'}});const photo=()=>screen.getByRole('region',{name:'技术展厅'}).querySelector('img')?.getAttribute('src');fireEvent.click(screen.getByRole('button',{name:/2021，小水电/}));expect(photo()).toContain('inl');fireEvent.click(screen.getByRole('button',{name:'储能适配'}));expect(photo()).toContain('skelmod-162v');fireEvent.click(screen.getByRole('button',{name:'进入详解'}));expect(screen.getByRole('region',{name:'研究详解'}).getAttribute('style')).toContain('skelmod-162v');});
