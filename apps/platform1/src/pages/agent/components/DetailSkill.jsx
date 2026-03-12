import { useState, useEffect, useMemo } from "react"
import { Input, Dropdown, Tooltip } from "antd"
import CustomEmpty from "@/antd-styles/components/CustomEmpty"

const DetailSkill = ({
  modelList,
  selectedModel,
  agentDetail,
  onDropClick,
  setSelectedModel,
  isOnlyRead
}) => {
  const [modelSearchText, setModelSearchText] = useState("")

  const filteredModelList = useMemo(() => {
    if (!modelSearchText) return modelList.filter((model) => model.supportToolCall)
    return modelList.filter(
      (model) =>
        model.supportToolCall && model.name.toLowerCase().includes(modelSearchText.toLowerCase())
    )
  }, [modelList, modelSearchText])

  // 当模型列表加载完成后，如果当前选择的模型不在列表中，则选择第一个模型
  useEffect(() => {
    if (filteredModelList && filteredModelList.length > 0 && agentDetail) {
      const modelExists = filteredModelList.some((model) => model.code === selectedModel)
      if (!modelExists) {
        setSelectedModel(filteredModelList[0].code)
      }
    }
  }, [filteredModelList, selectedModel, agentDetail])

  return (
    <Dropdown
      dropdownMatchSelectWidth={false}
      disabled={isOnlyRead}
      menu={{
        items: filteredModelList.map((model) => ({
          key: model.code,
          label: (
            <div className="flex items-center justify-between">
              <Tooltip title={model.name} placement="left">
                <div className="flex-1 w-[150px] truncate">{model.name}</div>
              </Tooltip>
              <div className="flex gap-1">
                {model.modalType?.map((type) => (
                  <span
                    key={type.code}
                    className={`px-2 py-0.5 text-xs rounded ${
                      type.code === "TEXT"
                        ? "bg-blue-50 text-gray-600"
                        : type.code === "IMAGE"
                          ? "bg-green-50 text-green-600"
                          : type.code === "VIDEO"
                            ? "bg-purple-50 text-purple-600"
                            : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {type.name}
                  </span>
                ))}
              </div>
            </div>
          ),
          style: model.code === selectedModel ? { backgroundColor: "#F9F5FF" } : {}
        })),
        onClick: (res) => onDropClick(res, filteredModelList),
        style: {
          maxHeight: "400px",
          overflowY: "auto"
        }
      }}
      overlayStyle={{
        width: "400px"
      }}
      dropdownRender={(menu) => (
        <div
          className="p-2 bg-white shadow-md rounded-[8px]"
          style={{ border: "1px solid #f8f8f8" }}
        >
          <div className="p-2 ">
            <Input
              placeholder="搜索模型"
              value={modelSearchText}
              onChange={(e) => setModelSearchText(e.target.value)}
              size="small"
              allowClear
            />
          </div>
          <div className="overflow-y-auto max-h-[400px] bg-white rounded-[0px]">
            {filteredModelList.length > 0 ? (
              menu
            ) : (
              <div className="py-[20px]">
                <CustomEmpty description="暂无支持工具调用的模型" />
              </div>
            )}
          </div>
        </div>
      )}
    >
      <div
        className={`${isOnlyRead ? "cursor-not-allowed" : "cursor-pointer hover:text-[#7f56d9]"} text-[14px] text-[#181B25] font-[400]  flex items-center group`}
      >
        <span className="mr-1 max-w-[300px] truncate">
          {filteredModelList.find((m) => m.code === selectedModel)?.name ||
            (filteredModelList.length > 0 ? filteredModelList[0].name : "请选择模型")}
        </span>
        <span className="ml-[8px] flex flex-col">
          <i className="iconfont icon-Up text-[10px] text-[#475467] font-[600] mt-[1px] group-hover:text-[#7f56d9]"></i>
          <i className="iconfont icon-Down text-[10px] text-[#475467] font-[600] -mt-[3px] group-hover:text-[#7f56d9]"></i>
          {/* <UpOutlined className="text-[10px] text-[#475467] font-[600] mt-[1px] group-hover:text-[#7f56d9]" />
            <DownOutlined className="text-[10px] text-[#475467] font-[600] -mt-[3px] group-hover:text-[#7f56d9]" /> */}
        </span>
      </div>
    </Dropdown>
  )
}

export default DetailSkill
