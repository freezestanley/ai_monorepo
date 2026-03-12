/*
 * @Author: Dyton
 * @Date: 2024-04-19 15:32:39
 * @Descripttion:
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2024-04-24 11:06:59
 * @FilePath: /za-aigc-platform-admin-static/src/pages/market/components/TableObjectPro/constants.jsx
 * Copyright (c) 2024 by ZA-智能中台, All Rights Reserved.
 */

export const paramsTypesOptions = [
  {
    label: "String",
    value: "String"
  },
  {
    label: "Integer",
    value: "Integer"
  },
  {
    label: "Number",
    value: "Number"
  },
  {
    label: "Array",
    value: "Array"
  },
  {
    label: "Object",
    value: "Object"
  },
  {
    label: "Boolean",
    value: "Boolean"
  }
]

export const arrayTypOptions = [
  {
    label: "Array<String>",
    value: "Array<String>"
  },
  {
    label: "Array<Integer>",
    value: "Array<Integer>"
  },
  {
    label: "Array<Number>",
    value: "Array<Number>"
  },
  {
    label: "Array<Object>",
    value: "Array<Object>"
  },
  {
    label: "Array<Boolean>",
    value: "Array<Boolean>"
  }
]

export const defaultData = {
  variableName: "",
  variableDesc: "",
  variableRequire: true,
  variableValueType: "String"
}
export const defaultArrayChildData = {
  variableName: "",
  variableDesc: "",
  variableRequire: true,
  variableValueType: "Array<String>"
}
