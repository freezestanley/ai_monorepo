// 统一处理组件的 后置处理参数
export const formatSessionParams = (globalData, sessions) => {
  const findGlobalData = (displayName) =>
    globalData?.find((option) => option.displayName === displayName)

  const sessionParams = sessions?.map((item) => {
    const globalDataItem = findGlobalData(item.globalVariable)
    return {
      ...globalDataItem,
      useType: "SESSION",
      valueIsFixed: !globalDataItem,
      valueExpression: item.valueExpression ? item.valueExpression : item.globalVariable,
      variableValueType: item.variable,
      variableName: item.variableName,
      variableNo: item.variableName
    }
  })
  return sessionParams
}
