import { _decorator, Component, director, Label, Node, Sprite } from 'cc';
import { ccResTools } from '../extention/resTools';
import { gamePath, UIPath } from '../manager/pathConfig';
import { uiMgr } from '../manager/UIManager';
import { jsonMgr } from '../manager/jsonManager';
import { gm, PlatType } from '../manager/gm';
import { GameEvent, SaveKey } from '../manager/configData';
import { ccStorageTools } from '../extention/storageTools';
import { pData } from '../manager/playerData';
import { audioMgr } from '../manager/audioManager';
const { ccclass, property } = _decorator;

@ccclass('UILoading')
export class UILoading extends Component {
    @property(Sprite)
    progress: Sprite = null;

    @property(Label)
    percentLab: Label = null;

    /**表格加载完成 */
    tableComplete = false;
    /**界面加载完成 */
    uiComplete = false;
    /**sdk登录完成 */
    sdkLoginComplete = false;

    /**总进度 */
    totalProgressMap = {};
    /**当前进度 */
    currentProgressMap = {};
    /**当前进度条百分比 */
    currentProgressPercent = 0;

    start() {
        this.initData();
    }

    protected onEnable(): void {
        gm.Event.on(GameEvent.loading, this.loadingComplete, this);
        gm.Event.on(GameEvent.checkLoginLoad, this.checkLoadComplete, this);
    }

    protected onDisable(): void {
        gm.Event.off(GameEvent.loading, this.loadingComplete, this);
        gm.Event.off(GameEvent.checkLoginLoad, this.checkLoadComplete, this);
    }

    async initData() {
        gm.Event.on(GameEvent.tableLoadComplete, this.tableLoadComplete, this);
        this.initStorageData();
        this.initSDK();

        await this.preLoadBundle();

        audioMgr.playBackgroundMusic();
        this.loadTable();

        this.preLoadPage();
    }

    /**预加载bundle */
    async preLoadBundle() {
        return new Promise<void>(async (resolve, reject) => {
            let resBundle = await ccResTools.loadBundle("res");
            uiMgr.resBundle = resBundle;
            resolve();
        });
    }
    loadItems = [UIPath.UIMain, gamePath.UIGame, UIPath.loadTips, UIPath.UIFail, UIPath.UISuccess, UIPath.UISign, UIPath.UIReward, UIPath.UISetting, UIPath.UIProps, UIPath.UIAchive];

    /**预加载界面 */
    async preLoadPage() {
        return new Promise<void>(async (resolve, reject) => {
            this.totalProgressMap = {};
            this.currentProgressMap = {};
            this.currentProgressPercent = 0;

            this.refreshProgress();

            uiMgr.preLoadPrefab();

            this.loadItems.map(async ($path) => {
                try {
                    uiMgr.preLoadPage($path);
                } catch (error) {
                    console.error(`加载 ${$path} 失败:`, error);
                }
            });

            resolve();
        });
    }

    /**预制体加载回调 */
    loadingComplete(data) {
        let finish = data[0];
        let total = data[1];
        let path = data[2];
        // console.log("finish:", finish, "total:", total, "path:", path);

        this.totalProgressMap[path] = total;
        this.currentProgressMap[path] = finish;

        let totalProgress = 0;
        let currentProgress = 0;

        for (let key in this.totalProgressMap) {
            totalProgress += this.totalProgressMap[key];
        }
        for (let key in this.currentProgressMap) {
            currentProgress += this.currentProgressMap[key];
        }

        let tempPercent = currentProgress / totalProgress;

        //防止进度条回退（且保证进度条加载完不丢失）
        if (tempPercent != 1 && tempPercent < this.currentProgressPercent) {
            return;
        }

        this.currentProgressPercent = tempPercent;
        this.refreshProgress();

        if (tempPercent == 1) {
            this.uiComplete = true;
        }

        this.checkLoadComplete();
    }

    /**刷新进度条 */
    refreshProgress() {
        this.progress.fillRange = this.currentProgressPercent;
        this.percentLab.string = `加载中 ${(this.currentProgressPercent * 100).toFixed(1)}%`;
    }

    /**加载表格 */
    loadTable() {
        jsonMgr.load();
    }

    /**表格加载完成 */
    tableLoadComplete() {
        this.tableComplete = true;
        this.checkLoadComplete();
    }

    /**加载完成判断 */
    checkLoadComplete() {
        if (this.tableComplete && this.uiComplete && gm.isLogin && this.sdkLoginComplete) {
            director.loadScene("main");
        }
    }

    initSDK() {
        this.sdkLoginComplete = false;
        if (gm.API.PLAT && gm.API.PLAT.HgSdk) {
            console.warn("初始化HgSdk");
            gm.hgSdk = new gm.API.PLAT.HgSdk();
            gm.hgSdk.init((res) => {
                const gameId = res.game_id
                const status = res.status
                this.sdkLoginComplete = true;

                if (status === 0) {
                    // 调用登录
                    gm.hgSdk.login((res) => {
                        // console.warn("登录成功，uid:", res.uid, "token:", res.token);
                    })
                }
            })
        } else {
            this.sdkLoginComplete = true;
            console.warn("没有HgSdk对象");
        }
    }

    /**初始化存储数据 */
    initStorageData() {
        pData.initPropsNum();

        pData.level = ccStorageTools.getNumberData(SaveKey.level) || 0;

        //TODO 测试用，后续注释掉
        if (gm.platType == PlatType.h5) {
            // pData.level = 3;
        }

        pData.themeMode = ccStorageTools.getNumberData(SaveKey.themeMode);
    }

}