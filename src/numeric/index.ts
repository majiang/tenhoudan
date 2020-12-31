export function cumsum(values: number[]): [number[], number]
{
    let ret = values.slice(0, -1)
    ret.forEach((v, i) =>
    {
        if (i) ret[i] += ret[i-1]
    })
    return [ret, ret.slice(-1)[0] + values.slice(-1)[0]]
}

export function decumsum(partialSums: number[], totalSum: number)
{
    const lhs = [...partialSums, totalSum]
    const rhs = [0, ...partialSums]
    return lhs.map((v, i) => v-rhs[i])
}

export const sum = (values: number[]) => values.reduce((partial: number, current: number) => partial + current, 0)
