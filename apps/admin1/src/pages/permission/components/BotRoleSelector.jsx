import React, { useState, useEffect, useCallback } from "react"
import { Select, Button, message, Popconfirm } from "antd"
import { MinusCircleOutlined, PlusCircleOutlined } from "@ant-design/icons"
import { useFetchBotAuthRole } from "@/api/batchTest"
import { fetchBotAuthRole } from "@/api/batchTest/api"

const BotRoleSelector = ({
  value = [{ bot: undefined, role: undefined, roleList: [] }],
  onChange,
  botList
}) => {
  const [botRoles, setBotRoles] = useState(value)
  const [init, setInit] = useState(false)

  useEffect(() => {
    if (
      botRoles.filter((item) => item.bot).length === 0 &&
      value.filter((item) => item.bot).length > 0
    ) {
      setBotRoles(value)
    }
  }, [botRoles, value])

  // 当 botRoles 中的 bot 改变时，获取新的 roleList
  useEffect(() => {
    if (!init) {
      botRoles.forEach((botRole, index) => {
        if (botRole.bot) {
          fetchBotAuthRole({ botNo: botRole.bot }).then((res) => {
            setBotRoles((currentBotRoles) => {
              if (currentBotRoles[index].bot === botRole.bot) {
                // 仅当 bot 未改变时更新 roleList
                const newBotRoles = [...currentBotRoles]
                newBotRoles[index].roleList = res
                return newBotRoles
              }
              return currentBotRoles
            })
          })
          setInit(true)
        }
      })
    }
  }, [botRoles, init]) // 依赖于 botRoles 中 bot 的变化

  const handleBotChange = useCallback(
    async (bot, index) => {
      setBotRoles((currentBotRoles) => {
        const newBotRoles = [...currentBotRoles]
        newBotRoles[index] = {
          ...newBotRoles[index],
          bot: bot,
          role: undefined,
          roleList: []
        }
        return newBotRoles
      })

      try {
        const res = await fetchBotAuthRole({ botNo: bot })
        setBotRoles((currentBotRoles) => {
          const newBotRoles = [...currentBotRoles]
          newBotRoles[index].roleList = res
          return newBotRoles
        })
      } catch (error) {
        console.error("Error fetching roles:", error)
      }
    },
    [fetchBotAuthRole]
  )

  const handleRoleChange = (role, index) => {
    const newBotRoles = [...botRoles]
    newBotRoles[index].role = role
    setBotRoles(newBotRoles)
    onChange(newBotRoles)
  }

  const addBotRole = () => {
    setBotRoles([...botRoles, { bot: undefined, role: undefined, roleList: [] }])
  }

  const removeBotRole = (index) => {
    const newBotRoles = botRoles.filter((_, i) => i !== index)
    setBotRoles(newBotRoles)
    onChange(newBotRoles)
  }

  return (
    <div>
      {botRoles.map((botRole, index) => (
        <div key={index} style={{ marginBottom: 10 }}>
          <Select
            style={{ width: "40%", marginRight: "5%" }}
            value={botRole.bot}
            onChange={(value) => handleBotChange(value, index)}
            placeholder="选择空间"
            showSearch
            filterOption={(input, option) => {
              return option.children.indexOf(input) >= 0
            }}
          >
            {botList.map((bot) => (
              <Select.Option key={bot.bizObjectNo} value={bot.bizObjectNo}>
                {bot.name}
              </Select.Option>
            ))}
          </Select>
          <Select
            style={{ width: "40%", marginRight: "5%" }}
            value={botRole.role}
            onChange={(value) => handleRoleChange(value, index)}
            placeholder="选择角色"
            disabled={!botRole.bot}
            showSearch
            filterOption={(input, option) => {
              return option.children.indexOf(input) >= 0
            }}
          >
            {/* 假设 roles 是根据 bot 获取的 */}
            {botRole?.roleList?.map((role) => (
              <Select.Option key={role.roleNo} value={role.roleNo}>
                {role.roleName}
              </Select.Option>
            ))}
          </Select>
          {botRoles.length > 1 && (
            <Popconfirm
              title="【删除】将导致该用户无法访问对应空间"
              onConfirm={() => removeBotRole(index)}
              okText="确定"
              cancelText="取消"
            >
              <MinusCircleOutlined />
            </Popconfirm>
          )}
        </div>
      ))}
      <Button type="link" icon={<PlusCircleOutlined />} onClick={addBotRole}>
        添加角色权限
      </Button>
    </div>
  )
}

export default BotRoleSelector
