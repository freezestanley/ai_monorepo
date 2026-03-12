import React, { memo, useEffect, useRef, useMemo } from "react"
import CustomEmpty from "@/antd-styles/components/CustomEmpty"
import { Segmented, Select } from "antd"
import { AppstoreOutlined, BarsOutlined } from "@ant-design/icons"
import { Column } from "@ant-design/plots"
import { columnConfig } from "../config.jsx"
import { trendMap } from "../const.js"

const viewOptions = [
  { icon: <BarsOutlined />, value: "listView" },
  { icon: <AppstoreOutlined />, value: "spanView" }
]

interface Cluster {
  id: string | number
  name: string
  optimizationOrderCount: number
  trend: string
  problemCategoryId: string | number
}

interface ProblemCategory {
  label: string
  value: string | number
}

interface ColumnDataItem {
  problem: string
  count: number
  clusterId: string | number
  clusterName: string
}

interface ProblemClusterProps {
  clusters: Cluster[]
  problemCategories: ProblemCategory[]
  handleChange: (value: any) => void
  activeProblem: string
  viewMode: string
  handleViewChange: (value: string) => void
  selectedCluster: string | number
  setSelectdCluster: any
  columnData: ColumnDataItem[]
}

// 问题集群组件
const ProblemCluster = memo<ProblemClusterProps>(
  ({
    clusters,
    problemCategories,
    handleChange,
    activeProblem,
    viewMode,
    handleViewChange,
    selectedCluster,
    setSelectdCluster,
    columnData
  }) => {
    const amt = clusters.reduce((total, cluster) => total + cluster.optimizationOrderCount, 0)

    // 网格视图使用 useMemo 缓存，避免 columnData 变化导致整个组件重渲
    const gridView = useMemo(() => {
      if (columnData.length === 0) {
        return (
          <div className="h-[500px] flex items-center justify-center">
            <CustomEmpty description={"暂无数据"} />
          </div>
        )
      }
      return (
        <div className="mt-6 h-[500px]">
          {/* @ts-ignore */}
          <Column data={columnData} {...columnConfig} />
        </div>
      )
    }, [columnData])
    return (
      <div
        className={`border border-gray-300 rounded-xl p-4 h-[100%] flex flex-col overflow-x-hidden transition-all duration-300 ease-in-out ${viewMode === "listView" ? "w-[30%]" : "w-[35%]"}`}
      >
        <div className="flex items-center justify-between mb-2 mr-4">
          <div className="flex items-center justify-start space-x-2">
            <div className="text-xl font-medium ">问题分类</div>
            <div className={`p-2`}>
              <Select
                placeholder="请选择"
                options={problemCategories}
                style={{ width: "180px" }}
                onChange={handleChange}
                value={activeProblem}
                showSearch
                filterOption={(input, option) =>
                  String(option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              ></Select>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Segmented
              options={viewOptions}
              value={viewMode}
              onChange={handleViewChange}
              className="custom-segmented"
            />
          </div>
        </div>

        {clusters.length === 0 ? (
          <div className="h-[500px] flex items-center justify-center">
            <CustomEmpty description={"暂无数据"} />
          </div>
        ) : (
          <div className="h-[750px]">
            {/* 列表视图 */}
            {viewMode === "listView" && (
              <div className="space-y-5 overflow-y-auto p-2 pl-3 flex-1 ">
                {clusters.map(
                  ({ id: clusterID, name, optimizationOrderCount, trend, problemCategoryId }) => {
                    const isSelected = selectedCluster == clusterID
                    const problemCategory = problemCategories?.find(
                      (item) => item?.value == problemCategoryId
                    )?.label
                    const percent =
                      amt === 0
                        ? "(0.0%)"
                        : "(" + ((optimizationOrderCount / amt) * 100).toFixed(1) + "%)"
                    return (
                      <div
                        key={clusterID}
                        onClick={() => {
                          setSelectdCluster(clusterID)
                        }}
                        className={`bg-white rounded-xl px-4 py-3 space-y-4 mr-4 cursor-pointer transition-all border ${
                          isSelected
                            ? "border-[#7f56d9] shadow-md shadow-purple-200/50 transform scale-[1.02]"
                            : "border-gray-300 hover:border-gray-400 hover:shadow-md"
                        }`}
                      >
                        <div className="text-[16px] font-medium">{name}</div>
                        <div className="flex justify-start items-center">
                          <span className="mr-[20px] text-[14px] font-normal text-slate-600">
                            问题会话数：
                            <span className="text-[#7f56d9] text-[14px] font-bold space-x-2">
                              <span>{optimizationOrderCount}</span>
                              <span>{percent}</span>
                            </span>
                          </span>
                          {problemCategory && (
                            <div className="border border-gray-200 rounded-[10px] px-2 text-[12px] bg-slate-100 text-black">
                              {problemCategory}
                            </div>
                          )}
                        </div>
                        <div className="text-[12px] font-normal text-slate-600">
                          趋势：{trendMap[trend]}
                        </div>
                      </div>
                    )
                  }
                )}
              </div>
            )}
            {/* 网格视图 */}
            {viewMode === "spanView" && gridView}
          </div>
        )}
      </div>
    )
  }
)

export default ProblemCluster
