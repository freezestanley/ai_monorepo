import MDEditor from "@uiw/react-md-editor"
import AIOptimize from "@/components/AIOptimize"

const DetailEditor = ({
  onOptimizeSubmit,
  onEditorBlur,
  markdownContent,
  setMarkdownContent,
  agentNo,
  disabled,
  isV2 = false
}) => {
  return (
    <>
      <div
        className={`detail-editor-container min-w-[300px] py-[20px] pl-[10px] pr-[10px] ${isV2 ? "w-[100%] max-w-[100%]" : "w-[50%] max-w-[500px]"}`}
      >
        <div className="flex items-center justify-between pb-[10px]">
          <span className="text-[14px] text-[#475467] font-[500] pl-[8px]">
            {isV2 ? "调试-人设与逻辑回复" : "人设与逻辑回复"}
          </span>
          <span className="text-[14px] text-[#475467] font-[400]">
            <AIOptimize
              originalPrompt={markdownContent}
              intelligentAgentType="AGENT"
              intelligentAgentNo={agentNo}
              onSubmit={onOptimizeSubmit}
              disabled={disabled}
            />
          </span>
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-lg">
            <MDEditor
              value={markdownContent}
              onChange={setMarkdownContent}
              onBlur={onEditorBlur}
              preview={disabled ? "preview" : "edit"}
              hideToolbar={true}
              height={isV2 ? "calc(50vh - 200px)" : "calc(100vh - 200px)"}
              style={{
                backgroundColor: "#fff",
                border: "none"
              }}
              textareaProps={{
                placeholder: "在这里输入角色与逻辑回复的内容...",
                style: {
                  backgroundColor: "#fff",
                  fontSize: "14px",
                  color: "#475467"
                }
              }}
            />
          </div>
        </div>
      </div>
      {isV2 ? "" : <div className="w-[1px] h-[calc(100vh-131px)] bg-[#E4E7EC]"></div>}
    </>
  )
}

export default DetailEditor
