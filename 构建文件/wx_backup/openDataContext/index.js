const style = require('./render/style')
const template = require('./render/template')
const setting = require('./render/setting')
const Layout = require('./engine').default;

let __env = GameGlobal.wx || GameGlobal.tt || GameGlobal.swan;
let sharedCanvas = __env.getSharedCanvas();
let sharedContext = sharedCanvas.getContext('2d');

let friendsData = [];
let isGet = false;
let openId = "";

function getFriendsData() {
    if (GameGlobal.wx) {
        let keyList = ['level'];//可以是一个list
        wx.getFriendCloudStorage({
            keyList: keyList,
            success: res => {
                isGet = true;
                setDataRandRender(res);
            },
            fail: err => {
                isGet = false;
                console.error('获取好友数据失败：', err);
                setting.drawNoPermission();
            }
        });
    }
}

function setDataRandRender(res) {
    console.log('开放数据域获取好友数据成功：', res.data);
    
    // 处理好友数据
    friendsData = res.data.map(friend => ({
        avatarUrl: friend.avatarUrl,
        nickname: friend.nickname,
        openId: friend.openid,
        rankScore: friend.KVDataList.find(data => data.key === "level")?.value || '0'
    }));
    
    // 按分数排序（从高到低）
    friendsData.sort((a, b) => parseFloat(b.rankScore) - parseFloat(a.rankScore));
    
    console.log("openId", openId);
    //找到自己的数据
    let selfData = null;
    for (let i = 0; i < friendsData.length; i++) {
        friendsData[i].rank = i + 1;
        if(friendsData[i].openId == openId){
            selfData = friendsData[i];
        }
    }

    // let tempData = [];
    // for (let i = 0; i < friendsData.length; i++) {
    //     for (let j = 0; j < 20; j++) {
    //         tempData.push(friendsData[i]);
    //     }
    // }

    console.log("排序后的好友数据", friendsData);
    
    console.log("当前用户数据", selfData);

    // 重新渲染排行榜
    draw({ data: friendsData, selfData: selfData });
}

function draw(dataList) {
    Layout.clear();
    sharedContext.clearRect(
        0,
        0,
        sharedCanvas.width,
        sharedCanvas.height
    );
    console.log("清除画布", sharedCanvas.width, sharedCanvas.height);
    Layout.init(template(dataList), style);
    Layout.layout(sharedContext);
}

function updateViewPort(data) {
    Layout.updateViewPort({
        x: data.x,
        y: data.y,
        width: data.width,
        height: data.height,
    });
}

__env.onMessage(data => {
    console.log("开放数据域收到消息：", data);
    if (data.type === 'engine' && data.event === 'viewport') {
        updateViewPort(data);
    }
    else if (data.event === 'getFriendRank') {
        if(data.openId){
            openId = data.openId;
        }
        // 当需要更新排行榜时获取好友数据
        getFriendsData(data.type, data.rankType);
    }
});