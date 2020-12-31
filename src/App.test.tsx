import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';
import { danEfficiency, displayDan, fromSimple, goal } from './tenhou'

test('goal (phoenix) = 11D', () =>
{
  expect(displayDan(goal)).toBe('11D')
})
test('average', () =>
{
  expect(displayDan(danEfficiency('般', fromSimple([1, 1, 1, 1])))).toEqual('1D')
  expect(displayDan(danEfficiency('上', fromSimple([1, 1, 1, 1])))).toEqual('3D')
  expect(displayDan(danEfficiency('特', fromSimple([1, 1, 1, 1])))).toEqual('5D')
  expect(displayDan(danEfficiency('鳳', fromSimple([1, 1, 1, 1])))).toEqual('7D')
})
import { sum } from './numeric'
test('sum', () =>
{
  expect(sum([0, 1, 2, 3])).toBe(6)
})