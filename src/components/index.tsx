import React, { useEffect, useState } from 'react'
import { wrap } from 'comlink'

import CircularProgress from '@material-ui/core/CircularProgress'
import Button from '@material-ui/core/Button'
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

import { ArrayPlayer, DanIndependentPlayer, defaultPlayerOf, FunctionPlayer, Player, PlayerType, playerTypes } from '../player'
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

export function Conditions(props:
{
    playerType: PlayerType, setPlayerType: (playreType: PlayerType) => void,
    inputType: InputType, setInputType: (inputType: InputType) => void,
    field: Field, setField: (field: Field) => void,
    gameType: GameType, setGameType: (gameType: GameType) => void,
})
{
    return <Grid container>
        <Grid item><PlayerTypeSelector
            value={props.playerType}
            setValue={props.setPlayerType} /></Grid>
        <Grid item><InputTypeSelector
            value={props.inputType}
            setValue={props.setInputType} /></Grid>
        <Grid item><FieldSelector
            value={props.field}
            setValue={props.setField} /></Grid>
        <Grid item><GameTypeSelector
            value={props.gameType}
            setValue={props.setGameType} /></Grid>
    </Grid>
}

export function PlayerInput(props:
{
    player: Player, setPlayer: (player: Player) => void,
    inputType: InputType, setInputType: (inputType: InputType) => void,
    field: Field, setField: (field: Field) => void,
    gameType: GameType, setGameType: (gameType: GameType) => void,
})
{
    return <>
        <Conditions
            playerType={props.player.kind}
            setPlayerType={(playerType: PlayerType) => props.setPlayer(defaultPlayerOf(playerType))}
            {...props}
        />
        <PlayerDistributionInput {...props} />
        <PlayerDistributionInfo {...props} />
    </>
}
function PlayerDistributionInput(props:
{
    player: Player, setPlayer: (player: Player) => void,
    inputType: InputType,
    field: Field,
    gameType: GameType,
})
{
    if (props.player.kind === 'independent')
    {
        return <DanIndependentPlayerInput
            values={toSimple(props.player.distribution())}
            setValues={(values: number[]) =>
                props.setPlayer((props.player as DanIndependentPlayer).setDistribution(fromSimple(values)))}
            {...props} />
    }
    else if (props.player.kind === 'array')
    {
        return <ArrayPlayerInput
            values={props.player.distributions.map(toSimple)}
            setValues={(values: number[], i: number) =>
                props.setPlayer((props.player as ArrayPlayer).setDistribution(fromSimple(values), i))}
            {...props} />
    }
    else
    {
        return <FunctionPlayerInput
            maxInternalDan={props.player.maxInternalDan}
            setMaxInternalDan={(maxInternalDan: number) => props.setPlayer((props.player as FunctionPlayer).setMaxInternalDan(maxInternalDan))}
            value={props.player.distributionFunction.distributionFunctionString}
            setValue={(value: string) => props.setPlayer((props.player as FunctionPlayer).setDistributionFunction(value))}
            isError={(props.player as FunctionPlayer).distributionFunction.distributionFunction === undefined}
            {...props} />
    }
}

function FunctionPlayerInput(props:
{
    field: Field, gameType: GameType,
    maxInternalDan: number,
    setMaxInternalDan: (maxInternalDan: number) => void,
    value: string,
    setValue: (value: string) => void,
    isError: boolean,
})
{
    return <>
    <Grid container>
        <Grid item xs={4}>
            <Typography>段位上限 (exclusive): {props.maxInternalDan} ({displayDan(props.maxInternalDan)})</Typography>
        </Grid>
        <Grid item xs><Slider min={1} max={23}
            value={props.maxInternalDan} onChange={(e, v) =>
            {
                if (typeof v === 'number')
                    props.setMaxInternalDan(v)
                else
                    console.error('multiple maxInternalDan values')
            }} /></Grid>
    </Grid>
    <div style={props.isError ? {backgroundColor: '#ffeeee'} : {}}>
    <Typography>// dan: 現在段位 (k級: 3-k; d段: d+2)</Typography>
    <Typography>function distribution(dan: number)</Typography>
    <Typography>{'{'}</Typography>
    <Grid container>
    <Grid item xs={1}></Grid>
    <Grid item xs><TextField fullWidth multiline margin='dense' rows={10} rowsMax={20} variant='filled'
        value={props.value} onChange={(e) => props.setValue(e.target.value)} />
    </Grid>
    </Grid>
    <Typography>{'}'}</Typography>
    <Typography>// 返却値: [1位, 2位, 3位, 4位] 比率 (合計は非0であればよい: 正規化は自動)</Typography>
    </div>
    </>
}

