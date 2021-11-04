import Peer, { SfuRoom } from 'skyway-js'
import React from 'react'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'

type AudioStream = {
    stream: MediaStream;
    peerId: string;
};

/* eslint react/prop-types: 0 */
export const Room: React.FC<{ roomId: string }> = ({ roomId}) => {
    const peer = React.useRef(new Peer({ key: process.env.REACT_APP_SKYWAYAPI as string ,debug: 3}))
    const [remoteAudio, setRemoteAudio] = React.useState<AudioStream[]>([])
    const [localStream, setLocalStream] = React.useState<MediaStream>()
    const [room, setRoom] = React.useState<SfuRoom>()
    const localVideoRef = React.useRef<HTMLVideoElement>(null)
    const [isStarted, setIsStarted] = React.useState(false)
    React.useEffect(() => {
        navigator.mediaDevices
            .getUserMedia({audio: true })
            .then((stream) => {
                setLocalStream(stream)
            })
            .catch((e) => {
                console.log(e)
            })
    }, [])
    const onStart = () => {
        if (peer.current) {
            if (!peer.current.open) {
                return
            }
            const tmpRoom = peer.current.joinRoom<SfuRoom>(roomId, {
                mode: 'sfu',
                stream: localStream,
            })
            tmpRoom.once('open', () => {
                console.log('=== You joined ===\n')
            })
            tmpRoom.on('peerJoin', (peerId) => {
                console.log(`=== ${peerId} joined ===\n`)
            })
            tmpRoom.on('stream', async (stream) => {
                setRemoteAudio((prev) => [
                    ...prev,
                    { stream: stream, peerId: stream.peerId },
                ])
            })
            tmpRoom.on('peerLeave', (peerId) => {
                setRemoteAudio((prev) => {
                    return prev.filter((audio) => {
                        if (audio.peerId === peerId) {
                            audio.stream.getTracks().forEach((track) => track.stop())
                        }
                        return audio.peerId !== peerId
                    })
                })
                console.log(`=== ${peerId} left ===\n`)
            })
            setRoom(tmpRoom)
        }
        setIsStarted((prev) => !prev)
    }
    const onEnd = () => {
        if (room) {
            room.close()
            setRemoteAudio((prev) => {
                return prev.filter((audio) => {
                    audio.stream.getTracks().forEach((track) => track.stop())
                    return false
                })
            })
        }
        setIsStarted((prev) => !prev)
    }
    const castAudio = () => {
        return remoteAudio.map((audio) => {
            return <>

            </>
        })
    }
    return (
        <div>
            <button onClick={() => onStart()} disabled={isStarted}>start</button>
            <button onClick={() => onEnd()} disabled={!isStarted}>end</button>
            {castAudio()}
        </div>
    )
}

const RemoteAudio = (props: { audio: AudioStream }) => {
    const audioRef = React.useRef<HTMLAudioElement>(null)

    React.useEffect(() => {
        if (audioRef.current) {
            audioRef.current.srcObject = props.audio.stream
            audioRef.current.play().catch((e) => console.log(e))
        }
    }, [props.audio])
    return <audio ref={audioRef} playsInline></audio>
}
