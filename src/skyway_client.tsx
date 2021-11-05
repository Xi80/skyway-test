import Peer, { SfuRoom } from 'skyway-js'
import React from 'react'
type AudioStream = {
    stream: MediaStream;
    peerId: string;
};

export const Room: React.FC<{ roomId: string,isHost : boolean }> = ({ roomId,isHost}) => {
    const peer = React.useRef(new Peer({ key: process.env.REACT_APP_SKYWAYAPI as string ,debug: 3}))

    const [remoteAudio, setRemoteAudio] = React.useState<AudioStream[]>([])
    const [localStream, setLocalStream] = React.useState<MediaStream>()
    const [room, setRoom] = React.useState<SfuRoom>()
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

            const tmpRoom = (isHost)?peer.current.joinRoom<SfuRoom>(roomId, {
                mode: 'sfu',
                stream:localStream,
            }) : peer.current.joinRoom<SfuRoom>(roomId, {
                mode: 'sfu',
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
            return <RemoteAudio audio={audio} key={audio.peerId} />
        })
    }

    return (
        <div>
            <button onClick={() => onStart()} disabled={isStarted}>開始</button>
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