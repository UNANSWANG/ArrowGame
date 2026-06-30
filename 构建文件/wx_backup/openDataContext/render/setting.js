let __env = GameGlobal.wx || GameGlobal.tt || GameGlobal.swan;
let sharedCanvas = __env.getSharedCanvas();
let sharedContext = sharedCanvas.getContext('2d');

function drawNoPermission() {

    sharedContext.clearRect(
        0,
        0,
        sharedCanvas.width,
        sharedCanvas.height
    );

    // 背景
    sharedContext.fillStyle = '#ffffff';

    sharedContext.fillRect(
        0,
        0,
        sharedCanvas.width,
        sharedCanvas.height
    );

    // 文字
    // sharedContext.fillStyle = '#333333';

    // sharedContext.font = '28px Arial';

    // sharedContext.textAlign = 'center';

    // sharedContext.fillText(
    //     '请开启微信朋友信息权限',
    //     sharedCanvas.width / 2,
    //     sharedCanvas.height / 2 - 120
    // );

    // 图片
    const img = wx.createImage();

    img.onload = () => {

        console.log('图片加载成功');

        const x =
            (sharedCanvas.width - img.width) / 2;

        const y =
            (sharedCanvas.height - img.height) / 2 - 100;

        sharedContext.drawImage(
            img,
            x,
            y,
            img.width,
            img.height
        );
    };

    img.onerror = (err) => {

        console.error('图片加载失败', err);
    };

    img.src = 'openDataContext/img/openSetting.png';
}

module.exports = {

    drawNoPermission
};