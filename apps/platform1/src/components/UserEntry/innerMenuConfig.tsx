import { Bot, Cpu, Radio, Store, Workflow, User, Users, GitBranch, BookOpen, Settings, Tag } from "lucide-react"
import Iconfont from "@/components/Icon"
import { isStudio } from "@/config.env"

interface MenuItem {
  key: string
  label: string
  path: string
  icon?: any
  group?: string
  resourceCode?: string | string[]
  children?: MenuItem[]
}

interface MenuGroup {
  title: string
  items: MenuItem[]
  skipPermission?: boolean
}

export interface MenuConfig {
  groups: MenuGroup[]
}

const QuickChatIcon = () => <Iconfont className="text-[20px]" type="icon-cebian-kuaisuwenda" />
const AgentsIcon = () => <Iconfont className="text-[20px]" type="icon-piliangceshi" />
const KnowledgeIcon = () => <Iconfont className="text-[20px]" type="icon-cebian-zhishiku" />
const VoiceIcon = () => <Iconfont className="text-[20px]" type="icon-zhinengyuyin" />
const DataIcon = () => <Iconfont className="text-[20px]" type="icon-cebian-shujuguanli" />
const MoreIcon = () => <Iconfont className="text-[20px]" type="icon-cebian-gengduo" />
const UserIcon = () => <User size={20} />
const RoleIcon = () => <Users size={20} />
const VersionIcon = () => <GitBranch size={20} />
const StudyIcon = () => <BookOpen size={20} />
const SettingsIcon = () => <Settings size={20} />
const TagIcon = () => <Tag size={20} />
const showVersionRelease = isStudio()

export const innerMenuConfig: MenuConfig = {
  groups: [
    {
      title: "空间功能",
      items: [
        {
          key: "daily-report",
          label: "快速问答",
          path: "/qa",
          icon: <QuickChatIcon />,
          resourceCode: "chat_with_ai"
        },
        {
          key: "agent",
          label: "Agents",
          path: "/agent",
          icon: <AgentsIcon />,
          resourceCode: "promptEngineering"
        },
        {
          key: "knowledgeManage",
          label: "知识库",
          path: "/knowledgeManage?knowledgeType=document&isIframe=true&hideSideBarAndHeader=true&workbenchNo=appKnowledgeList&tagType=knowledgeAnswerSource",
          icon: <KnowledgeIcon />,
          resourceCode: "appKnowledgeList"
        },
        {
          key: "voice-script",
          label: "智能语音",
          path: "/voice/script",
          icon: <VoiceIcon />,
          resourceCode: "voiceAgent"
        },
        {
          key: "data-logs",
          label: "空间数据",
          path: "/call-logs",
          icon: <DataIcon />,
          resourceCode: "dataStatistic"
        },
        {
          key: "more",
          label: "更多功能",
          path: "/transfer",
          icon: <MoreIcon />,
          resourceCode: "userAdmin",
          children: [
            {
              key: "transfer-user",
              label: "用户管理",
              path: "/transfer/user",
              icon: <UserIcon />,
              resourceCode: "userList"
            },
            {
              key: "transfer-role",
              label: "角色管理",
              path: "/transfer/role",
              icon: <RoleIcon />,
              resourceCode: "roleAdmin"
            },
            {
              key: "study-online",
              label: "在线学习",
              path: "/study/online",
              icon: <StudyIcon />,
              resourceCode: ["studyOnline", "aiOptimization"]
            },
            {
              key: "basic-settings",
              label: "基础设置",
              path: "/basic/settings",
              icon: <SettingsIcon />,
              resourceCode: ["systemConfig", "basicSettingsQPM"]
            },
            {
              key: "knowledge-source-tag",
              label: "标签管理",
              path: "/knowledge/source/tag",
              icon: <TagIcon />,
              resourceCode: ["systemConfig", "knowledgeSourceTag"]
            }
          ].concat(
            showVersionRelease
              ? [
                  {
                    key: "version-release",
                    label: "版本管理",
                    path: "/versionRelease",
                    icon: <VersionIcon />,
                    resourceCode: "versionRelease"
                  }
                ]
              : []
          )
        }
      ]
    },
    {
      title: "公共资源",
      skipPermission: true,
      items: [
        {
          key: "market1",
          label: "模型广场",
          path: "/model-market",
          icon: <Cpu size={20} />,
          resourceCode: "market-sub"
        },
        {
          key: "market2",
          label: "声音社区",
          path: "/voice-market",
          icon: <Radio size={20} />,
          resourceCode: "market-sub"
        },
        {
          key: "market3",
          label: "Agent市集",
          path: "/markets/agent",
          icon: <Bot size={20} />,
          resourceCode: "market-sub"
        },
        {
          key: "market4",
          label: "工作流市集",
          path: "/markets/workflow",
          icon: <Workflow size={20} />,
          resourceCode: "market-sub"
        },
        {
          key: "market6",
          label: "工具商店",
          path: "markets/tool",
          icon: <Store size={20} />,
          resourceCode: "market-sub"
        }
      ]
    }
  ]
}
