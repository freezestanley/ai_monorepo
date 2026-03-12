import { Button, Input, Select } from "antd"
import "./index.scss"

const Search = Input.Search
const Option = Select.Option

function RewriteOptions({ onApply, onCancel, onSelect, onContentChange, content, style }) {
  return (
    <div
      style={style}
      className="flex rewrite-options"
      // ref={containerRef}
    >
      <Search
        type="text"
        value={content}
        placeholder="或输入自定义内容"
        onChange={onContentChange}
        style={{ marginRight: 10 }}
      />
      <div className="rewrite-options-action">
        <Select
          className="style"
          placeholder="选择"
          style={{ width: 150, marginRight: 10 }}
          onChange={onSelect}
        >
          <Option value="正式的语气">正式</Option>
          <Option value="口语的语气">口语</Option>
          <Option value="疑问的句式">疑问</Option>
        </Select>
        <Button type="primary" onClick={onApply} style={{ marginRight: 10 }}>
          应用
        </Button>
        <Button type="primary" onClick={onCancel}>
          取消
        </Button>
      </div>
    </div>
  )
}

export default RewriteOptions
