import { eye, matrix, NDArray, zeros } from 'vectorious'

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
export type Environment =
{
    field: Field,
    internalDan: number,
    gameType: GameType,
}
export type EnvResult = Environment & {result: IndividualResult}
export type EnvDist = Environment & {distribution: Distribution}
const normalizeDistribution = <R>(f: (ed: EnvDist) => R) =>
{
    return (ed: EnvDist) => f({...ed, distribution: normalize(ed.distribution)})
}

export function reward(er: EnvResult)
{
    return typeIndependentReward(er.field, er.result, er.internalDan) * gameTypeCoefficient[er.gameType]
}
export function typeIndependentReward(field: Field, result: IndividualResult, internalDan: number)
{
    if (result <= 2)
        return rewardOfField[field][result-1] * basePoint
    if (result === 4)
        return -internalDan * basePoint
    return 0
}
export function danEfficiency(field: Field, distribution: Distribution)
{
    if (distribution[4] === 0)
        return Infinity
    return (rewardOfField[field][0] * distribution[1] +
            rewardOfField[field][1] * distribution[2]) /
            distribution[4]
}
const _adv = (ed: EnvDist) => sum(individualResults.map((result: IndividualResult) =>
        reward({...ed, result}) * ed.distribution[result]))
export const adv = normalizeDistribution(_adv)
const _dif = (ed: EnvDist) => sum(individualResults.map((result: IndividualResult, i: number) =>
        reward({...ed, result}) ** 2 * ed.distribution[result]))
export const dif = normalizeDistribution(_dif)
export function peclet(ed: EnvDist): number
{
    return _adv(ed) / _dif(ed)
}
export type StructureElement =
{
    init: number,
    up: number,
    down: number,
}
export const danStructure: StructureElement[] = [
    {init:    0, up:  100, down: -100}, // 3K
    {init:    0, up:  100, down: -100},
    {init:    0, up:  100, down: -100},
    {init:  200, up:  400, down:    0}, // 1D
    {init:  400, up:  800, down:    0},
    {init:  600, up: 1200, down:    0},
    {init:  800, up: 1600, down:    0}, // 4D
    {init: 1000, up: 2000, down:    0},
    {init: 1200, up: 2400, down:    0},
    {init: 1400, up: 2800, down:    0}, // 7D
    {init: 1600, up: 3200, down:    0},
    {init: 1800, up: 3600, down:    0},
    {init: 2000, up: 4000, down:    0}, // 10D
]
export const dans = danStructure.map((_, i) => i)
function init(internalDan: number)
{
    const structure = danStructure[internalDan]
    return (structure.init - structure.down) / basePoint
}
export function promotionProb(ed: EnvDist): number
{
    return promotionProbs(ed)[init(ed.internalDan)]
}
const PromoteDemoteMatrix = normalizeDistribution((ed: EnvDist) =>
{
    const structure = danStructure[ed.internalDan]
    const n = (structure.up - structure.down) / basePoint

    let transition = eye(n)
    for (let i = 0; i < n; i++)
    {
        individualResults.forEach((result: IndividualResult) =>
        {
            const j = i + reward({...ed, result}) / basePoint
            if (0 <= j && j < n)
            {
                transition.set(i, j, transition.get(i, j) - ed.distribution[result])
            }
        })
    }
    return transition.transpose()
})
export const promotionProbs = normalizeDistribution((ed: EnvDist) =>
{
    const structure = danStructure[ed.internalDan]
    const n = (structure.up - structure.down) / basePoint
    let promotion1g = zeros(n, 1)
    for (let i = 0; i < n; i++)
    {
        individualResults.forEach((result: IndividualResult) =>
        {
            const j = i + reward({...ed, result}) / basePoint
            if ((j < 0 || n <= j) && (0 < reward({...ed, result})))
            {
                promotion1g.set(i, 0, promotion1g.get(i, 0) - ed.distribution[result])
            }
        })
    }
    return Array.from(PromoteDemoteMatrix(ed).solve(promotion1g).data.map((e: number) => -e))
})
export const promotionEGs = normalizeDistribution((ed: EnvDist) =>
{
    const pp = promotionProbs(ed)
    return Array.from(PromoteDemoteMatrix(ed).solve(new NDArray(pp.map((e) => [e]))).data.map((e: number, i: number) => e/pp[i]))
})
export function promotionEG(ed: EnvDist)
{
    return promotionEGs(ed)[init(ed.internalDan)]
}
export const demotionEGs = normalizeDistribution((ed: EnvDist) =>
{
    const dp = promotionProbs(ed).map((e) => 1-e)
    return Array.from(PromoteDemoteMatrix(ed).solve(new NDArray(dp.map((e) => [e]))).data.map((e: number, i: number) => e/dp[i]))
})
export function demotionEG(ed: EnvDist)
{
    return demotionEGs(ed)[init(ed.internalDan)]
}
export function normalize(distribution: Distribution): Distribution
{
    const denom = sum(toSimple(distribution))
    return {
        1: distribution[1] / denom,
        2: distribution[2] / denom,
        3: distribution[3] / denom,
        4: distribution[4] / denom,
    }
}
