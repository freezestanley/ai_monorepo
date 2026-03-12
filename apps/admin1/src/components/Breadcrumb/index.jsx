import React from "react"
import { Alert, Breadcrumb } from "antd"
import { HashRouter, Link, Route, Routes, useLocation } from "react-router-dom"
const Apps = () => (
  <ul className="app-list">
    <li>
      <Link to="/apps/1">Application1</Link>：<Link to="/apps/1/detail">Detail</Link>
    </li>
    <li>
      <Link to="/apps/2">Application2</Link>：<Link to="/apps/2/detail">Detail</Link>
    </li>
  </ul>
)
const breadcrumbNameMap = {
  "/apps": "Application List",
  "/apps/1": "Application1",
  "/apps/2": "Application2",
  "/apps/1/detail": "Detail",
  "/apps/2/detail": "Detail",
  "/data-statistics": "data-statistics"
}
const Home = () => {
  const location = useLocation()
  const pathSnippets = location.pathname.split("/").filter((i) => i)
  console.log(pathSnippets, location.pathname)
  const extraBreadcrumbItems = pathSnippets.map((_, index) => {
    const url = `/${pathSnippets.slice(0, index + 1).join("/")}`
    return {
      key: url,
      title: <Link to={url}>{breadcrumbNameMap[url]}</Link>
    }
  })
  const breadcrumbItems = [
    {
      title: <Link to="/">Home</Link>,
      key: "home"
    }
  ].concat(extraBreadcrumbItems)
  return (
    <div className="demo">
      <Breadcrumb items={breadcrumbItems} />
    </div>
  )
}
const App = () => <Home />
export default App
