import React from 'react'
import { Room } from './skyway_client'
import './App.css'
const App: React.FC = () => {
    return (
        <>
            <Room roomId='test' isHost={true} />
        </>
    )
}
export default App
