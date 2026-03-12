import "./index.scss"

function CustomDivider({ children, showTopLine = false, style = {} }) {
  return (
    <div className="custom-divider-wrapper" style={style}>
      {showTopLine && <div className="custom-divider-top-line"></div>}
      <div className="custom-divider-title">{children}</div>
    </div>
  )
}

export default CustomDivider
