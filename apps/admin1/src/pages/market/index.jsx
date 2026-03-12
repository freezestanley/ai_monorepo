/*
 * @Author: Dyton
 * @Date: 2024-04-16 18:56:57
 * @Descripttion:
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2024-04-24 18:14:24
 * @FilePath: /za-aigc-platform-admin-static/src/pages/market/index.jsx
 * Copyright (c) 2024 by ZA-智能中台, All Rights Reserved.
 */
import styles from "./index.module.scss"
import { MarketSearch } from "./components/search"
import { ItemModule } from "./components/itemModule"
import ApplicationItemModule from "./components/applicationItemModule"
import { TimbreModule } from "./components/itemModule/TimbreModule"
import { ModelSeriesModule } from "./components/itemModule/ModelSeriesModule"
import { useState } from "react"
import { marketCode, marketOptions, subtitleOptions } from "../../constants/market"
import { createContext, useContext, useEffect } from "react"
import TextAnimation from "@/components/TextAnimation"
import { TableObjectPro } from "@/components/TableObjectPro"
import { SearchOutlined, PlusOutlined } from "@ant-design/icons"
import { Input, Divider, Menu, Button } from "antd"
import queryString from "query-string"
import { useLocation, useNavigate } from "react-router-dom"
import banner from "@/assets/img/banner.png"
import banner1 from "@/assets/img/banner1.png"
import banner2 from "@/assets/img/banner2.png"
import banner3 from "@/assets/img/banner3.png"
import banner4 from "@/assets/img/banner4.png"
import { useInitPublishData } from "@/hooks/useStudioPublishData"

// 状态保持的 key
export const MARKET_TYPE_STATE_KEY = "market_type_state"

export const MarketContext = createContext({
  marketType: marketOptions?.[1]?.value,
  setMarketType: (e) => {},
  marketSearch: "",
  setMarketSearch: (e) => {}
})
export const MarketProvider = (props) => {
  const [marketType, setMarketType] = useState(marketOptions?.[1]?.value)
  const [marketSearch, setMarketSearch] = useState("")
  const values = { marketType, setMarketType, marketSearch, setMarketSearch }

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const tab = hashParams.get("tab")
    const queryParams = new URLSearchParams(window.location.search)
    const queryTab = queryParams.get("tab")

    if (tab && Object.values(marketCode).includes(tab)) {
      setMarketType(tab)
    } else if (queryTab && Object.values(marketCode).includes(queryTab)) {
      setMarketType(queryTab)
    }
  }, [])

  return <MarketContext.Provider value={values}>{props.children}</MarketContext.Provider>
}
export const useMarket = () => useContext(MarketContext)

const SearchBox = () => {
  const { marketSearch, setMarketType, setMarketSearch } = useMarket()
  const [value, setValue] = useState("")
  const onChangeOptions = (v) => setMarketType(v)
  const handlerSearch = () => setMarketSearch(value)
  const navigate = useNavigate()

  const onChange = (e) => {
    const val = e?.target?.value || ""
    setValue(val)
    if (val === "") {
      setMarketSearch("")
    }
  }

  useEffect(() => {
    setValue(marketSearch)
  }, [marketSearch])

  const { marketType } = useMarket()
  const show = (module) => marketType === marketCode.ALL || marketType === module

  return (
    <div className={styles["market-header-content"]}>
      <div className={styles["banner-container"]}>
        <MarketBanner />
      </div>
      <div className={styles["search-container"]}>
        {show(marketCode.TIMBRE) && (
          <Button
            type="link"
            style={{ marginRight: "16px" }} // 添加右侧边距
            onClick={() =>
              window.open(
                "https://doc.weixin.qq.com/doc/w3_AaAAiwaoANoCNmcfhtsD8SBi0vw97?scode=AE4AywdQAA4BO4150fAeAAKwbkAGk",
                "_blank"
              )
            }
          >
            创建复刻音色
          </Button>
        )}
        {show(marketCode.MODEL_SERIES) && (
          <Button
            type="link"
            style={{ marginRight: "16px" }}
            onClick={() => {
              // 清除来源标记（表示来自主市场页面）
              sessionStorage.removeItem("fromMarketSub")
              navigate("/model-series/compare")
            }}
          >
            模型对比
          </Button>
        )}
        <div className={styles["market-search"]}>
          <Input
            className={styles["style-input"]}
            placeholder="搜索..."
            value={value}
            onChange={onChange}
            onPressEnter={handlerSearch}
            allowClear
            suffix={
              <SearchOutlined
                style={{ color: "#bfbfbf", cursor: "pointer" }}
                onClick={handlerSearch}
              />
            }
          />
        </div>
      </div>
    </div>
  )
}

