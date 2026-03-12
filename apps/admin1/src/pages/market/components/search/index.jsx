/*
 * @Author: Dyton
 * @Date: 2024-04-16 18:56:57
 * @Descripttion:
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2024-04-18 17:36:28
 * @FilePath: /za-aigc-platform-admin-static/src/pages/market/components/search/index.jsx
 * Copyright (c) 2024 by ZA-智能中台, All Rights Reserved.
 */
import styles from "./index.module.scss"
import { ArrowRightOutlined } from "@ant-design/icons"
import { Button, Input, Select } from "antd"
import { marketOptions, marketCode } from "../../../../constants/market"
import { useState } from "react"
import { useMarket } from "../.."
export const MarketSearch = (props) => {
  const { className } = props || {}
  const { setMarketType, setMarketSearch } = useMarket()
  const [value, setValue] = useState("")
  const onChangeOptions = (v) => setMarketType(v)
  const handlerSearch = () => setMarketSearch(value)
  return (
    <div className={`${styles["market-search"]} ${className ?? ""}`}>
      <div className={styles["market-search-container"]}>
        <Select defaultValue={marketCode.ALL} options={marketOptions} onChange={onChangeOptions} />
        <Input
          placeholder="搜索名称/描述"
          onChange={(e) => setValue(e?.target?.value)}
          onPressEnter={(e) => setMarketSearch(value)}
          allowClear
        />
        <Button
          icon={<ArrowRightOutlined />}
          onClick={handlerSearch}
          size="small"
          type="primary"
        ></Button>
      </div>
    </div>
  )
}
