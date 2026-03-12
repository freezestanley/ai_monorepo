import { getByPath, removeByPath, setByPath } from "@/api/tools"
import RecursiveInput from "./RecursiveInput"

const RecursiveInputList = ({
  varOptions,
  value = [{}],
  needDescInput = false,
  onChange,
  name,
  form
}) => {
  const baseData = {
    variableName: "",
    variableValueType: "string",
    variableRequire: false,
    inputParams: undefined,
    children: []
  }

  const handleOperation = (operation, path, extra = {}) => {
    let newValue = [...value] // 假设value是当前组件的状态或者props中传递的值数组
    switch (operation) {
      case "addSibling":
        // 为了添加兄弟节点，我们需要获取父级列表
        var parentList = getByPath(newValue, path.slice(0, -1)) // 获取父级列表
        parentList.splice(path[path.length - 1] + 1, 0, baseData) // 添加一个新兄弟节点
        break
      case "addChild":
        var currentItem = getByPath(newValue, path) // 获取当前项目
        currentItem.children = currentItem.children || [] // 确保children属性存在
        currentItem.children.push(extra.newChild || baseData) // 添加一个新子节点
        break
      case "remove":
        newValue = removeByPath(newValue, path) // 删除指定路径的元素
        break
      case "update":
        newValue = setByPath(newValue, path, extra.updatedItem) // 更新指定路径的元素
        break
      default:
        break
    }
    onChange(newValue) // 调用onChange回调来更新上层组件的状态
  }
  return (
    <div>
      <p className="mb-3 ml-3" style={{ color: "red" }}>
        以下定义的是JSON的属性
      </p>
      {value?.map((item, index) => (
        <div className="flex" key={index}>
          <RecursiveInput
            index={index}
            form={form}
            name={name}
            key={`${index}`}
            data={item}
            path={[index]}
            onOperation={handleOperation}
            varOptions={varOptions}
            needDescInput={needDescInput}
            parentType={undefined}
            len={value.length}
          />
        </div>
      ))}
    </div>
  )
}

export default RecursiveInputList
