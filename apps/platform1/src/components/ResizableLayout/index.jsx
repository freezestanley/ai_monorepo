import { Allotment } from "allotment"
import { memo } from "react"
import classNames from "classnames"

import "allotment/dist/style.css"
import styles from "./index.module.scss"

const ResizableLayout = ({
  className,
  mainContent,
  sideContent,
  defaultMainWidth,
  defaultSideWidth,
  minMainWidth,
  minSideWidth,
  maxSideWidth,
  sideVisible
}) => {
  return (
    <Allotment
      className={classNames(styles.resizableLayout, className)}
      defaultSizes={[defaultMainWidth, defaultSideWidth]}
    >
      <Allotment.Pane preferredSize={defaultMainWidth} minSize={minMainWidth}>
        {mainContent}
      </Allotment.Pane>
      {sideVisible && (
        <Allotment.Pane
          preferredSize={defaultSideWidth}
          minSize={minSideWidth}
          maxSize={maxSideWidth}
        >
          {sideContent}
        </Allotment.Pane>
      )}
    </Allotment>
  )
}

export default memo(ResizableLayout)
