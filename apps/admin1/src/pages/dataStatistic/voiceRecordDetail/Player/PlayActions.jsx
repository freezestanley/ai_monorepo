import { Checkbox, Col, ConfigProvider, Popover, Radio, Row, Slider, Tooltip } from "antd"
import { memo, useEffect, useRef, useState, useCallback } from "react"
import { downloadFile } from "@/api/tools"
import NoVolume from "../img/noVolume.svg"
import Pause from "../img/pause.svg"
import QuickBack from "../img/quickBack.svg"
import QuickGo from "../img/quickGo.svg"
import Start from "../img/start.svg"
import Volume from "../img/volume.svg"
import Download from "../img/download.svg"

const colorPrimary = "#7F56D9"

const theme = {
  token: {
    colorBgSpotlight: "#fff",
    colorTextLightSolid: "#000B15"
  },
  components: {
    Slider: {
      handleColor: colorPrimary,
      handleActiveColor: colorPrimary,
      handleLineWidth: 1,
      handleLineWidthHover: 1,
      railBg: "#D0D5DD",
      railHoverBg: "#D0D5DD",
      railSize: 3,
      trackBg: colorPrimary,
      trackHoverBg: colorPrimary,
      dotBorderColor: colorPrimary,
      dotActiveBorderColor: colorPrimary,
      dotSize: 8,
      controlSize: 8,
      handleSize: 8,
      handleSizeHover: 8
    }
  }
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  const formattedMinutes = String(minutes).padStart(2, "0")
  const formattedSeconds = String(remainingSeconds).padStart(2, "0")
  return `${formattedMinutes}:${formattedSeconds}`
}

const speeds = [
  {
    label: "0.5X",
    value: 0.5
  },
  {
    label: "1X",
    value: 1
  },
  {
    label: "1.25X",
    value: 1.25
  },
  {
    label: "1.5X",
    value: 1.5
  },
  {
    label: "2.0X",
    value: 2
  },
  {
    label: "3.0X",
    value: 3
  }
]

function getFileName(url) {
  const urlObj = new URL(url)
  const path = urlObj.pathname
  const segments = path.split("/")
  return segments[segments.length - 1]
}

const PlayActions = ({
  currentTime,
  duration,
  playing,
  url,
  start,
  pause,
  getAudio,
  setAudioStats,
  onTimeUpdate
}) => {
  const [volume, setVolume] = useState(100) // 音量
  const [speed, setSpeed] = useState(1) // 播放速度
  const [isCustomSpeed, setIsCustomSpeed] = useState(false)
  const volumeRef = useRef(volume || 100)

  const download = useCallback(async () => {
    const urlObj = new URL(url)
    const path = "/finOSSWeb" + urlObj.pathname + urlObj.search + urlObj.hash
    const blob = await fetch(path).then((res) => res.blob())
    const blobUrl = window.URL.createObjectURL(blob)
    downloadFile(blobUrl, getFileName(url))
    window.URL.revokeObjectURL(blobUrl)
  }, [url])

  useEffect(() => {
    onTimeUpdate?.({ status: playing, time: currentTime })
  }, [playing, currentTime, onTimeUpdate])

  useEffect(() => {
    if (!getAudio() || !url) return
    setAudioStats("playbackRate", speed)
  }, [speed, url, getAudio, setAudioStats])

  return (
    <Row className={"actions"} gutter={24}>
      <Col className={"actionLeft"} xl={12} lg={24}>
        <div
          onClick={() => {
            start()
            setAudioStats("currentTime", getAudio()?.currentTime - 15)
          }}
          className={"actionIconContainer"}
        >
          <img src={QuickBack} className={"actionIcon"} />
        </div>
        <Tooltip overlayStyle={{ zIndex: 1074 }} title={playing ? "暂停" : "播放"}>
          <div
            onClick={() => {
              !playing ? start() : pause()
            }}
            className={"actionIconContainer"}
          >
            <img
              src={playing ? Pause : Start}
              className={"actionIcon"}
              style={{ width: 24, height: 24 }}
            />
          </div>
        </Tooltip>
        <div
          onClick={() => {
            start()
            setAudioStats("currentTime", getAudio()?.currentTime + 15)
          }}
          className={"actionIconContainer"}
        >
          <img src={QuickGo} className={"actionIcon"} />
        </div>
        <div className={"audioTime"}>
          <span>{formatTime(currentTime)}</span>
          <span> / </span>
          <span>{formatTime(duration)}</span>
        </div>
      </Col>
      <Col className={"actionRight"} xl={12} lg={24}>
        <Popover
          placement="top"
          overlayClassName={"speedPop"}
          arrow={false}
          content={
            <>
              <Radio.Group
                disabled={isCustomSpeed}
                block
                optionType="button"
                options={speeds}
                onChange={(e) => setSpeed(e.target.value)}
                value={speed}
              />
              <ConfigProvider theme={theme}>
                <Checkbox
                  onChange={(e) => {
                    if (!e.target.checked && !speeds?.find(({ value }) => speed === value)) {
                      const ls = speeds.filter(({ value }) => value <= speed)
                      setSpeed(ls[ls.length - 1].value ?? 1)
                    }
                    setIsCustomSpeed(e.target.checked)
                  }}
                  checked={isCustomSpeed}
                >
                  自定义
                </Checkbox>
                <Slider
                  tooltip={{
                    formatter(value) {
                      return `${value}X`
                    }
                  }}
                  min={0.5}
                  max={3}
                  step={0.1}
                  value={speed}
                  disabled={!isCustomSpeed}
                  onChange={(e) => setSpeed(e)}
                />
              </ConfigProvider>
            </>
          }
        >
          <span className={"speed"}>倍数</span>
        </Popover>
        <Popover
          placement="top"
          overlayClassName={"volumePop"}
          arrow={false}
          content={
            <div className={"volume"}>
              <span>{volume}</span>
              <ConfigProvider theme={theme}>
                <Slider
                  vertical
                  value={volume}
                  onChange={(e) => {
                    setVolume(e)
                    volumeRef.current = e
                    setAudioStats("volume", e / 100)
                  }}
                  tooltip={{
                    formatter(value) {
                      return `${value}%`
                    }
                  }}
                  min={0}
                  max={100}
                  step={1}
                />
              </ConfigProvider>
            </div>
          }
        >
          <img
            className={"volumeIcon"}
            src={volume === 0 ? NoVolume : Volume}
            onClick={() => {
              setVolume((preState) => {
                setAudioStats("volume", (preState === 0 ? volumeRef.current : 0) / 100)
                return preState === 0 ? volumeRef.current : 0
              })
            }}
          />
        </Popover>
        <Tooltip overlayStyle={{ zIndex: 1074 }} title={"下载"}>
          <img className={"downloadIcon"} src={Download} onClick={download} />
        </Tooltip>
      </Col>
    </Row>
  )
}

export default memo(PlayActions)
