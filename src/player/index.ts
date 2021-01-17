import { Distribution, fromSimple } from "../tenhou";

export const playerTypes = ['independent', 'array', 'function'] as const
export type PlayerType = typeof playerTypes[number]

export class DanIndependentPlayer
{
    kind: 'independent' = 'independent'
    private _distribution: Distribution
    constructor (distribution: Distribution)
    {
        this._distribution = distribution
    }
    distribution(): Distribution
    {
        return this._distribution
    }
    setDistribution(distribution: Distribution)
    {
        this._distribution = distribution
        return this
    }
}

export const defaultPlayer = new DanIndependentPlayer(fromSimple([2500, 2500, 2500, 2500]))

export class ArrayPlayer
{
    kind: 'array' = 'array'
    distributions: Distribution[]
    constructor (distributions: Distribution[])
    {
        this.distributions = distributions
    }
    distribution(currentDan: number): Distribution
    {
        return this.distributions[currentDan]
    }
    setDistribution(distribution: Distribution, currentDan: number)
    {
        this.distributions[currentDan] = distribution
        return this
    }
    distributionLength()
    {
        return this.distributions.length
    }
}

export class FunctionPlayer
{
    kind: 'function' = 'function'
    distribution: (currentDan: number) => Distribution
    constructor (distribution: (currentDan: number) => Distribution)
    {
        this.distribution = distribution
    }
    setDistribution(distribution: (currentDan: number) => Distribution)
    {
        this.distribution = distribution
        return this
    }
}

export type Player = DanIndependentPlayer | ArrayPlayer | FunctionPlayer
export function defaultPlayerOf(playerType: PlayerType): Player
{
    switch (playerType)
    {
        case "independent": return new DanIndependentPlayer(fromSimple([2500, 2500, 2500, 2500]))
        case 'array': return new ArrayPlayer([
            fromSimple([250, 250, 250, 250]), // 3K
            fromSimple([250, 250, 250, 250]),
            fromSimple([250, 250, 250, 250]),
            fromSimple([250, 250, 250, 250]), // 1D
            fromSimple([250, 250, 250, 250]),
            fromSimple([250, 250, 250, 250]),
            fromSimple([250, 250, 250, 250]), // 4D
            fromSimple([250, 250, 250, 250]),
            fromSimple([250, 250, 250, 250]),
            fromSimple([250, 250, 250, 250]), // 7D
            fromSimple([250, 250, 250, 250]),
            fromSimple([250, 250, 250, 250]),
            fromSimple([250, 250, 250, 250]), // 10D
        ])
        case 'function': return new FunctionPlayer((currentDan: number) => fromSimple([2500, 2500, 2500, 2500]))
    }
}