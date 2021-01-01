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
import { NDArray } from 'vectorious';
test('sum', () =>
{
  expect(sum([0, 1, 2, 3])).toBe(6)
})

function testSolve(_a: number[][], _b: number[], _c: number[]): void
{
  const a = new NDArray(_a), b = new NDArray(_b.map((e) => [e])), c = new NDArray(_c.map((e) => [e]))
  expect(a.dot(b)).toEqual(c)
  expect(a.solve(c)).toEqual(b)
}

test('solve', () =>
{
  testSolve([[3, 8], [2, 5]], [2, 1], [14, 9])
  testSolve([[2, 5], [1, 3]], [2, 3], [19, 11])
  testSolve([[2, 3], [5, 7]], [-1, 1], [1, 2])
  testSolve([[1, 2], [2, 3]], [-1, 4], [7, 10])
})
