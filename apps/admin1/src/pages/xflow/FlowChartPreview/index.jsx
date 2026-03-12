import React, { useState, useCallback } from "react"
import "./index.scss"
import { useFetchSkillTemplate } from "@/api/skill"
import { useSkillFlowData } from "@/store"
import { getNewNodeConfig } from "../xflowV2/untils"

const FlowChartPreview = ({ onChartClick }) => {
  const { data = [] } = useFetchSkillTemplate({
    templateType: "FLOW"
  })

  const skillFlowData = useSkillFlowData((state) => state.skillFlowData)

  const nodes = skillFlowData?.flowDefinition?.graph?.nodes

  const handleClick = useCallback(
    (chart) => {
      const graph = chart?.flowDefinition?.graph
      if (graph) {
        graph?.nodes?.forEach((item) => {
          // 转换x以及y, 强制转为数字, 如果非数字,则为0
          item.x = !isNaN(Number(item.x)) ? Number(item.x) : 0
          item.y = !isNaN(Number(item.y)) ? Number(item.y) : 0
        })

        graph?.edges?.forEach((item) => {
          item.attrs = {
            ...item.attrs,
            line: {
              strokeWidth: 1,
              strokeDasharray: [0, 0],
              stroke: "#525866"
            }
          }
        })
      }

      onChartClick(graph)
    },
    [onChartClick]
  )
  let renderList = data.filter((item) => item.templateType === "FLOW")
  renderList = renderList.map((item) => {
    if (item.flowDefinition?.graph?.nodes) {
      return {
        ...item,
        flowDefinition: {
          ...item.flowDefinition,
          graph: {
            ...item.flowDefinition.graph,
            nodes: getNewNodeConfig(item.flowDefinition.graph.nodes)
          }
        }
      }
    }
    return item
  })

  const shouldRender = !nodes || (nodes && nodes.length === 0)

  return (
    <>
      {shouldRender && (
        <div className="fixed bottom-2 left-0 w-full py-4 shadow-md pl-44 flow-chat-preview-wrapper">
          <div className="flex justify-start items-center space-x-4">
            {renderList.map((chart, index) => (
              <div
                key={chart.id}
                className={`flow-item flex flex-col items-center cursor-pointer`}
                onClick={() => handleClick(chart)}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <img
                  className="chart-img" // 添加这个类名
                  src={chart.templateImageUrl}
                  style={{
                    width: "130px",
                    height: "130px"
                  }}
                ></img>
                <p className="mt-2 chatName">{chart.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

export default FlowChartPreview
