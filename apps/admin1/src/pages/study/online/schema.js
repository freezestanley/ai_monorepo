export const getSchema = () => {
  return {
    type: "object",
    properties: {
      taskNo: {
        title: "任务编号",
        type: "string",
        "x-component": "Input",
        "x-component-props": {
          placeholder: "请输入任务编号"
        }
      },
      name: {
        title: "任务名称",
        type: "string",
        "x-component": "Input",
        "x-component-props": {
          placeholder: "请输入任务名称"
        }
      }
    }
  }
}
