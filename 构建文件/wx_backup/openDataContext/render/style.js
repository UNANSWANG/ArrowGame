module.exports = {

    container: {
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0)',
    },

    rankScroll: {
        width: '100%',
        height: '83%',
        backgroundColor: 'rgba(0,0,0,0)',
        position: 'absolute',
        left: 8,
        top: 7,
    },

    // 单行高度176
    rankItem: {
        width: '100%',
        height: 176,
        marginTop: 12,
    },

    // 背景图
    // 使用图片真实尺寸
    rankBg: {
        width: 853,
        height: 176,
        position: 'absolute',
        left: 20,
        top: 0,
    },

    // 内容层
    rankContent: {
        width: 853,
        height: 176,
        position: 'absolute',
        left: 20,
        top: 0,
        flexDirection: 'row',
        alignItems: 'center',
    },

    // 前三名勋章
    // 使用图片真实尺寸
    rankMedal: {
        width: 96,
        height: 65,
        marginLeft: 20,
    },

    // 排名数字
    rankNum: {
        width: 90,
        height: 98,
        fontSize: 78,
        color: '#FFFFFF',
        textAlign: 'center',
        fontWeight: 'bold',
        marginLeft: 20,
        marginTop: 20,
    },

    // mask区域
    avatarMask: {
        width: 103,
        height: 103,
        borderRadius: 51.5,
        overflow: 'hidden',
        marginLeft: 45,
    },

    // 自己mask区域
    avatarSelfMask: {
        width: 103,
        height: 103,
        borderRadius: 51.5,
        overflow: 'hidden',
        marginLeft: 45,
    },

    // 头像
    // 使用真实尺寸
    avatar: {
        width: 103,
        height: 103,
        borderRadius: 51.5,
    },

    // 昵称
    nickName: {
        width: 320,
        height: 52,
        fontSize: 42,
        textAlign: 'left',
        color: '#FFFFFF',
        fontWeight: 'bold',
        marginLeft: 35,
        marginTop: 20,
    },

    // 分数
    score: {
        width: 180,
        height: 61,
        textAlign: 'right',
        fontSize: 49,
        color: '#FFFFFF',
        fontWeight: 'bold',
        marginLeft: 40,
        marginTop: 20,
    },

    // 自己区域
    selfItem: {
        width: '100%',
        height: 176,
        position: 'absolute',
        bottom: 21.5,
        left: 23.5,
    },

    // 自己背景
    selfBg: {
        width: 853,
        height: 176,
        position: 'absolute',
        left: 0,
        top: 0,
    },

    // 自己内容
    selfContent: {
        width: 853,
        height: 176,
        position: 'absolute',
        left: 0,
        top: 0,
        flexDirection: 'row',
        alignItems: 'center',
    },

    // 自己排名
    selfRank: {
        width: 120,
        textAlign: 'center',
        fontSize: 78,
        color: '#3F3F3F',
        fontWeight: 'bold',
        marginTop: -65,
        marginLeft: 10,
    },

    // 自己昵称
    selfName: {
        width: 320,
        fontSize: 42,
        color: '#3F3F3F',
        fontWeight: 'bold',
        marginLeft: 30,
        marginTop: -30,
    },

    // 自己分数
    selfScore: {
        width: 180,
        textAlign: 'right',
        fontSize: 49,
        color: '#3F3F3F',
        fontWeight: 'bold',
        marginLeft: 50,
        marginTop: -30,
    },
};