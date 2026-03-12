import { useState, useEffect, useMemo } from "react"
import {
  Button,
  List,
  Switch,
  Popconfirm,
  Tooltip,
  Modal,
  Form,
  Input,
  message,
  Space,
  Tag,
  Typography
} from "antd"
import {
  useFetchPageSharing,
  useDeleteDocumentSharding,
  useEditDocumentSharding,
  useCreateDocumentSharding
} from "@/api/knowledgeDocument"
import TagAddInput from "./TagAddInput"
import "./index.scss"

const DocSplitList = ({ visible, knowledgeBaseNo, currentData }) => {
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
  const [shardingNo, setShardingNo] = useState()
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [initData, setInitData] = useState(null)
  const [editForm] = Form.useForm()
  const { data, isLoading } = useFetchPageSharing(
    {
      knowledgeBaseNo,
      catalogNo: currentData?.catalogNo,
      documentNo: currentData?.documentNo,
      pageNum: pagination?.current ?? 1,
      pageSize: pagination?.pageSize ?? 10
    },
    {
      enabled: !!(knowledgeBaseNo && currentData?.catalogNo && currentData?.documentNo && visible)
    }
  )
  const { mutate: deleteDocumentSharding, isLoading: isDeleteLoading } = useDeleteDocumentSharding()
  const { mutate: editDocumentSharding, isLoading: isEditLoading } = useEditDocumentSharding()
  const { mutate: createDocumentSharding, isLoading: isCreateLoading } = useCreateDocumentSharding()

  const disabled = useMemo(() => currentData?.status === 8, [currentData?.status])

  useEffect(() => {
    if (!visible) {
      setPagination((preState) =>
        preState?.current === 1 && preState?.pageSize === 10
          ? preState
          : { current: 1, pageSize: 10 }
      )
      setShardingNo(undefined)
    }
  }, [visible])

  useEffect(() => {
    if (!isModalVisible) {
      editForm.resetFields()
      setInitData(null)
    }
  }, [editForm, isModalVisible])

  return (
    <div className="mr-[4px] bg-white h-[100%] rounded-tl-[8px] rounded-tr-[8px]">
      <div className="rag-flow-header flex justify-between items-center">
        <div>文档拆分预览</div>
        <Tooltip title="创建解析块">
          <Button
            type="primary"
            className="w-[36px] !p-0 text-[16px]"
            onClick={() => {
              setInitData(null)
              setShardingNo(undefined)
              setIsModalVisible(true)
            }}
          >
            +
          </Button>
        </Tooltip>
      </div>
      <List
        loading={isLoading}
        className="rag-flow-list"
        pagination={{
          size: "small",
          current: pagination?.current ?? 1,
          pageSize: pagination?.pageSize ?? 10,
          total: data?.total ?? 0,
          pageSizeOptions: [10, 20, 60, 100],
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page, pageSize) => {
            setPagination({ current: page, pageSize })
          }
        }}
        dataSource={data?.records}
        renderItem={(item) => (
          <List.Item>
            <List.Item.Meta
              title={
                <div className="flex justify-between items-center mb-[10px]">
                  <div className="flex items-center flex-1 overflow-hidden">
                    {[0, 1, 2].includes(item.buildStatus) && (
                      <>
                        <Tag
                          className="!rounded-[100px]"
                          bordered={false}
                          color={
                            item.buildStatus === 1
                              ? "success"
                              : item.buildStatus === 0
                                ? "error"
                                : "processing"
                          }
                        >
                          {item.buildStatusDesc}
                        </Tag>
                        {item.buildStatus === 0 && (
                          <Typography.Paragraph
                            className="text-[#ff4d4f] text-[12px] !m-0"
                            ellipsis={{
                              rows: 1,
                              tooltip:
                                "构建失败会导致该解析块无法被正常召回，可通过编辑解析块，重新提交构建"
                            }}
                          >
                            构建失败会导致该解析块无法被正常召回，可通过编辑解析块，重新提交构建
                          </Typography.Paragraph>
                        )}
                      </>
                    )}
                  </div>
                  <Space className="flex items-center" size={16}>
                    <Tooltip title={`${item.status === 8 ? "停用切片" : "启用切片"}`}>
                      <Switch
                        className="mt-[-2px]"
                        loading={isEditLoading}
                        onChange={(checked) =>
                          !disabled &&
                          editDocumentSharding({
                            knowledgeBaseNo,
                            catalogNo: item.catalogNo,
                            documentNo: item.documentNo,
                            shardingNo: item.shardingNo,
                            shardingContent: item.content,
                            status: checked ? 8 : 9
                          })
                        }
                        size="small"
                        checked={item.status === 8}
                        onClick={() => disabled && message.warning("文档已启用，不可操作")}
                      />
                    </Tooltip>
                    <Tooltip title={"编辑切片"}>
                      <Button
                        onClick={() => {
                          if (disabled) {
                            message.warning("文档已启用，不可操作")
                            return
                          }
                          setShardingNo(item.shardingNo)
                          editForm.setFieldsValue({
                            content: item.content,
                            importantKeywords: item.rsMetadata?.importantKwd,
                            questionKeywords: item.rsMetadata?.questionKwd
                          })
                          setInitData(item)
                          setIsModalVisible(true)
                        }}
                        type="link"
                        icon={<span className="iconfont icon-Edit" />}
                      />
                    </Tooltip>
                    <Popconfirm
                      title="是否确定删除该切片？"
                      okButtonProps={{ loading: isDeleteLoading }}
                      disabled={disabled}
                      onConfirm={() => {
                        !disabled &&
                          deleteDocumentSharding({
                            knowledgeBaseNo,
                            catalogNo: item.catalogNo,
                            documentNo: item.documentNo,
                            shardingNo: item.shardingNo
                          })
                      }}
                    >
                      <Tooltip title={"删除切片"}>
                        <Button
                          onClick={() => disabled && message.warning("文档已启用，不可操作")}
                          type="link"
                          icon={<span className="iconfont icon-shanchu1" />}
                        />
                      </Tooltip>
                    </Popconfirm>
                  </Space>
                </div>
              }
              description={item.content}
            />
          </List.Item>
        )}
      />
      <Modal
        title={`${initData ? "编辑" : "创建"} 解析块`}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        okText={"确认"}
        width={720}
        closable={false}
        confirmLoading={isEditLoading || isCreateLoading}
        onOk={async () => {
          const values = await editForm.validateFields()
          const curData =
            data?.records?.find((item) => item.shardingNo === shardingNo) || currentData
          ;(initData ? editDocumentSharding : createDocumentSharding)(
            {
              knowledgeBaseNo,
              catalogNo: curData?.catalogNo,
              documentNo: curData?.documentNo,
              shardingNo,
              shardingContent: values.content,
              status: curData?.status,
              importantKeywords: values.importantKeywords,
              questionKeywords: values.questionKeywords
            },
            {
              onSuccess: () => {
                setIsModalVisible(false)
                editForm.resetFields()
              }
            }
          )
        }}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            label="解析块"
            name="content"
            rules={[{ required: true, message: "请输入解析块" }]}
          >
            <Input.TextArea placeholder="请输入解析块" rows={10} />
          </Form.Item>
          <Form.Item label="关键词" name="importantKeywords">
            <TagAddInput
              initValue={initData?.rsMetadata?.importantKwd}
              onChange={(value) => editForm.setFieldsValue({ importantKeywords: value })}
            />
          </Form.Item>
          <Form.Item
            label="问题"
            name="questionKeywords"
            tooltip="如果有给定的问题，则块的嵌入将基于它们"
          >
            <TagAddInput
              initValue={initData?.rsMetadata?.questionKwd}
              onChange={(value) => editForm.setFieldsValue({ questionKeywords: value })}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default DocSplitList