const MarketBanner = () => {
  const { marketType, setMarketType } = useMarket()
  const backgroundOptions = [
    { value: "AGENT", img: banner4 },
    { value: "SKILL", img: banner3 },
    { value: "PLUG_IN", img: banner2 },
    { value: "ROBOT", img: banner1 },
    { value: "TIMBRE", img: banner3 },
    { value: "MODEL_SERIES", img: banner2 }
  ]
  const title = marketOptions.find((item) => item.value === marketType).label
  const subtitle = subtitleOptions.find((item) => item.value === marketType).label
  const background = backgroundOptions.find((item) => item.value === marketType).img
  return (
    <div
      className={styles["market-banner"]}
      style={{
        backgroundImage: `url(${background})`
      }}
    >
      <div
        className={styles["banner-logo"]}
        style={{
          backgroundImage: `url(${banner})`
        }}
      />
      <div className={styles["banner-text"]}>
        <div className={styles["banner-text-title"]}>{title}</div>
        <div className={styles["banner-text-subtitle"]}>{subtitle}</div>
      </div>
    </div>
  )
}

const SideMenu = () => {
  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search) ?? {}
  const { botNo } = queryParams
  const { marketType, marketSearch, setMarketType, setMarketSearch } = useMarket()

  const restoreFilterState = () => {
    try {
      const savedState = sessionStorage.getItem(MARKET_TYPE_STATE_KEY)
      if (savedState) {
        const filterState = JSON.parse(savedState)
        // 检查状态是否过期（30分钟）
        const isExpired = Date.now() - filterState.timestamp > 30 * 60 * 1000
        if (!isExpired && filterState.botNo === botNo) {
          setMarketType(filterState.marketType || marketOptions?.[1]?.value)
          setMarketSearch(filterState.marketSearch || "")
        } else {
          // 清除过期状态
          sessionStorage.removeItem(MARKET_TYPE_STATE_KEY)
          setMarketType(marketOptions?.[1]?.value)
          setMarketSearch("")
        }
      }
    } catch (error) {
      sessionStorage.removeItem(MARKET_TYPE_STATE_KEY)
    }
  }

  // 组件挂载时恢复状态
  useEffect(() => {
    restoreFilterState()
  }, [botNo])

  // 保存筛选状态到 sessionStorage
  const saveFilterState = () => {
    const filterState = {
      marketSearch,
      marketType,
      botNo,
      timestamp: Date.now()
    }
    sessionStorage.setItem(MARKET_TYPE_STATE_KEY, JSON.stringify(filterState))
  }

  useEffect(() => {
    saveFilterState()
  }, [marketSearch, marketType])

  const handleMenuClick = (e) => {
    setMarketType(e.key)
    setMarketSearch("")
  }

  return (
    <Menu
      mode="inline"
      selectedKeys={[marketType]}
      onClick={handleMenuClick}
      className={styles["customMenu"]}
      items={marketOptions.map((option) => {
        if (option.value !== "ALL") return { key: option.value, label: option.label }
      })}
    />
  )
}

export const MarketComponents = () => {
  const { marketType } = useMarket()

  // 获取版本发布配置数据
  useInitPublishData()

  const show = (module) => marketType === marketCode.ALL || marketType === module
  return (
    <div className={styles["market-container"]}>
      <div className={styles["market-side-menu"]}>
        <SideMenu />
      </div>
      <div className={styles["market-main"]}>
        {/* <div className={styles["title"]}>
        <TextAnimation letterSpacing={10}>灵犀市集</TextAnimation>
      </div>
      <MarketSearch /> */}
        <SearchBox />

        {/* 本期不做应用 TODO！ */}
        {/* {show(marketCode.APP) && <ItemModule type={marketCode.APP} />} */}
        {show(marketCode.AGENT) && <ItemModule type={marketCode.AGENT} />}
        {show(marketCode.SKILL) && <ItemModule type={marketCode.SKILL} />}
        {show(marketCode.PLUG_IN) && <ItemModule type={marketCode.PLUG_IN} />}
        {show(marketCode.ROBOT) && (
          <>
            <Divider
              style={{
                fontSize: "18px",
                fontWeight: "900",
                margin: "0 0 40px",
                letterSpacing: "10px"
              }}
            >
              公共应用
            </Divider>
            <ApplicationItemModule type={marketCode.ROBOT} />
            <Divider
              style={{
                fontSize: "18px",
                fontWeight: "900",
                margin: "40px 0",
                letterSpacing: "10px"
              }}
            >
              订阅应用
            </Divider>
            <ItemModule type={marketCode.ROBOT} />
          </>
        )}
        {show(marketCode.TIMBRE) && <TimbreModule />}
        {show(marketCode.MODEL_SERIES) && <ModelSeriesModule />}
      </div>
    </div>
  )
}

export const Market = () => (
  <MarketProvider>
    <MarketComponents />
  </MarketProvider>
)
