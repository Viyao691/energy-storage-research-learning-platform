export const groups = [
  {
    label: "论文",
    links: [
      ["/upload", "\u4e0a\u4f20\u8bba\u6587", "file-plus"],
      ["/search", "\u8bba\u6587\u641c\u7d22", "search"],
      ["/library", "\u8bba\u6587\u5e93", "library"],
      ["/compare", "\u591a\u7bc7\u6bd4\u8f83", "layers"],
      ["/knowledge", "\u8bba\u6587\u5e93\u95ee\u7b54", "message"],
    ],
  },
  {
    label: "学习",
    links: [
      ["/learning", "学习中心", "book-open"],
      ["/research-daily", "\u79d1\u7814\u65e5\u62a5", "calendar"],
      ["/campus", "\u6821\u56ed\u8d44\u8baf", "globe"],
    ],
  },
  {
    label: "竞赛",
    links: [
      ["/contests", "科研创新竞赛", "layers"],
    ],
  },
  {
    label: "科研",
    links: [
      ["/subscriptions", "\u7814\u7a76\u8ba2\u9605", "book-open"],
      ["/research-data", "科研数据", "layers"],
      ["/ideas", "科研想法", "message"],
      ["/research/chronicle", "储能编年史", "calendar"],
      ["/research/city-applications", "储能城市应用", "layers"],
    ],
  },
  {
    label: "\u7cfb\u7edf",
    links: [
      ["/settings", "\u7cfb\u7edf\u8bbe\u7f6e", "settings"],
      ["/diagnostics", "\u8fde\u63a5\u8bca\u65ad", "pulse"],
      ["/maintenance", "\u5b58\u50a8\u4e0e\u5907\u4efd", "settings"],
      ["/help", "\u5e2e\u52a9", "help"],
      ["/onboarding", "配置引导", "help"],
    ],
  },
] as const;