function PlayerDistributionInfo(props:
{
    player: Player,
    field: Field,
    gameType: GameType,
})
{
    // TODO: appropriate polymorphism
    const distribution =
        props.player.kind === 'independent'
        ? (internalDan: number) => (props.player as DanIndependentPlayer).distribution()
        : props.player.kind === 'array'
        ? (internalDan: number) => (props.player as ArrayPlayer).distributions[internalDan]
        : (internalDan: number) => (props.player as FunctionPlayer).distributionFunction.distributionFunction!(internalDan)
    const _dans =
        props.player.kind === 'array'
        ? props.player.distributions.map((_, i) => i)
        : dans
    const danEfficiency =
        props.player.kind !== 'independent'
    if (props.player.kind === 'function' && props.player.distributionFunction.distributionFunction === undefined)
        return <Typography>Error in distribution(dan) function definition</Typography>
    return <DanInformationTable
        distribution={distribution}
        dans={_dans}
        danEfficiency={danEfficiency}
        {...props} />
}
export function ArrayPlayerInput(props:
{
    field: Field,
    gameType: GameType,
    inputType: InputType,
    values: number[][],
    setValues: (values: number[], at: number) => void,
})
{
    return <div>
        <Button variant="outlined">+</Button>
        {props.values.map((values, i) =>
        <DistributionInput
            inputType={props.inputType}
            internalDan={i}
            values={values}
            setValues={(values: number[]) => props.setValues(values, i)}
            key={i}
        />).reverse()}
    </div>
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
    </>
}
function DanInformationTable(props:
{
    distribution: (internalDan: number) => Distribution,
    danEfficiency: boolean,
    dans: number[],
    field: Field,
    gameType: GameType,
})
{
    return <Table size="small">
        <DanInformationHeader danEfficiency={props.danEfficiency}/>
        <TableBody>{props.dans.map((v: number, i: number) => <DanInformationRow
            key={i}
            danEfficiency={props.danEfficiency}
            field={props.field}
            distribution={props.distribution(v)}
            internalDan={v}
            gameType={props.gameType}
        />).reverse()}</TableBody>
    </Table>
}
function DanInformationHeader(props: {danEfficiency: boolean})
{
    return <TableHead><TableRow>
    <TableCell>@</TableCell>
    {props.danEfficiency ? <TableCell>DE</TableCell> : <></>}
    <TableCell>adv</TableCell>
    <TableCell>dif</TableCell>
    <TableCell><a href="https://note.com/chanpukin/n/ne668771fe917#nhceu">Pe</a></TableCell>
    <TableCell>P↑</TableCell>
    <TableCell>E↑</TableCell>
    <TableCell>E↓</TableCell>
    </TableRow></TableHead>
}
function DanInformationRow(props: EnvDist & {danEfficiency: boolean})
{
    return <TableRow>
    <TableCell>{displayDan(props.internalDan)}</TableCell>
    {props.danEfficiency ? <TableCell>{danEfficiency(props.field, props.distribution)}</TableCell> : <></>}
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
        return () => setState(<CircularProgress />)
    }, [props.args])
    return <>{state}</>
}

export function DistributionInput(props: {values: number[], setValues: (values: number[]) => void, inputType: InputType, internalDan?: number})
{
    const Distribution = (props.inputType === 'slider' ? SliderDistribution : TextDistribution)
    let widths: [3|4|5|6|7|8, 3|4|5|6|7|8] = props.inputType === 'slider' ? [8, 4] : [6, 6]
    if (props.internalDan !== undefined)
    {
        widths[1] -= 1
    }
    return <Grid container justify="space-around" spacing={1}>
            {props.internalDan !== undefined ? <Grid item xs={1}><Typography>{displayDan(props.internalDan)}</Typography></Grid> : <></> }
            <Grid item xs={widths[0]}><Distribution values={props.values} setValues={props.setValues} /></Grid>
            <Grid item xs={widths[1]}><FloatingPointDistributionDisplay values={props.values} /></Grid>
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
{
    const a = sum(props.values)
    return <Grid container>
        {props.values.map((v, i) => <Grid item xs={3} key={i}><Typography>
            {v/a}
        </Typography></Grid>)}
    </Grid>
}
