import { useCallback, useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react"
import { v4 as uuidv4 } from "uuid"
import { Row, Col, Input, Button, message } from "antd"
import { PlusSquareOutlined, CheckOutlined, CloseOutlined } from "@ant-design/icons"
import Iconfont from "@/components/Icon"
import { cancelBubble } from "@/utils"
import styles from "./index.module.scss"

export const addPrefix = "add_id_"

const numberToChinese = (number) => {
  const chineseNumbers = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"]
  const digits = number.toString().split("").map(Number)
  const chineseDigits = digits.map((digit) => chineseNumbers[digit])
  return chineseDigits.join("")
}

const checkDuplicateName = (tree, id, name, fieldNames) => {
  let isDuplicate = false
  for (let item of tree) {
    if (item[fieldNames?.name] === name && item[fieldNames?.value] !== id) {
      isDuplicate = true
      break
    } else if (item[fieldNames?.children]?.length > 0) {
      isDuplicate = checkDuplicateName(item[fieldNames.children], id, name, fieldNames)
    }
  }
  return isDuplicate
}

const HierarchySetting = (
  {
    onAdd: onAddData,
    rowList = new Array(3).fill(0).map((_, index) => ({
      label: `${numberToChinese(index + 1)}级分层`
    })),
    fieldNames = {
      name: "name",
      value: "id",
      children: "childIntentionLevelVOS"
    },
    disabled = false
  },
  ref
) => {
  const [relationTree, setRelationTree] = useState([])
  const [editTypeObj, setEditTypeObj] = useState({})
  const [currentLevels, setCurrentLevels] = useState([])
  const isEditRef = useRef(false)

  useImperativeHandle(ref, () => ({
    setRelationTree,
    setEditTypeObj,
    setCurrentLevels,
    relationTree,
    getIsEdit: () => isEditRef.current
  }))

  useEffect(() => {
    isEditRef.current = !!Object.values(editTypeObj).some(({ open }) => open)
  }, [editTypeObj])

  const changeCurrentLevels = useCallback((index, id) => {
    setCurrentLevels((preState) => {
      if (index === 0) return [id]
      if (index === 1) return [preState?.[0], id]
      if (index === 2) return [preState?.[0], preState?.[1], id]
    })
  }, [])

  const findChildList = useCallback(
    (tree, index) => {
      let childIntentionLevelVOS = null
      for (let i = 0; i < index; i++) {
        childIntentionLevelVOS =
          (childIntentionLevelVOS ? childIntentionLevelVOS : tree)?.find(
            (item) => item?.[fieldNames?.value] === currentLevels[i]
          )?.[fieldNames?.children] || []
      }
      return childIntentionLevelVOS
    },
    [currentLevels, fieldNames]
  )

  const getTreeData = useCallback(
    (index) => {
      if (index === 0) return relationTree
      return findChildList(relationTree, index)
    },
    [findChildList, relationTree]
  )

  const changeRelationTree = useCallback(
    (id, value, index) => {
      setRelationTree((preState) => {
        const resChildList = index === 0 ? preState : findChildList(preState, index)
        const cIndex = resChildList.findIndex((item) => item?.[fieldNames?.value] === id)
        resChildList[cIndex] = { ...resChildList[cIndex], ...value }
        return [...preState]
      })
    },
    [fieldNames, findChildList]
  )

  const changeCurrentLevel = useCallback((id, data) => {
    setEditTypeObj((preState) => ({
      ...preState,
      [id]: {
        ...(preState[id] || {}),
        ...(data || {})
      }
    }))
  }, [])

  const onAdd = useCallback(
    (index) => {
      if (index > 0 && !currentLevels[index - 1]) return
      if (isEditRef.current) {
        message.warning("请先确定当前编辑内容！")
        return
      }
      const id = addPrefix + uuidv4()
      changeCurrentLevel(id, {
        open: true
      })
      setRelationTree((preState) => {
        const resChildList = index === 0 ? preState : findChildList(preState, index)
        const parentData =
          index - 1 > 0
            ? findChildList(preState, index - 1)?.find(
                (item) => currentLevels[index - 1] === item?.[fieldNames?.value]
              )
            : preState?.find((item) => currentLevels[index - 1] === item?.[fieldNames?.value])
        onAddData?.({ resChildList, id, index, parentData })
        return [...preState]
      })
      changeCurrentLevels(index, id)
    },
    [changeCurrentLevel, changeCurrentLevels, currentLevels, findChildList, onAddData, fieldNames]
  )

  const onCancel = useCallback(
    (id, index) => {
      id.startsWith(addPrefix) &&
        setRelationTree((preState) => {
          const resChildList = index === 0 ? preState : findChildList(preState, index)
          const cIndex = resChildList.findIndex((item) => item?.[fieldNames?.value] === id)
          if (!resChildList[cIndex]?.[fieldNames?.name]) {
            resChildList.splice(cIndex, 1)
            changeCurrentLevels(index)
          }
          return [...preState]
        })
      changeCurrentLevel(id, {
        open: false
      })
    },
    [changeCurrentLevel, changeCurrentLevels, findChildList, fieldNames]
  )

  return (
    <Row className={styles["level-row"]}>
      {rowList?.map(({ label }, index) => {
        return (
          <Col key={index} span={24 / (rowList.length || 1)} className={styles["level-col"]}>
            <h1>
              {label}
              {!disabled && (
                <PlusSquareOutlined
                  style={
                    index > 0 &&
                    (!currentLevels[index - 1] ||
                      getTreeData(0)?.find(
                        (item) => item?.[fieldNames?.value] === currentLevels[0]
                      )?.[fieldNames?.name] === "通用")
                      ? { pointerEvents: "none", color: "#ccc" }
                      : {}
                  }
                  onClick={() => onAdd(index)}
                />
              )}
            </h1>
            <ul>
              {getTreeData(index)?.map((item) => {
                return (
                  <li
                    key={item?.[fieldNames?.value]}
                    className={
                      currentLevels[index] === item?.[fieldNames?.value] &&
                      styles["level-item-active"]
                    }
                    style={
                      item?.[fieldNames?.name] === "通用" &&
                      currentLevels[index] === item?.[fieldNames?.value]
                        ? { pointerEvents: "none" }
                        : {}
                    }
                    onClick={() => {
                      if (isEditRef.current && currentLevels[index] !== item?.[fieldNames?.value]) {
                        message.warning("请先确定当前编辑内容！")
                        return
                      }
                      changeCurrentLevels(index, item?.[fieldNames?.value])
                    }}
                  >
                    {editTypeObj?.[item?.[fieldNames?.value]]?.open ? (
                      <>
                        <Input
                          placeholder="请输入"
                          value={editTypeObj?.[item?.[fieldNames?.value]]?.currentName}
                          onChange={(e) =>
                            changeCurrentLevel(item?.[fieldNames?.value], {
                              currentName: e.target.value
                            })
                          }
                          onClick={cancelBubble}
                        />
                        <Button
                          style={{ margin: "0 5px" }}
                          size="small"
                          type="link"
                          onClick={() => {
                            const name =
                              editTypeObj?.[item?.[fieldNames?.value]]?.currentName?.trim()
                            if (!name) return
                            const isDuplicate = checkDuplicateName(
                              relationTree,
                              item?.[fieldNames?.value],
                              name,
                              fieldNames
                            )
                            if (isDuplicate) {
                              message.warning("目录名已存在！")
                              return
                            }
                            if (name === "通用") {
                              message.warning("目录名不能设置为通用！")
                              return
                            }
                            changeRelationTree(
                              item?.[fieldNames?.value],
                              {
                                [fieldNames?.name]: name
                              },
                              index
                            )
                            changeCurrentLevel(item?.[fieldNames?.value], {
                              open: false
                            })
                          }}
                          icon={<CheckOutlined />}
                        />
                        <Button
                          size="small"
                          type="link"
                          style={{ margin: 0 }}
                          onClick={(e) => {
                            cancelBubble(e)
                            onCancel(item?.[fieldNames?.value], index)
                          }}
                          danger
                          icon={<CloseOutlined />}
                        />
                      </>
                    ) : (
                      <p>
                        <i className="truncate" title={item?.[fieldNames?.name]}>
                          {item?.[fieldNames?.name]}
                        </i>
                        {item?.[fieldNames?.name] !== "通用" && !disabled && (
                          <Iconfont
                            type="icon-icon-14bianji"
                            onClick={() => {
                              if (
                                isEditRef.current ||
                                currentLevels[index] !== item?.[fieldNames?.value]
                              )
                                return
                              changeCurrentLevel(item?.[fieldNames?.value], {
                                currentName: item?.[fieldNames?.name],
                                open: true
                              })
                            }}
                          />
                        )}
                      </p>
                    )}
                  </li>
                )
              })}
            </ul>
          </Col>
        )
      })}
    </Row>
  )
}

export default forwardRef(HierarchySetting)
