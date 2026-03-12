// SuggestionPopover.js
import React from "react"
import { Popover, List } from "antd"

function SuggestionPopover(props) {
  const { suggestions, onSelect } = props

  return (
    <Popover
      content={
        <List
          dataSource={suggestions}
          renderItem={(variable) => (
            <List.Item onClick={() => onSelect(variable)}>
              {`${variable.valueExpression} ${
                variable.description ? `(${variable.description})` : ""
              }`}
            </List.Item>
          )}
        />
      }
      visible={suggestions.length > 0}
    >
      <div />
    </Popover>
  )
}

export default SuggestionPopover
