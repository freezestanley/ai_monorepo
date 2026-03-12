import { useSaveTool, useSaveInputVariables, useSaveOutputVariables } from "@/api/pluginTool"
import { Space, Button, message } from "antd"
import queryString from "query-string"
import { useStudioPublishData } from "@/hooks/useStudioPublishData"

function attachValuesToTree(values, tree) {
  const toStr = (k) => (typeof k === "string" ? k : String(k))

  const mapNode = (node) => {
    if (!node) return null

    const id = toStr(node.rowId)
    const data = values[id] ?? {} // 数据用 values 的，如果没有则为空对象 // 合并：以 values 为主，保留 rowId
    const merged = { id, rowId: id, parentKey: node.parentKey, ...data }

    //递归 children
    if (Array.isArray(node.children) && node.children.length) {
      const mappedChildren = node.children.map(mapNode).filter(Boolean)
      if (mappedChildren.length) {
        merged.children = mappedChildren
      }
    }

    return merged
  }

  return Array.isArray(tree) ? tree.map(mapNode) : []
}

function FooterHandle({
  current,
  total,
  form,
  pluginNo,
  toolNo,
  setCurrent,
  queryParams,
  navigate,
  location,
  botNo,
  outputParamsRef,
  inputParamsRef,
  isViewPage
}) {
  const hasNext = current < total - 1
  const hasPrev = current > 0
  const { mutate: saveTool } = useSaveTool()
  const { mutate: saveInputVariables } = useSaveInputVariables()
  const { mutate: saveOutputVariables } = useSaveOutputVariables()
  const { type = "NORMAL", mcpToolNo } = queryParams
  const { studioenv } = useStudioPublishData()

  const handleSubmit = () => {
    if (current === 3) {
      submitDebug()
      return
    }
    if (isViewPage) {
      handleNext()
      return
    }
    form.validateFields().then((values) => {
      console.log(values)
      switch (current) {
        case 0:
          submitBasicInfo(values)
          break
        case 1:
          submitInputParams(values)
          break
        case 2:
          submitOutputParams(values)
          break
        default:
          break
      }
      // handleNext()
    })
  }

  const submitBasicInfo = (values) => {
    saveTool(
      {
        ...values,
        pluginNo,
        toolNo: toolNo ?? "",
        botNo,
        type: values.type || type,
        mcpToolNo: type === "MCP" ? mcpToolNo : undefined
      },
      {
        onSuccess: (e) => {
          if (e.success === true) {
            message.info(e.message)
            handleNext({ toolNo: e.data })
          } else {
            message.error(e.message)
          }
        },
        onError: (e) => {
          message.error(e.message)
        }
      }
    )
  }
  const submitInputParams = (values) => {
    const dataArray = attachValuesToTree(values, inputParamsRef.current?.getValues())
    console.log("保存输入参数:", { values, type, mcpToolNo })
    saveInputVariables(
      {
        pluginNo,
        toolNo,
        variables: dataArray,
        type,
        mcpToolNo: type === "MCP" ? mcpToolNo : undefined
      },
      {
        onSuccess: (e) => {
          if (e.success === true) {
            message.info(e.message)
            handleNext()
          } else {
            message.error(e.message)
          }
        },
        onError: (e) => {
          message.error(e.message)
        }
      }
    )
  }

  const submitOutputParams = (values) => {
    form.validateFields().then(() => {
      const formData = outputParamsRef.current.getValues()
      console.log("保存输出参数:", { formData, type, mcpToolNo })
      saveOutputVariables(
        {
          pluginNo,
          toolNo,
          variables: formData,
          type,
          mcpToolNo: type === "MCP" ? mcpToolNo : undefined
        },
        {
          onSuccess: (e) => {
            if (e.success === true) {
              message.info(e.message)
              if (e.data) {
                handleNext({ toolNo: e.data })
              } else {
                handleNext()
              }
            } else {
              message.error(e.message)
            }
          },
          onError: (e) => {
            message.error(e.message)
          }
        }
      )
    })
  }
  const submitDebug = () => {
    navigate(`/plugin/${pluginNo}?botNo=${botNo}&studioenv=${studioenv || ""}`)
  }

  const handleNext = (params = {}) => {
    if (current < 4) {
      const next = current + 1
      setCurrent(current)
      const updatedSearch = queryString.stringify({
        ...queryParams,
        step: next + 1,
        ...params
      })
      navigate(
        {
          ...location,
          search: updatedSearch
        },
        { replace: true }
      )
    }
  }

  const handlePrev = () => {
    if (current >= 1) {
      const prev = current - 1
      setCurrent(prev)
      const updatedSearch = queryString.stringify({
        ...queryParams,
        step: current
      })
      navigate(
        {
          ...location,
          search: updatedSearch
        },
        { replace: true }
      )
    }
  }

  return (
    <Space>
      {hasPrev && <Button onClick={handlePrev}>上一步</Button>}
      <Button onClick={handleSubmit} type="primary">
        {hasNext ? (isViewPage ? "下一步" : "保存并继续") : "完成"}
      </Button>
    </Space>
  )
}

export default FooterHandle
