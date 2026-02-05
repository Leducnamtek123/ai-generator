# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e4]:
    - link "Square Logo SQUARE" [ref=e6] [cursor=pointer]:
      - /url: /
      - img "Square Logo" [ref=e8]
      - generic [ref=e9]: SQUARE
    - generic [ref=e10]:
      - generic [ref=e11]:
        - text: Email Address
        - textbox "name@company.com" [ref=e12]
      - generic [ref=e13]:
        - text: Password
        - generic [ref=e14]:
          - textbox "••••••••" [ref=e15]
          - button "Show password" [ref=e16]:
            - img [ref=e17]
            - generic [ref=e20]: Show password
      - button "Sign In" [ref=e21]
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e27] [cursor=pointer]:
    - img [ref=e28]
  - alert [ref=e31]
```