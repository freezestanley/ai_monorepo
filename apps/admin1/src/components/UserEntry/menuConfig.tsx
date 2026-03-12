import { Bot, Cpu, LayoutGrid, MoreHorizontal, Radio, Store, Workflow } from "lucide-react"
import Iconfont from "@/components/Icon"

interface MenuItem {
  key: string
  label: string
  path: string
  icon?: any
  group?: string
  children?: MenuItem[]
}

interface MenuGroup {
  title: string
  items: MenuItem[]
}

export interface MenuConfig {
  groups: MenuGroup[]
}

const HomeIcon = () => <LayoutGrid size={20} />
const TechnicalRadarIcon = () => <Iconfont className="text-[20px]" type="icon-cebian-shujuguanli" />

export const menuConfig: MenuConfig = {
  groups: [
    {
      title: "空间功能",
      items: [
        {
          key: "home",
          label: "空间首页",
          path: "/home",
          icon: <HomeIcon />
        }
      ]
    },
    {
      title: "公共资源",
      items: [
        {
          key: "market1",
          label: "模型广场",
          path: "/model-market", //"/market-sub?tab=MODEL_SERIES",
          icon: <Cpu size={20} />
        },
        {
          key: "market2",
          label: "声音社区",
          path: "/voice-market", //"/market-sub?tab=TIMBRE",
          icon: <Radio size={20} />
        },
        {
          key: "market3",
          label: "Agent市集",
          path: "/markets/agent", //"/market-sub?tab=AGENT",
          icon: <Bot size={20} />
        },
        {
          key: "market4",
          label: "工作流市集",
          path: "/markets/workflow", // "/market-sub?tab=SKILL",
          icon: <Workflow size={20} />
        },
        {
          key: "market6",
          label: "工具商店",
          path: "markets/tool", //"/market-sub?tab=PLUG_IN",
          icon: <Store size={20} />
        },
        {
          key: "more",
          label: "更多资源",
          path: "/technical-radar-static",
          icon: <MoreHorizontal size={20} />,
          children: [
            {
              key: "technical-radar-static",
              label: "技术雷达",
              path: "/technical-radar-static",
              icon: <TechnicalRadarIcon />
            }
          ]
        }
      ]
      // https://aigc-admin-test.zhonganonline.com/#/market-sub?botNo=&tab=&iframeStyle=true&hideSideBarAndHeader=true&serviceName=za-open-bot&token=vQE35Lxn%252FzlqC1tYFHkncRgVvPjaEP9UFd6ORJDUx3DoiZGFsKe2L3uCh2Hw9BewkT9G8RHkWJm5NO5mwnG%252Fkw%253D%253D&workbenchNo=undefined&parentOrigin=https%3A%2F%2Faigc-test.zhonganonline.com
    }
  ]
}
