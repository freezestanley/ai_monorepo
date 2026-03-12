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
import { ModelSeriesModule } from "./components/itemModule/ModelSeriesModule"
import { useState, useEffect } from "react"
import { marketCode, marketOptions, subtitleOptions } from "../../constants/market"
import { createContext, useContext } from "react"
import TextAnimation from "@/components/TextAnimation"
import { TableObjectPro } from "@/components/TableObjectPro"
import { SearchOutlined, PlusOutlined } from "@ant-design/icons"
import { Input, Select, Menu, Divider, Button } from "antd"
import { useNavigate, useLocation } from "react-router-dom"
import "./styles.scss"
import banner from "@/assets/img/banner.png"
import banner1 from "@/assets/img/banner1.png"
import banner2 from "@/assets/img/banner2.png"
import banner3 from "@/assets/img/banner3.png"
import banner4 from "@/assets/img/banner4.png"
import { PublicTimbreModule } from "./components/itemModule"
import queryString from "query-string"

export const MarketContext = createContext({
  marketType: marketOptions?.[1]?.value,
  setMarketType: (e) => {},
  marketSearch: "",
  setMarketSearch: (e) => {}
})
export const MarketProvider = (props) => {
  const location = useLocation()
  const [marketType, setMarketType] = useState(props.marketType || marketOptions?.[1]?.value)
  const [marketSearch, setMarketSearch] = useState("")

  // 检查 URL 参数，根据 tab 值设置默认的 marketType，并监听路由变化
  useEffect(() => {
    // 优先检查查询参数
    const queryParams = new URLSearchParams(location.search)
    const queryTab = queryParams.get("tab")

    // 备用：检查哈希参数
    const hashParams = new URLSearchParams(location.hash.substring(1))
    const hashTab = hashParams.get("tab")

    const tab = queryTab || hashTab

    if (tab) {
      if (tab === "ailab") {
        setMarketType(marketCode.ROBOT) // AI Lab 对应的 marketType
      } else {
        setMarketType(tab) // 直接使用 tab 值设置 marketType
      }
    }
  }, [location.search, location.hash]) // 依赖 location.search 和 location.hash 来监听路由变化

  const values = { marketType, setMarketType, marketSearch, setMarketSearch }
  return <MarketContext.Provider value={values}>{props.children}</MarketContext.Provider>
}
export const useMarket = () => useContext(MarketContext)

const SearchBox = () => {
  const { marketSearch, setMarketType, setMarketSearch } = useMarket()
  const [value, setValue] = useState("")
  const navigate = useNavigate()

  const onChangeOptions = (v) => setMarketType(v)
  const handlerSearch = () => setMarketSearch(value)

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
        {show(marketCode.MODEL_SERIES) && (
          <Button
            type="link"
            style={{ marginRight: "16px" }}
            onClick={() => {
              // 设置来源标记
              sessionStorage.setItem("fromMarketSub", "true")
              navigate("/model-series/compare")
            }}
          >
            模型对比
          </Button>
        )}
        <div className={styles["market-search"]}>
          <Input
            className={styles["style-input"]}
            placeholder="搜索名称"
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
  const hashParams = window.location.queryParams
  // const tab = hashParams.get("tab")
  const { marketType, setMarketType } = useMarket()

  const backgroundOptions = [
    { value: "AGENT", img: banner4 },
    { value: "SKILL", img: banner3 },
    { value: "PLUG_IN", img: banner2 },
    { value: "ROBOT", img: banner1 },
    { value: "TIMBRE", img: banner3 }, // 声音tab
    { value: "PUBLIC_TIMBRE", img: banner3 }, // 公共声音tab（如有）
    { value: "MODEL_SERIES", img: banner2 } // 模型广场tab
  ]
  const title = marketOptions.find((item) => item.value === marketType)?.label
  const subtitle = subtitleOptions.find((item) => item.value === marketType)?.label
  const background = backgroundOptions.find((item) => item.value === marketType)?.img
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
  const { marketType, setMarketType } = useMarket()
  const handleMenuClick = (e) => {
    console.log(e.key)
    setMarketType(e.key)
  }
  return (
    <Menu
      mode="inline"
      selectedKeys={[marketType]}
      onClick={handleMenuClick}
      className={styles["customMenu"]}
      items={marketOptions
        .filter((option) => option.value !== "ALL") // 移除声音菜单
        .map((option) => ({ key: option.value, label: option.label }))}
    />
  )
}

export const MarketComponents = () => {
  const { marketType } = useMarket()
  const show = (module) => marketType === marketCode.ALL || marketType === module
  return (
    <div className={styles["market-container"]}>
      {/* <div className={styles["title"]}>
        <TextAnimation letterSpacing={10}>灵犀市集</TextAnimation>
      </div>
      <MarketSearch /> */}
      <div className={styles["market-side-menu"]}>
        <SideMenu />
      </div>
      <div className={styles["market-main"]}>
        <SearchBox />
        {/* 本期不做应用 TODO！ */}
        {/* {show(marketCode.APP) && <ItemModule type={marketCode.APP} />} */}
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
        {show(marketCode.AGENT) && <ItemModule type={marketCode.AGENT} />}
        {show(marketCode.SKILL) && <ItemModule type={marketCode.SKILL} />}
        {show(marketCode.PLUG_IN) && <ItemModule type={marketCode.PLUG_IN} />}
        {show(marketCode.MODEL_SERIES) && <ModelSeriesModule />}
        {/* // 声音菜单后续TODO */}
        {show(marketCode.TIMBRE) && <PublicTimbreModule />}
      </div>
    </div>
  )
}

export const MarketSub = () => {
  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search)

  return (
    <MarketProvider marketType={queryParams.marketType}>
      <MarketComponents />
    </MarketProvider>
  )
}
