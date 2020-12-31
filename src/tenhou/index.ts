import { sum } from '../numeric'

export const fields = ['鳳', '特', '上', '般'] as const
export const gameTypes = ['東', '南'] as const
export const individualResults = [1, 2, 3, 4] as const

export type Field = typeof fields[number]
export type GameType = typeof gameTypes[number]
export type IndividualResult = typeof individualResults[number]
export type Distribution = {
    1: number,
    2: number,
    3: number,
    4: number,
}
export type SimpleDistribution = number[]
export function fromSimple(simpleDistribution: SimpleDistribution): Distribution
{
    if (simpleDistribution.length !== 4)
        throw new Error('simpleDistribution must be of length 4')
    return {
        1: simpleDistribution[0],
        2: simpleDistribution[1],
        3: simpleDistribution[2],
        4: simpleDistribution[3],
    }
}
export function toSimple(distribution: Distribution): SimpleDistribution
{
    return [
        distribution[1],
        distribution[2],
        distribution[3],
        distribution[4],
    ]
}
export const rewardOfField = {
    '般': [2, 1],
    '上': [4, 1],
    '特': [5, 2],
    '鳳': [6, 3],
}
export const gameTypeCoefficient = {
    '東': 2,
    '南': 3,
}
export const basePoint = 5
export function displayDan(internalDan: number)
{
    if (internalDan < 3)
        return `${3-internalDan}K`
    return `${internalDan-2}D`
}
export const goal = 13;
export function reward(field: Field, individualResult: IndividualResult, internalDan: number, gameType: GameType)
{
    return typeIndependentReward(field, individualResult, internalDan) * gameTypeCoefficient[gameType]
}
export function typeIndependentReward(field: Field, individualResult: IndividualResult, internalDan: number)
{
    if (individualResult <= 2)
        return rewardOfField[field][individualResult-1] * basePoint
    if (individualResult === 4)
        return -internalDan * basePoint
    return 0
}
export function danEfficiency(field: Field, distribution: Distribution)
{
    if (distribution[4] === 0)
        return Infinity
    return (rewardOfField[field][0] * distribution[1] +
            rewardOfField[field][1] * distribution[2]) /
            distribution[4] - 2
}
function _adv(field: Field, distribution: Distribution, internalDan: number, gameType: GameType): number
{
    return sum(individualResults.map((result: IndividualResult, i: number) =>
            reward(field, result, internalDan, gameType) * distribution[result]
))
}
export function adv(field: Field, distribution: Distribution, internalDan: number, gameType: GameType): number
{
    return _adv(field, distribution, internalDan, gameType) / sum(toSimple(distribution))
}
function _dif(field: Field, distribution: Distribution, internalDan: number, gameType: GameType): number
{
    return sum(individualResults.map((result: IndividualResult, i: number) =>
        reward(field, result, internalDan, gameType) ** 2 * distribution[result]
))
}
export function dif(field: Field, distribution: Distribution, internalDan: number, gameType: GameType): number
{
    return _dif(field, distribution, internalDan, gameType) / sum(toSimple(distribution))
}
export function peclet(field: Field, distribution: Distribution, internalDan: number, gameType: GameType): number
{
    return _adv(field, distribution, internalDan, gameType) / _dif(field, distribution, internalDan, gameType)
}
export const iota = (length: number) => Array.from({length: length}, (v, k) => k);
export const dans = iota(goal)
export const DanStructure = [
    {init: 0, up: 100, down: -100}, // 3K
    {init: 0, up: 100, down: -100},
    {init: 0, up: 100, down: -100},
    {init: 200, up: 400, down: 0}, // 1D
    {init: 400, up: 800, down: 0},
    {init: 600, up: 1200, down: 0},
    {init: 800, up: 1600, down: 0}, // 4D
    {init: 1000, up: 2000, down: 0},
    {init: 1200, up: 2400, down: 0},
    {init: 1400, up: 2800, down: 0}, // 7D
    {init: 1600, up: 3200, down: 0},
    {init: 1800, up: 3600, down: 0},
    {init: 2000, up: 4000, down: 0}, // 10D
]
