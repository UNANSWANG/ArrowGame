/**游戏页面路径 */
export enum gamePath {
    /**游戏页面 */
    UIGame = "prefabs/UIPage/UIGame",
}

/**界面路径 */
export enum UIPath {
    /**提示 */
    tips = "prefabs/notice/tips",
    /**加载提示 */
    loadTips = "prefabs/notice/loadTips",
    /**成就提示 */
    achiveTips = "prefabs/notice/achiveTips",
    /**游戏中的点位 */
    gamePoint = "prefabs/Item/point",
    /**加载页面 */
    UILoading = "UILoading",
    /**主页面 */
    UIMain = "prefabs/UIPage/UIMain",
    /**成功页面 */
    UISuccess = "prefabs/UIPage/UISuccess",
    /**失败页面 */
    UIFail = "prefabs/UIPage/UIFail",
    /**设置页面 */
    UISetting = "prefabs/UIPage/UISetting",
    /**签到页面 */
    UISign = "prefabs/UIPage/UISign",
    /**恭喜获得页面 */
    UIReward = "prefabs/UIPage/UIReward",
    /**成就页面 */
    UIAchive = "prefabs/UIPage/UIAchive",
    /**道具页面 */
    UIProps = "prefabs/UIPage/UIProps",
    /**复访页面 */
    UIRevisit = "prefabs/UIPage/UIRevisit",
    /**排行榜 */
    UIRank = "prefabs/UIPage/UIRank",
    /**恢复存档页面 */
    UIRecovery = "prefabs/UIPage/UIRecovery",
}

/**物品路径 */
export enum ItemPath {

}

/**物品路径 */
export enum audioPath {
    /**背景音乐 */
    background = "audio/background",
    /**游戏内点击音效 */
    click = "audio/click",
    /**获得成就音效 */
    achievements = "audio/achievements",
    /**碰撞音效-误操作 */
    collision = "audio/collision",
    /**碰撞音效-获得爱心 */
    collisionHeart = "audio/collisionHeart",
    /**碰撞音效-获得时间 */
    collisionTime = "audio/collisionTime",
    /**碰撞音效-碰到吃豆人 */
    collisionEat = "audio/collisionEat",
    /**七彩箭头触发音效 */
    colorArrowRemove = "audio/colorArrowRemove",
    /**铁块消除音 */
    ironRemove = "audio/ironRemove",
    /**箭头消除成功音效 */
    removeArrow = "audio/removeArrow",
    /**单局胜利音效 */
    success = "audio/success",
}

/**图片路径 */
export enum imgPath {
    /**道具图片 */
    props = "texture/reward/props/props_",
    /**徽章图片（使用美术命名从1开始） */
    badge = "texture/achive/badge/huizhang_",
    /**成就标志图片 */
    achiveLogo = "texture/achive/logo/logo_",
    /**默认头像 */
    defAvatar = "texture/rank/moren",
}
