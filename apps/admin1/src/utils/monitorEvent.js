// 六翼自定义事件上报
export const reportEvent = ({ eventName, userInfo, ...args }) => {
  const { name, companyName, adAccount, email, departmentName } = userInfo || {}
  window.__SERAPH_HAS_MONITOR__?.sendCustomEvent(
    {
      name: eventName,
      userName: name,
      userAdAccount: adAccount,
      userCompanyName: companyName,
      userEmail: email,
      userDepartment: departmentName,
      ...args
    },
    {
      defer: false
    }
  )
}
