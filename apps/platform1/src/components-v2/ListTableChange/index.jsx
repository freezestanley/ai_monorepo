import { useEffect } from "react"
import { Spin, Row, Col } from "antd"
import { useInView } from "react-intersection-observer"
import ResourceCard from "@/components-v2/ResourceCard"
import Table from "@/components-v2/Table"
import ChooseBotModal from "@/components-v2/ChooseBotModal"
import CustomEmpty from "@/antd-styles/components/CustomEmpty"
import Skeleton from "../Skeleton"

const ListTableChange = ({
  viewMode,
  list,
  loading,
  onClick,
  isFetchingNextPage,
  resourceCardProps = {},
  tableProps = {},
  fetchNextPage,
  isChooseBotVisible,
  setIsChooseBotVisible,
  onChooseBotSumbmit
}) => {
  // 当前是否滚动到底部
  const { ref, inView } = useInView({
    threshold: 0
  })

  useEffect(() => {
    if (inView) {
      fetchNextPage?.()
    }
  }, [inView, fetchNextPage])

  return (
    <Spin spinning={loading}>
      <div className="mb-[40px]">
        {viewMode === "card" ? (
          <>
            {list?.length && !loading ? (
              <Row gutter={[32, 32]}>
                {list.map((item, i) => {
                  return (
                    <Col xs={24} md={12} lg={8} key={item.id}>
                      <ResourceCard
                        item={item}
                        i={i}
                        onClick={() => onClick(item)}
                        {...resourceCardProps}
                      />
                    </Col>
                  )
                })}
              </Row>
            ) : (
              <>
                {!loading && !list?.length && (
                  <div className="my-[50px]">
                    <CustomEmpty />
                  </div>
                )}
                {loading && <Skeleton />}
              </>
            )}
          </>
        ) : (
          <Table dataSource={list} loading={loading} {...tableProps} />
        )}
        {isFetchingNextPage && (
          <div className="text-center py-4">
            <Spin size="small" />
            <span className="ml-2">加载更多...</span>
          </div>
        )}
        <div ref={ref} style={{ height: 20 }} /> {/* 用于检测滚动到底部 */}
      </div>
      {!!setIsChooseBotVisible && (
        <ChooseBotModal
          open={isChooseBotVisible}
          onClose={() => setIsChooseBotVisible?.(false)}
          onOk={onChooseBotSumbmit}
        />
      )}
    </Spin>
  )
}

export default ListTableChange
