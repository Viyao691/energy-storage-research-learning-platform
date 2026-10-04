export type PhotographicFeatureId = 'library' | 'qa' | 'learning' | 'contests' | 'chronicle' | 'city';
export const photographicFeatureLayout: { id: PhotographicFeatureId; title: string; detail: string; href: string; icon: string; x: number; y: number; path: string; target: [number, number] }[] = [
 { id: 'library', title: '论文库', detail: '管理 · 收藏 · 阅读', href: '/library', icon: 'folder', x: 720, y: 350, path: 'M938 391h35q12 0 12 12v70', target: [985, 473] },
 { id: 'qa', title: '论文库问答', detail: '循证问答 · 页码引用', href: '/knowledge', icon: 'chat', x: 1080, y: 750, path: 'M1190 750v-48q0-15 15-15h130', target: [1335, 687] },
 { id: 'learning', title: '学习中心', detail: '课程 · 卡片 · 自测', href: '/learning', icon: 'cap', x: 1525, y: 515, path: 'M1634 515v-75q0-18 18-18h80', target: [1732, 422] },
 { id: 'contests', title: '科研创新竞赛', detail: '科研挑战 · 赛事实践', href: '/contests', icon: 'trophy', x: 1460, y: 345, path: 'M1678 386h19q18 0 18 18v151', target: [1715, 555] },
 { id: 'chronicle', title: '储能编年史', detail: '储能发展 · 历史脉络', href: '/research/chronicle', icon: 'calendar', x: 940, y: 125, path: 'M1049 207v55q0 20 20 20h81', target: [1150, 282] },
 { id: 'city', title: '储能城市应用', detail: '场景探索 · 城市能源', href: '/research/city-applications', icon: 'city', x: 1240, y: 125, path: 'M1349 207v101q0 22 22 22h19', target: [1390, 330] },
];
