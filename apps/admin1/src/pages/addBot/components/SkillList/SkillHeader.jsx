import { useState, useCallback, useRef } from "react"
import { Button, Row, Col, Space, Input, Select, Segmented } from "antd"
import {
  PlusOutlined,
  CloseOutlined,
  SearchOutlined,
  AppstoreOutlined,
  UnorderedListOutlined
} from "@ant-design/icons"
import Tooltip from "antd/lib/tooltip"
import { useNavigate } from "react-router-dom"
import { useEffect } from "react"

import Iconfont from "@/components/Icon"
import { debounce, keys } from "lodash"
import NiceModal from "@ebay/nice-modal-react"
import { GroupModal } from "../GroupModal"
import { AscOrder } from "@/components/AscOrderIcon"
import { useStudioPublishData } from "@/hooks/useStudioPublishData"
import { SKILL_TYPES } from "./index"
import "../SkillList.scss"

const SkillHeader = ({
  iframeStyle,
  currentBotNo,
  skillData,
  groupList,
  setFilterValue,
  setIsComposing,
  setFilterType,
  isAscOrder,
  setIsAscOrder,
  setFilterInputValue,
  setSkillStepVisible,
  getGroupList,
  saveFilterState,
  filterValue,
  filterInputValue,
  filterType,
  viewMode,
  setViewMode
}) => {
  const navigate = useNavigate()
  const [selectSkillsOfGroupKeys, setSelectSkillsOfGroupKeys] = useState([])

  // 添加本地输入状态管理
  const [localInputValue, setLocalInputValue] = useState(filterInputValue)
  const [isComposingLocal, setIsComposingLocal] = useState(false)

  // 创建稳定的防抖函数引用
  const debouncedSearch = useRef(
    debounce((value) => {
      setFilterInputValue(value)
    }, 300)
  ).current

  const { studioenv, isOpenVersion } = useStudioPublishData()

  // 同步外部 filterInputValue 到本地状态
  useEffect(() => {
    setLocalInputValue(filterInputValue)
  }, [filterInputValue])

  // 组件卸载时清理防抖函数
  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  const onCompositionStart = useCallback(() => {
    setIsComposingLocal(true)
    setIsComposing(true)
  }, [setIsComposing])

  const onCompositionEnd = useCallback(
    (e) => {
      setIsComposingLocal(false)
      setIsComposing(false)

      // 中文输入结束后，立即触发搜索
      const value = e.target.value?.trim() || ""
      setLocalInputValue(value)
      debouncedSearch(value)
    },
    [setIsComposing, debouncedSearch]
  )

  // 优化的输入处理函数
  const onSearchInputChange = useCallback(
    (e) => {
      const rawValue = e.target.value || ""
      setLocalInputValue(rawValue)

      // 如果不在中文输入过程中，执行防抖搜索
      if (!isComposingLocal) {
        const trimmedValue = rawValue.trim()
        debouncedSearch(trimmedValue)
      }
    },
    [isComposingLocal, debouncedSearch]
  )

  // 清除搜索内容
  const handleClearSearch = useCallback(() => {
    setLocalInputValue("")
    setFilterInputValue("")
    debouncedSearch.cancel() // 取消待执行的防抖函数
  }, [setFilterInputValue, debouncedSearch])

  useEffect(() => {
    if (!skillData?.skillList) return
    const skillsOfGroup = skillData?.skillList?.reduce((acc, current) => {
      // 获取当前对象的 c 值
      const cValue = current.groupTagName || "未分组"

      // 如果 acc 中没有该 c 值的数组，则初始化一个
      if (!acc[cValue]) {
        acc[cValue] = []
      }

      // 将当前对象推送到对应 c 值的数组中
      acc[cValue].push(current)

      return acc
    }, {})

    const originalSkillsOfGroupKeys = keys(skillsOfGroup)
    // skillsOfGroupKeys.sort((a, b) => (b === "未分组" ? -1 : 0))
    const skillsOfGroupKeys = groupList
      ?.map((item) => {
        if (originalSkillsOfGroupKeys.includes(item.tagDesc)) {
          return item.tagDesc
        }
        return null
      })
      .filter(Boolean)
    skillsOfGroupKeys.unshift("全部分组")
    skillsOfGroupKeys.push("未分组")
    // const skillsOfGroupKeys = keys(skillsOfGroup)

    // skillsOfGroupKeys.sort((a, b) => (b === "未分组" ? -1 : 0))
    // skillsOfGroupKeys.unshift("全部")
    setSelectSkillsOfGroupKeys(skillsOfGroupKeys)
  }, [skillData, groupList])

  const goToConstantsPage = () => {
    saveFilterState && saveFilterState()

    if (iframeStyle) {
      navigate(
        `/app/bot/constants?botNo=${currentBotNo}&isIframe=${iframeStyle}&studioenv=${studioenv || ""}`
      )
    } else {
      navigate(`/botConstants?botNo=${currentBotNo}&isIframe=${iframeStyle}`)
    }
  }

  const onSearchChange = (value) => {
    setFilterValue(value)
  }

  const handleToggleSort = () => {
    setIsAscOrder(!isAscOrder)
  }

  const handleGroupTap = () => {
    NiceModal.show(GroupModal, { botNo: currentBotNo, groupList, getGroupList })
  }

  const handleSearch = () => {
    // Implementation of handleSearch function
  }

  return (
    <div className="bg-white flex justify-between">
      <div>
        <Button
          type="primary"
          className="h-[36px]"
          icon={<PlusOutlined />}
          disabled={isOpenVersion && studioenv !== "dev"}
          onClick={() => {
            setSkillStepVisible(true)
          }}
        >
          创建
        </Button>

        <Button className="h-[36px] ml-[16px]" onClick={goToConstantsPage}>
          全局常量
        </Button>
      </div>
      <Row className="header" justify="space-between items-center">
        <Col>
          <div className="mr-[25px] flex items-center">
            <Tooltip placement="bottom" title={isAscOrder ? "按更新时间降序" : "按更新时间升序"}>
              <AscOrder
                onClick={handleToggleSort}
                isAsc={isAscOrder}
                className={`cursor-pointer mr-[25px] size-[14px]`}
              />
            </Tooltip>

            <Tooltip placement="bottom" title="打开分组管理">
              <Iconfont
                className="size-[16px] text-[#475467] hover:text-[#7F56D9]"
                type={"icon-fenzuguanli"}
                onClick={handleGroupTap}
              />
            </Tooltip>
          </div>
        </Col>
        <div className="w-[1px] h-[12px] bg-[#CACFD8] -ml-[10px] mr-[15px]"></div>

        <Col className="flex items-center">
          {/* 视图模式切换 */}
          <Segmented
            value={viewMode}
            onChange={setViewMode}
            className="mr-4"
            options={[
              {
                value: "grid",
                icon: <AppstoreOutlined />
                // label: '卡片视图'
              },
              {
                value: "list",
                icon: <UnorderedListOutlined />
                // label: '列表视图'
              }
            ]}
          />

          <Select
            value={filterValue}
            showSearch
            className={`expand-search-style`}
            onChange={onSearchChange}
            placeholder="筛选分组名称"
            // size="large"
            options={selectSkillsOfGroupKeys.map((item) => ({
              value: item,
              label: item
            }))}
          />

          <Select
            value={filterType}
            className={`expand-search-style ml-2`}
            onChange={(value) => setFilterType(value)}
            placeholder="筛选工作流类型"
            options={[
              { value: "全部", label: "全部类型" },
              {
                value: "1",
                label: SKILL_TYPES.find((type) => type.key === "1")?.label
              },
              {
                value: "2",
                label: SKILL_TYPES.find((type) => type.key === "2")?.label
              },
              { value: "3", label: SKILL_TYPES.find((type) => type.key === "3")?.label }
            ]}
          />

          <Input
            className="style-input"
            placeholder="搜索工作流名称/描述/工作流编号"
            value={localInputValue}
            onChange={onSearchInputChange}
            onCompositionStart={onCompositionStart}
            onCompositionEnd={onCompositionEnd}
            onPressEnter={handleSearch}
            suffix={
              <SearchOutlined
                style={{ color: "#bfbfbf", cursor: "pointer" }}
                onClick={handleSearch}
              />
            }
          />

          {/* <span onClick={handleSearch} className="header-search-icon cursor-pointer">
            <i className="iconfont icon-sousuo1"></i>
          </span> */}
        </Col>
      </Row>
    </div>
  )
}

export default SkillHeader
