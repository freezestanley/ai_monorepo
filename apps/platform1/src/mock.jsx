import Mock from "mockjs"

const domain = "/api/"

// 模拟login接口
Mock.mock(domain + "login", function () {
  let result = {
    code: 200,
    message: "OK",
    data: {
      loginUid: 10000,
      nickname: "兔子先生",
      token: "yyds2023"
    }
  }
  return result
})

// 用户列表数据模板
const userData = {
  "id|+1": 1,
  name: "@cname",
  email: "@email",
  address: "@county(true)",
  date: '@date("yyyy-MM-dd")'
}

// 模拟获取所有用户接口
Mock.mock(`${domain}users`, "get", () => {
  let result = {
    status: 200,
    message: "OK",
    data: Mock.mock({ "items|10": [userData] }).items
  }
  return result
})

// 模拟创建用户接口
Mock.mock(`${domain}users`, "post", (options) => {
  let result = {
    status: 200,
    message: "Created successfully.",
    data: JSON.parse(options.body)
  }
  return result
})
