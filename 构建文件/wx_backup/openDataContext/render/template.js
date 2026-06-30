module.exports = function (it) {

    const list = it.data || [];
    const self = it.selfData || {};

    let selfData = it.selfData || {
        avatarUrl: 'openDataContext/img/avatar.png',
        nickname: '用户10086',
        rankScore: 3,
        rank: '6',
    };

    if (self) {
        selfData = self;
    }

    const DEFAULT_AVATAR = 'openDataContext/img/avatar.png';

    // ✅ 强化 avatar 安全
    function safeAvatar(url) {

        if (!url || typeof url !== 'string') {
            return DEFAULT_AVATAR;
        }

        if (
            url.indexOf('http') === 0 &&
            url.indexOf('wx.qlogo.cn') === -1
        ) {
            return DEFAULT_AVATAR;
        }

        return url;
    }

    // ✅ 文本安全
    function safeText(v, d = '') {

        if (v === undefined || v === null) {
            return String(d);
        }

        return String(v);
    }

    // ✅ 分数安全
    function safeScore(v) {

        if (
            v === undefined ||
            v === null ||
            v === '' ||
            isNaN(v)
        ) {
            return '0';
        }

        return String(v);
    }

    let rankHtml = '';

    // =========================
    // 排行榜列表
    // =========================

    for (let i = 0; i < list.length; i++) {

        const item = list[i] || {};

        let rankIdx = Number(item.rank);

        let rankNode = '';

        // 前三名 medal
        if (rankIdx === 1) {

            rankNode =
                `<image class="rankMedal" src="openDataContext/img/1.png"></image>`;

        } else if (rankIdx === 2) {

            rankNode =
                `<image class="rankMedal" src="openDataContext/img/2.png"></image>`;

        } else if (rankIdx === 3) {

            rankNode =
                `<image class="rankMedal" src="openDataContext/img/3.png"></image>`;

        } else {

            // ✅ 滚动列表正常显示真实排名
            rankNode =
                `<text class="rankNum" value="${safeText(rankIdx)}"></text>`;
        }

        rankHtml += `
            <view class="rankItem">

                <image
                    class="rankBg"
                    src="openDataContext/img/rankBg.png">
                </image>

                <view class="rankContent">

                    ${rankNode}

                    <view class="avatarMask">

                        <image
                            class="avatar"
                            src="${safeAvatar(item.avatarUrl)}">
                        </image>

                    </view>

                    <text
                        class="nickName"
                        value="${safeText(item.nickname, '未知用户')}">
                    </text>

                    <text
                        class="score"
                        value="${safeScore(item.rankScore)}">
                    </text>

                </view>

            </view>
        `;
    }

    // =========================
    // 自己排名节点
    // =========================

    let selfRankNode = '';

    const selfRank = Number(selfData.rank);

    if (selfRank === 1) {

        selfRankNode =
            `<image class="rankMedal" src="openDataContext/img/1.png"></image>`;

    } else if (selfRank === 2) {

        selfRankNode =
            `<image class="rankMedal" src="openDataContext/img/2.png"></image>`;

    } else if (selfRank === 3) {

        selfRankNode =
            `<image class="rankMedal" src="openDataContext/img/3.png"></image>`;

    } else {

        // ✅ 只有自己区域才使用 99+
        let rankText = '99+';

        if (!isNaN(selfRank) && selfRank < 100) {
            rankText = String(selfRank);
        }

        selfRankNode =
            `<text class="selfRank" value="${rankText}"></text>`;
    }

    // =========================
    // 输出
    // =========================

    return `
        <view class="container">

            <scrollview
                class="rankScroll"
                scrollY="true">

                ${rankHtml}

            </scrollview>

            <view class="selfItem">

                <image
                    class="selfBg"
                    src="openDataContext/img/rankSelfBg.png">
                </image>

                <view class="selfContent">

                    ${selfRankNode}

                    <view class="avatarSelfMask">

                        <image
                            class="avatar"
                            src="${safeAvatar(selfData.avatarUrl)}">
                        </image>

                    </view>

                    <text
                        class="selfName"
                        value="${safeText(selfData.nickname, '未知用户')}">
                    </text>

                    <text
                        class="selfScore"
                        value="${safeScore(selfData.rankScore)}">
                    </text>

                </view>

            </view>

        </view>
    `;
};