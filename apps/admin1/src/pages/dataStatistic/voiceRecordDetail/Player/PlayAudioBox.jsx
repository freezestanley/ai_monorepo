import { ConfigProvider, Slider, Tooltip } from "antd"
import { forwardRef, memo, useCallback, useMemo } from "react"

const theme = {
  token: {
    colorBgSpotlight: "#fff",
    colorTextLightSolid: "#000B15"
  },
  components: {
    Slider: {
      handleColor: "#7052F0",
      handleActiveColor: "#7052F0",
      handleLineWidth: 1,
      handleLineWidthHover: 1,
      railBg: "#EFF1F4",
      railHoverBg: "#EFF1F4",
      railSize: 8,
      trackBg: "#7052F0",
      trackHoverBg: "#7052F0",
      dotBorderColor: "#7052F0",
      dotActiveBorderColor: "#7052F0",
      dotSize: 12,
      controlSize: 12,
      handleSize: 12,
      handleSizeHover: 12
    }
  }
}

function formatterTime(milliseconds) {
  // 将毫秒转换为秒
  const totalSeconds = Math.floor(milliseconds / 1000)
  // 计算分钟数和剩余的秒数
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  // 格式化分钟数和秒数，确保它们的长度为2位
  const formattedMinutes = String(minutes).padStart(2, "0")
  const formattedSeconds = String(seconds).padStart(2, "0")
  // 拼接成 mm:ss 格式的字符串
  return `${formattedMinutes}:${formattedSeconds}`
}

const PlayAudioBox = forwardRef(
  (
    {
      currentTime,
      duration,
      url,
      autoPlay,
      onError,
      onLoadedMetadata,
      onChange,
      keyPointMs,
      setPlaying,
      handleTimeUpdate,
      onEnded
    },
    ref
  ) => {
    const onPlay = useCallback(() => setPlaying?.(true), [setPlaying])

    const onPause = useCallback(() => setPlaying?.(false), [setPlaying])
    const keyPointSec = useMemo(() => {
      const keyPointMsNumber = Number(keyPointMs)
      if (!Number.isFinite(keyPointMsNumber)) return null
      return keyPointMsNumber / 1000
    }, [keyPointMs])

    const keyPointValue = useMemo(() => {
      if (keyPointSec === null) return null
      const maxValue = duration || keyPointSec
      console.log(
        " Math.min(Math.max(keyPointSec, 0), maxValue)",
        Math.min(Math.max(keyPointSec, 0), maxValue)
      )
      return Math.min(Math.max(keyPointSec, 0), maxValue)
    }, [duration, keyPointSec])

    const keyPointMarks = useMemo(() => {
      if (keyPointValue === null) return undefined
      return {
        [keyPointValue]: {
          label: (
            <Tooltip title="接通">
              <span
                className="player-key-point"
                onClick={(event) => {
                  event.stopPropagation()
                  onChange?.(keyPointValue)
                }}
              />
            </Tooltip>
          )
        }
      }
    }, [keyPointValue, onChange])

    return (
      <div className={"progress"}>
        <ConfigProvider theme={theme}>
          <Slider
            value={currentTime}
            onChange={onChange}
            tooltip={{
              formatter: (value) => (
                <span key={value}>{value ? formatterTime(value * 1000) : "00:00"}</span>
              )
            }}
            step={0.01}
            max={duration}
            min={0}
            marks={keyPointMarks}
          />
        </ConfigProvider>
        {!!url && (
          <audio
            onLoadedMetadata={onLoadedMetadata}
            onPlay={onPlay}
            onPause={onPause}
            onEnded={onEnded}
            onError={onError}
            style={{ position: "absolute", opacity: 0, left: -9999 }}
            onTimeUpdate={handleTimeUpdate}
            ref={ref}
            src={url}
            controls
            autoPlay={autoPlay}
          />
        )}
      </div>
    )
  }
)

export default memo(PlayAudioBox)
