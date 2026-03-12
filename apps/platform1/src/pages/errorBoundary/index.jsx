import React from "react"
import { Result } from "antd"
import Error from "@/assets/img/error.png"
import "./index.scss"

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    console.log(error)
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.log(error, errorInfo)
    this.setState({ error: error, errorInfo: errorInfo })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="errorboundary-wrapper">
          <br />
          <Result status="error" title="页面出错了" subTitle="请联系管理员" />
          <div className="flex justify-center">
            {this.state.error && this.state.error.toString()} <br />
          </div>
          <div className="flex justify-center">{this.state.errorInfo?.componentStack}</div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
