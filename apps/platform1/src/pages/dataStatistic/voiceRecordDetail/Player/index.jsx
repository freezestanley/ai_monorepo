import { forwardRef, memo, useCallback, useImperativeHandle, useRef, useState } from "react"
import CopyToClipboard from "react-copy-to-clipboard"
import { message } from "antd"
import { ArrowLeftOutlined } from "@ant-design/icons"
import PlayActions from "./PlayActions"
import PlayAudioBox from "./PlayAudioBox"
import "./index.less"

const Player = forwardRef((props, ref) => {
  const { url, callId, goBack, onPlayerChange, isContainer, onTimeUpdate, connectOffsetMs } = props
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0) // 当前播放的时间
  const [duration, setDuration] = useState(0)
  const audioRef = useRef()

  const handleTimeUpdate = useCallback((e) => {
    setCurrentTime(e.target.currentTime)
  }, [])

  const onStart = useCallback(() => {
    const duration = audioRef.current.duration
    setCurrentTime((preState) => {
      if (preState >= duration) {
        audioRef.current.currentTime = 0
        return 0
      }
      return preState
    })
    setPlaying(true)
    return audioRef.current.play()
  }, [])

  const start = useCallback(async () => {
    await onStart()
    onPlayerChange?.()
  }, [onStart, onPlayerChange])

  const onPause = useCallback(() => {
    setPlaying(false)
    audioRef.current.pause()
  }, [])

  const pause = useCallback(() => {
    onPause()
    onPlayerChange?.()
  }, [onPause, onPlayerChange])

  const onLoadedMetadata = useCallback((e) => {
    const duration = e.target.duration
    setDuration(duration)
  }, [])

  const onEnded = useCallback(() => {
    audioRef.current.currentTime = 0
  }, [])

  const onPlaySilderChange = useCallback(
    (e) => {
      setCurrentTime(e)
      audioRef.current.currentTime = e
      start()
    },
    [start]
  )

  const getAudio = useCallback(() => audioRef.current, [])

  const setAudioStats = useCallback((key, value) => {
    if (!audioRef.current) return
    audioRef.current[key] = value
  }, [])

  const initPlayer = useCallback(() => {
    pause()
    audioRef.current.currentTime = 0
    setCurrentTime(0)
  }, [pause])

  useImperativeHandle(ref, () => ({
    onCurrentTimePlay: (beginTimeOffset) => {
      const time = (beginTimeOffset || 0) / 1000
      setCurrentTime(time)
      audioRef.current.currentTime = time
      return onStart()
    },
    onPause,
    initPlayer
  }))

  return (
    <div className={"playerContainer"}>
      <div className={"title"} style={url ? {} : { marginBottom: 0, borderBottom: "none" }}>
        {isContainer && (
          <ArrowLeftOutlined onClick={goBack} style={{ marginRight: 10, cursor: "pointer" }} />
        )}
        <div className="mr-4">会话详情</div>
        通话ID：{callId}
        {!!callId && (
          <CopyToClipboard text={callId} onCopy={() => message.success("复制成功")}>
            <span className="iconfont icon-fuzhi text-[#626263] cursor-pointer text-[18px] ml-[8px]" />
          </CopyToClipboard>
        )}
      </div>
      {!!url && (
        <>
          <PlayAudioBox
            ref={audioRef}
            currentTime={currentTime}
            duration={duration}
            url={url}
            keyPointMs={connectOffsetMs}
            onLoadedMetadata={onLoadedMetadata}
            setPlaying={setPlaying}
            handleTimeUpdate={handleTimeUpdate}
            onEnded={onEnded}
            onChange={onPlaySilderChange}
          />
          <PlayActions
            currentTime={currentTime}
            duration={duration}
            playing={playing}
            url={url}
            onTimeUpdate={onTimeUpdate}
            start={start}
            pause={pause}
            getAudio={getAudio}
            setAudioStats={setAudioStats}
          />
        </>
      )}
    </div>
  )
})

export default memo(Player)
