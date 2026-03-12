export const mockTree = [
  {
    resourceNo: "ryobaiicfanky",
    name: "WEB应用端",
    code: "webPage",
    resourceType: "MENU",
    parentNo: "-1",
    orderNo: 10,
    urlPath: "/",
    httpMethod: "",
    description: "",
    child: [
      {
        resourceNo: "ryodapltzrdme",
        name: "管理后台入口按钮",
        code: "buttonOfBackstageManagementAccess",
        resourceType: "BUTTON",
        parentNo: "ryobaiicfanky",
        orderNo: 10,
        urlPath: "",
        httpMethod: "",
        description: "",
        child: null
      }
    ]
  },
  {
    resourceNo: "ryobvbdmyshem",
    name: "管理后台",
    code: "backstageManagementPage",
    resourceType: "MENU",
    parentNo: "-1",
    orderNo: 20,
    urlPath: "",
    httpMethod: "",
    description: "",
    child: [
      {
        resourceNo: "ryodezqivsbrc",
        name: "空间管理",
        code: "botManageMenu",
        resourceType: "MENU",
        parentNo: "ryobvbdmyshem",
        orderNo: 10,
        urlPath: "/home",
        httpMethod: "",
        description: "",
        child: [
          {
            resourceNo: "ryodgakhiljgi",
            name: "空间列表",
            code: "botListMenu",
            resourceType: "MENU",
            parentNo: "ryodezqivsbrc",
            orderNo: 10,
            urlPath: "/addBotList",
            httpMethod: "",
            description: "",
            child: [
              {
                resourceNo: "ryodhemnyfijo",
                name: "新建空间按钮",
                code: "buttonOfCreateBot",
                resourceType: "BUTTON",
                parentNo: "ryodgakhiljgi",
                orderNo: 20,
                urlPath: "",
                httpMethod: "",
                description: "",
                child: null
              },
              {
                resourceNo: "ryodiyjpsnpbc",
                name: "空间上下线按钮",
                code: "buttonOfOfflineOrOnlineBot",
                resourceType: "BUTTON",
                parentNo: "ryodgakhiljgi",
                orderNo: 30,
                urlPath: "/admin/**/updateStatus",
                httpMethod: "PUT",
                description: "",
                child: null
              },
              {
                resourceNo: "ryodqaiuibaxc",
                name: "删除空间",
                code: "buttonOfDeleteBot",
                resourceType: "BUTTON",
                parentNo: "ryodgakhiljgi",
                orderNo: 30,
                urlPath: "/admin/bot/*",
                httpMethod: "DELETE",
                description: "",
                child: null
              },
              {
                resourceNo: "ryyfyanrvwnam",
                name: "编辑",
                code: "editBotMenu",
                resourceType: "MENU",
                parentNo: "ryodgakhiljgi",
                orderNo: 30,
                urlPath: "",
                httpMethod: "",
                description: "",
                child: [
                  {
                    resourceNo: "ryyfynipbqmsm",
                    name: "基本信息",
                    code: "botBaseInfoMenu",
                    resourceType: "MENU",
                    parentNo: "ryyfyanrvwnam",
                    orderNo: 30,
                    urlPath: "",
                    httpMethod: "",
                    description: "",
                    child: null
                  },
                  {
                    resourceNo: "ryyfyqsuyvdrs",
                    name: "工作流",
                    code: "skillManageMenu",
                    resourceType: "MENU",
                    parentNo: "ryyfyanrvwnam",
                    orderNo: 30,
                    urlPath: "",
                    httpMethod: "",
                    description: "",
                    child: null
                  },
                  {
                    resourceNo: "ryyfyueropagm",
                    name: "知识库",
                    code: "knowledgeManageMenu",
                    resourceType: "MENU",
                    parentNo: "ryyfyanrvwnam",
                    orderNo: 30,
                    urlPath: "",
                    httpMethod: "",
                    description: "",
                    child: null
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        resourceNo: "ryodfpnwzcqds",
        name: "权限管理",
        code: "authManageMenu",
        resourceType: "MENU",
        parentNo: "ryobvbdmyshem",
        orderNo: 20,
        urlPath: "/permission-management",
        httpMethod: "",
        description: "",
        child: [
          {
            resourceNo: "ryyfzfjbdqirw",
            name: "用户管理",
            code: "authUserManageMenu",
            resourceType: "MENU",
            parentNo: "ryodfpnwzcqds",
            orderNo: 30,
            urlPath: "/user-management",
            httpMethod: "",
            description: "",
            child: null
          },
          {
            resourceNo: "ryyibcvxwmnrs",
            name: "角色管理",
            code: "authRoleManageMenu",
            resourceType: "MENU",
            parentNo: "ryodfpnwzcqds",
            orderNo: 30,
            urlPath: "/role-management",
            httpMethod: "",
            description: "",
            child: null
          },
          {
            resourceNo: "ryyibhdwddjum",
            name: "标签管理",
            code: "authPermissionGroupManageMenu",
            resourceType: "MENU",
            parentNo: "ryodfpnwzcqds",
            orderNo: 30,
            urlPath: "/group-management",
            httpMethod: "",
            description: "",
            child: null
          },
          {
            resourceNo: "ryyiblhgdalrk",
            name: "菜单管理",
            code: "authResourceMenu",
            resourceType: "MENU",
            parentNo: "ryodfpnwzcqds",
            orderNo: 30,
            urlPath: "/menu-auth-management",
            httpMethod: "",
            description: "",
            child: null
          }
        ]
      },
      {
        resourceNo: "ryyibvmtiliro",
        name: "模板管理",
        code: "templateManageMenu",
        resourceType: "MENU",
        parentNo: "ryobvbdmyshem",
        orderNo: 30,
        urlPath: "",
        httpMethod: "",
        description: "",
        child: [
          {
            resourceNo: "ryyicbpnmnufg",
            name: "工作流模板",
            code: "skillTemplateMenu",
            resourceType: "MENU",
            parentNo: "ryyibvmtiliro",
            orderNo: 30,
            urlPath: "",
            httpMethod: "",
            description: "",
            child: null
          }
        ]
      }
    ]
  }
]
