export const httpMethodOptions = [
  {
    label: "GET",
    value: "GET"
  },
  {
    label: "POST",
    value: "POST"
  },
  {
    label: "PUT",
    value: "PUT"
  },
  {
    label: "DELETE",
    value: "DELETE"
  },
  {
    label: "PATCH",
    value: "PATCH"
  }
]

/**
 * 字段类型String、Integer、Number、Boolean
 */

export const fieldTypeOptions = [
  {
    value: "string",
    label: "字符串"
  },
  {
    value: "boolean",
    label: "布尔值"
  },
  {
    value: "int",
    label: "整型"
  },
  {
    value: "float",
    label: "浮点类型"
  },
  {
    value: "json",
    label: "对象"
  },
  {
    value: "array",
    label: "数组"
  }
]

/***
 * 字段类型String、Integer、Number、Boolean、json、Array
 */
export const outputFieldTypeOptions = [
  {
    value: "string",
    label: "字符串"
  },
  {
    value: "boolean",
    label: "布尔值"
  },
  {
    value: "int",
    label: "整型"
  },
  {
    value: "float",
    label: "浮点类型"
  },
  {
    value: "json",
    label: "对象"
  },
  {
    value: "array",
    label: "数组"
  }
]

/**
 * 传入方法：Body、Path、Query、Header
 */

export const inputMethodOptions = [
  {
    label: "Body",
    value: "Body"
  },
  {
    label: "Path",
    value: "Path"
  },
  {
    label: "Query",
    value: "Query"
  },
  {
    label: "Header",
    value: "Header"
  }
]
