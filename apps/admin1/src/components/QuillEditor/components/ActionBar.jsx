function ActionBar({ showMain, onRewrite, onTranslate, style }) {
  return (
    <div style={style} className="action-bar-wrapper">
      {showMain ? (
        <>
          <button onClick={() => onRewrite("fix")} className="action-item" role="button">
            改写
          </button>
          <button onClick={() => onRewrite("continue")} className="action-item" role="button">
            续写
          </button>
          <button onClick={onTranslate} className="action-item" role="button">
            翻译
          </button>
        </>
      ) : null}
    </div>
  )
}

export default ActionBar
