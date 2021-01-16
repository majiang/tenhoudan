import React, { Suspense, useEffect, useState } from 'react'
import { wrap } from 'comlink'

import CircularProgress from '@material-ui/core/CircularProgress'
import FormControl from '@material-ui/core/FormControl'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import FormLabel from '@material-ui/core/FormLabel'
import Grid from '@material-ui/core/Grid'
import Radio from '@material-ui/core/Radio'
import RadioGroup from '@material-ui/core/RadioGroup'
import Slider from '@material-ui/core/Slider'
import TextField from '@material-ui/core/TextField'
import Typography from '@material-ui/core/Typography'
import Table from '@material-ui/core/Table'
import TableHead from '@material-ui/core/TableHead'
import TableBody from '@material-ui/core/TableBody'
import TableRow from '@material-ui/core/TableRow'
import TableCell from '@material-ui/core/TableCell'

import { DanIndependentPlayer, defaultPlayerOf, Player, PlayerType, playerTypes } from '../player'
import {
    Field, fields,
    dans,
    EnvDist,
    danEfficiency,
    displayDan,
    Distribution,
    adv, dif, peclet,
    fromSimple, toSimple,
    GameType, gameTypes,
} from '../tenhou'
import { cumsum, decumsum, sum } from '../numeric'

import tenhouWorker from '../tenhou/tenhou.worker'
const _tenhou = new tenhouWorker()
const tenhou: any = wrap(_tenhou)

export const inputTypes = ['slider', 'text'] as const
export type InputType = typeof inputTypes[number]


export function RadioSelector<LT extends string>(choices: readonly LT[], label: string = '')
{
    return (props: {
        value: LT,
        setValue: (value: LT) => void,
    }) => <FormControl>
        <FormLabel>{label}</FormLabel>
        <RadioGroup onChange={(event: React.ChangeEvent<HTMLInputElement>) => props.setValue(event.target.value as LT)}>
            {choices.map((v: LT) =>
                <FormControlLabel control={<Radio />} value={v} label={v} checked={v === props.value} />
            )}
        </RadioGroup>
    </FormControl>
}

const FieldSelector = RadioSelector<Field>(fields, 'Field')
const InputTypeSelector = RadioSelector<InputType>(inputTypes, 'Input Type')
const PlayerTypeSelector = RadioSelector<PlayerType>(playerTypes, 'Player Type')
const GameTypeSelector = RadioSelector<GameType>(gameTypes, 'Game Type')

export function PlayerInput(props:
    {
        player: Player, setPlayer: (player: Player) => void,
        inputType: InputType, setInputType: (inputType: InputType) => void,
        field: Field, setField: (field: Field) => void,
        gameType: GameType, setGameType: (gameType: GameType) => void,
    })
{
    const player = props.player
    return <>
        <PlayerTypeSelector value={props.player.kind} setValue={
            (playerType: PlayerType) => props.setPlayer(defaultPlayerOf(playerType))
        } />
        <InputTypeSelector value={props.inputType} setValue={props.setInputType} />
        <FieldSelector value={props.field} setValue={props.setField} />
        <GameTypeSelector value={props.gameType} setValue={props.setGameType} />
        {(() => {
            if (player.kind === 'independent')
            {
                const distribution = player.distribution()
                const setDistribution = (_distribution: Distribution) => props.setPlayer(player.setDistribution(_distribution))
                return <>
                    <DanIndependentPlayerInput
                        inputType={props.inputType}
                        values={toSimple(distribution)}
                        setValues={(values: number[]) => setDistribution(fromSimple(values))}
                        field={props.field}
                        gameType={props.gameType}
                    /></>
            }
            else return <Typography>Not Supported Yet</Typography>
        })()}
    </>
}

export function DanIndependentPlayerInput(props: {
    inputType: InputType,
    gameType: GameType,
    values: number[],
    setValues: (values: number[]) => void,
    field: Field,
})
{
    return <><DistributionInput
        inputType={props.inputType}
        values={props.values}
        setValues={props.setValues}
    /><Grid container>
        <Grid item xs={6}><Typography>DE={danEfficiency(props.field, fromSimple(props.values))-2}</Typography></Grid>
        <Grid></Grid>
    </Grid>
    <Table size="small"><TableHead><TableRow>
        <TableCell>@</TableCell>
        <TableCell>adv</TableCell>
        <TableCell>dif</TableCell>
        <TableCell><a href="https://note.com/chanpukin/n/ne668771fe917#nhceu">Pe</a></TableCell>
        <TableCell>P↑</TableCell>
        <TableCell>E↑</TableCell>
        <TableCell>E↓</TableCell>
        </TableRow></TableHead>
        <TableBody>{dans.slice().reverse().map((v: number, i: number) => <DanInformationRow
            key={i}
            field={props.field}
            distribution={fromSimple(props.values)}
            internalDan={v}
            gameType={props.gameType}
        />)}</TableBody>
    </Table>
    </>
}
function DanInformationRow(props: EnvDist)
{
    return <TableRow>
    <TableCell>{displayDan(props.internalDan)}</TableCell>
    <TableCell>{adv(props)}</TableCell>
    <TableCell>{dif(props)}</TableCell>
    <TableCell>{peclet(props)}</TableCell>
    <TableCell><LazyCalculation args={props} f={tenhou.promotionProb} /></TableCell>
    <TableCell><LazyCalculation args={props} f={tenhou.promotionEG} /></TableCell>
    <TableCell><LazyCalculation args={props} f={tenhou.demotionEG} /></TableCell>
    </TableRow>
}

function LazyCalculation<P, S>(props: {f: (props: P) => Promise<S>, args: P})
{
    const [state, setState] = useState(<CircularProgress />)
    useEffect(() =>
    {
        const calculate = async() =>
        {
            const result = await props.f(props.args)
            setState(<>{result}</>)
        }
        calculate()
    })
    return <>{state}</>
}

export function DistributionInput(props: {values: number[], setValues: (values: number[]) => void, inputType: InputType})
{
    if (props.inputType === 'slider')
        return <Grid container>
            <Grid item xs={8}><SliderDistribution values={props.values} setValues={props.setValues} /></Grid>
            <Grid item xs={4}><FloatingPointDistributionDisplay values={props.values} /></Grid>
        </Grid>
    else
        return <Grid container>
            <Grid item xs={6}><TextDistribution values={props.values} setValues={props.setValues} /></Grid>
            <Grid item xs={6}><FloatingPointDistributionDisplay values={props.values} /></Grid>
        </Grid>
}

export function TextDistribution(props: {values: number[], setValues: (values: number[]) => void})
{
    return <Grid container>
        {props.values.map((v, i) => <Grid item xs={3} key={i}><TextField value={v} onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            {
                let values = [...props.values]
                values[i] = parseFloat(event.target.value)
                props.setValues(values)
            }}/></Grid>)}
    </Grid>
}

export function SliderDistribution(props: {values: number[], setValues: (values: number[]) => void})
{
    const a = cumsum(props.values)
    return <Slider onChange={(e, values: number[] | number) =>
        {
            if (typeof values === 'number')
                console.warn('single slider.value')
            else
                props.setValues(decumsum(values, a[1]))
        }}
        value={a[0]}
        min={0}
        max={a[1]}
        />
}

export function FloatingPointDistributionDisplay(props: {values: number[]})
{;
    const a = sum(props.values)
    return <Grid container>
        {props.values.map((v, i) => <Grid item xs={3} key={i}><Typography>
            {v/a}
        </Typography></Grid>)}
    </Grid>
}
