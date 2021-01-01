import Typography from '@material-ui/core/Typography'
import React from 'react'
import './App.css'
import { PlayerInput, InputType } from './components'
import { Player, defaultPlayer } from './player'
import { Field, GameType } from './tenhou'

type AppState =
{
    field: Field,
    inputType: InputType,
    player: Player,
    gameType: GameType,
}
const initialState: AppState =
{
    field: '鳳',
    inputType: 'slider',
    player: defaultPlayer,
    gameType: '南'
}

function App() {
    const [state, setState] = React.useState(initialState)
    return <><PlayerInput
            field={state.field}
            setField={(field: Field) => setState({...state, field})}
            inputType={state.inputType}
            setInputType={(inputType: InputType) => setState({...state, inputType})}
            player={state.player}
            setPlayer={(player: Player) => setState({...state, player})}
            gameType={state.gameType}
            setGameType={(gameType: GameType) => setState({...state, gameType})}
        />
        <Typography><ul>
            <li>卓の昇降なし: 常に同じ卓で (七段未満も鳳凰卓で, etc) 打ち続ける</li>
            <li>3級–1級の昇降あり: 初期0, 昇段100, 降段-100 を仮定</li>
        </ul></Typography>
        </>
}

export default App;
