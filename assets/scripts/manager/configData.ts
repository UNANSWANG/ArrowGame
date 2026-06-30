/**游戏配置 */
export const configData = {
    /**点的宽度 */
    pointWidth: 45,
    /**箭头的动画间隔时间 */
    arrowAnimInterval: 0.03,
    /**大箭头的方向拓展时间 */
    bigArrowExtendTime: 0.1,
    /**道具移动速度 */
    propsMoveSpeed: 300,
    /**冲刺关卡阶段数量 */
    stageArr: [8, 15, 30, 45],
    /**额外消除箭头限制数组 */
    extraRemoveLimitArr: [45, 90, 135, 170, 215, 250],
}

/**游戏事件 */
export enum GameEvent {
    /**刷新红点 */
    refreshRed = "refreshRed",
    /**加载表格 */
    loadTable = "loadTable",
    /**检测登录页加载回调 */
    checkLoginLoad = "checkLoginLoad",
    /**全部表格加载完成回调 */
    tableLoadComplete = "tableLoadComplete",
    /**加载预制体 */
    loading = "loading",
    /**刷新游戏关卡 */
    refreshGameLevel = "refreshGameLevel",
    /**复活游戏 */
    resurrectionGame = "resurrectionGame",
    /**刷新生命值 */
    refreshLife = "refreshLife",
    /**消除箭头 */
    removeArrow = "removeArrow",
    /**刷新道具 */
    refreshProps = "refreshProps",
    /**关闭奖励界面 */
    closeRewardPage = "closeRewardPage",
    /**使用提示道具 */
    useTipsProps = "useTipsProps",
    /**使用辅助线道具 */
    useAuxiliaryProps = "useAuxiliaryProps",
    /**取消辅助线计时器 */
    cancelAuxiliaryLine = "cancelAuxiliaryLine",
    /**侧边栏回访 */
    revisitSidebar = "revisitSidebar",
    /**关闭加载中 */
    closeLoading = "closeLoading",
    /**切换主题 */
    switchTheme = "switchTheme",
    /**刷新冲刺关卡阶段 */
    refreshSprintStage = "refreshSprintStage",
}

/**存储的键值 */
export enum SaveKey {
    /**关卡数据 */
    level = "level",
    /**音效开关 */
    effect = "effect",
    /**音乐开关 */
    music = "music",
    /**振动开关 */
    vibrat = "vibrat",
    /**下个体力恢复的时间 */
    powerRecoverTime = "powerRecoverTime",
    /**道具存储 */
    props = "props",
    /**七天登录已领取天数 */
    signDay = "signDay",
    /**当日是否签到 */
    isSign = "isSign",
    /**成就记录 */
    achiveRecord = "achiveRecord",
    /**我的成就红点 */
    myAchiveRed = "myAchiveRed",
    /**我的成就进度 */
    myAchiveProgress = "myAchiveProgress",
    /**我的成就时间 */
    myAchiveTime = "myAchiveTime",
    /**累计挑战天数 */
    challengeDayNum = "challengeDayNum",
    /**当日累计挑战的关卡 */
    challengeDayLevelNum = "challengeDayLevelNum",
    /**上次挑战的时间（按天算） */
    lastChallengeTime = "lastChallengeTime",
    /**连续挑战的天数 */
    continuousDayNum = "continuousDayNum",
    /**挑战关卡的的次数集合 */
    playLevelNumArr = "playLevelNumArr",
    /**今日是否领取过侧边栏奖励 */
    isGetRevisit = "isGetRevisit",
    /**游戏主题 */
    themeMode = "themeMode",
    /**用户头像 */
    avatarUrl = "avatarUrl",
}

/**道具索引 */
export enum PropsName {
    /**体力 */
    power = 0,
    /**提示 */
    tips = 1,
    /**辅助线 */
    auxiliary = 2,
}

/**任务描述(与类型一一对应)*/
export let taskDesc = [
    "通过$关",
    "消除$个铁块",
    "移走$条【彩色箭头】",
    "移走$条【巨型箭头】",
    "【黑洞】移走$条箭头",
    "【不扣血】的情况下通关$次",
    "在【最后10秒】内通关$次",
    "【复活】$次",
    "60秒内通关$次",
    "只剩1滴血的情况下通关$次",
    "碰撞吃豆人$次",
    "吃到【沙漏】道具$次",
    "吃到【桃心】道具$次",
    "【不看广告】的情况下通关$次",
    "全程【不放大缩小】的情况下通关$次",
    "全程【不长按箭头】且【不使用辅助线】的情况下通关$次",
    "扣血$点",
    "消耗$体力",
    "挑战$天",
    "连续挑战$天",
    "1天内连续挑战$关",
    "分享$次",
    "重复挑战同一关$次",
]

/**成就任务类型 */
export enum AchiveTaskType {
    /**通过$关 */
    passLevel = 1,
    /**消除$个铁块 */
    removeIron = 2,
    /**移走$条【彩色箭头】 */
    removeColorArrow = 3,
    /**移走$条【巨型箭头】 */
    removeBigArrow = 4,
    /**【黑洞】移走$条箭头 */
    removeBlackholeArrow = 5,
    /**【不扣血】的情况下通关$次 */
    noBloodPass = 6,
    /**在【最后10秒】内通关$次 */
    last10Pass = 7,
    /**【复活】$次 */
    resurrection = 8,
    /**60秒内通关$次 */
    passIn60Sec = 9,
    /**只剩1滴血的情况下通关$次 */
    passIn1Life = 10,
    /**碰撞吃豆人$次 */
    eatPacman = 11,
    /**吃到【沙漏】道具$次 */
    eatSand = 12,
    /**吃到【桃心】道具$次 */
    eatHeart = 13,
    /**【不看广告】的情况下通关$次 */
    noAdPass = 14,
    /**全程【不放大缩小】的情况下通关$次 */
    noZoomPass = 15,
    /**全程【不长按箭头】且【不使用辅助线】的情况下通关$次 */
    noLongPressPass = 16,
    /**扣血$点 */
    blood = 17,
    /**消耗$体力 */
    consumePower = 18,
    /**挑战$天 */
    challengeDay = 19,
    /**连续挑战$天 */
    challengeDayDay = 20,
    /**1天内连续挑战$关 */
    challengeDayLevel = 21,
    /**分享$次(微信和抖音两套不同的成功逻辑) */
    share = 22,
    /**重复挑战同一关$次 */
    repeatChallengeLevel = 23,
}

/**冲刺关卡阶段颜色 */
export let stageColor = [
    "#8bd2aa",
    "#f7c166",
    "#f1935e",
    "#eb655b",
];
