# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e5]:
    - heading "欢迎回到 L2C 系统" [level=2] [ref=e6]
    - paragraph [ref=e7]: 线索到现金，一站式销售管理
    - generic [ref=e8]:
      - generic [ref=e9]:
        - generic [ref=e10]: 手机号 / 邮箱
        - generic [ref=e11]:
          - img [ref=e12]
          - textbox "手机号 / 邮箱" [ref=e15]:
            - /placeholder: 请输入手机号或邮箱
            - text: "13800000001"
      - generic [ref=e16]:
        - generic [ref=e17]: 密码
        - generic [ref=e18]:
          - img [ref=e19]
          - textbox "密码" [ref=e22]:
            - /placeholder: 请输入密码
            - text: "123456"
          - button "显示密码" [ref=e23]:
            - img [ref=e24]
      - button "忘记密码？" [ref=e28]
      - button "登录" [ref=e29]:
        - generic [ref=e30]: 登录
      - generic [ref=e35]: 或
      - paragraph [ref=e37]:
        - text: 还没有账号？
        - link "立即注册" [ref=e38] [cursor=pointer]:
          - /url: /register/tenant
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e44] [cursor=pointer]:
    - img [ref=e45]
  - alert [ref=e48]
```