import { _decorator, AssetManager, Component, instantiate, Node, Prefab, Vec3 } from 'cc';
import { tipsNotice } from '../UIPage/tipsNotice';
import { UIBase } from '../UIPage/UIBase';
import { gamePath, UIPath } from './pathConfig';
import { ccResTools } from '../extention/resTools';
import { AchiveTaskType, GameEvent } from './configData';
import { achiveTips } from '../UIPage/achiveTips';
import { gm } from './gm';
import { poolMgr } from './poolManager';
const { ccclass, property } = _decorator;

@ccclass('UIManager')
export class UIManager {
    resBundle: AssetManager.Bundle = null;
    tipsPrefab: Prefab = null;
    achiveTipsPrefab: Prefab = null;
    gamePointPrefab: Prefab = null;

    private gamePage: Node = null;
    private uiPage: Node = null;
    private noticePage: Node = null;

    private uiMap: Map<string, Node> = new Map();

    initData(node) {
        this.initPage(node);
    }

    initPage(parent) {
        this.gamePage = parent.getChildByName('Game');
        this.uiPage = parent.getChildByName('UI');
        this.noticePage = parent.getChildByName('Notice');
    }

    /**加载所需预制体 */
    async preLoadPrefab() {
        return new Promise<void>(async (resolve, reject) => {
            if (!this.resBundle) {
                reject();
            }
            let tipsPre = await ccResTools.loadPrefab(this.resBundle, UIPath.tips);
            this.tipsPrefab = tipsPre;
            let achiveTipsPre = await ccResTools.loadPrefab(this.resBundle, UIPath.achiveTips);
            this.achiveTipsPrefab = achiveTipsPre;
            let gamePointPre = await ccResTools.loadPrefab(this.resBundle, UIPath.gamePoint);
            this.gamePointPrefab = gamePointPre;
            //加载完游戏点位后，初始化游戏点位对象池
            poolMgr.initPointNodePool();
            resolve();
        });
    }

    /**显示提示 */
    showTips(str?) {
        let noticeItem = instantiate(this.tipsPrefab);
        this.noticePage.addChild(noticeItem);

        let notice = noticeItem.getComponent(tipsNotice);
        notice.initData(str);
    }

    /**显示成就 */
    showAchiveTips(type: AchiveTaskType) {
        let achiveTipsItem = instantiate(this.achiveTipsPrefab);
        this.noticePage.addChild(achiveTipsItem);

        let achiveTipsComp = achiveTipsItem.getComponent(achiveTips);
        achiveTipsComp.initData(type);
    }

    /**开始游戏 */
    async startGame() {
        if (!this.resBundle) {
            return;
        }
        uiMgr.openPage(UIPath.loadTips);
        let keyName = this.getUIName(gamePath.UIGame);
        let gameNode = null;
        if (this.uiMap.has(keyName)) {
            gameNode = this.uiMap.get(keyName);
            gameNode.active = true;
        } else {
            let gamePre = await ccResTools.loadPrefab(this.resBundle, gamePath.UIGame);
            gameNode = instantiate(gamePre);
            this.uiMap.set(keyName, gameNode);
            gameNode.active = true;
        }
        this.gamePage.addChild(gameNode);
        let uiComp = gameNode.getComponent(UIBase);
        let _isFrameGenerate = true;
        if(_isFrameGenerate){
            gameNode.position = new Vec3(1080, 0, 0);
        }else{
            uiMgr.closePage(UIPath.UIMain);
        }
        uiComp.onUI_Open({ isFrameGenerate: _isFrameGenerate });
    }

    /**关闭游戏 */
    closeGame() {
        let keyName = this.getUIName(gamePath.UIGame);
        if (this.uiMap.has(keyName)) {
            let uiComp = this.uiMap.get(keyName).getComponent(UIBase);
            uiComp.onUI_Close();
            this.uiMap.get(keyName).active = false;
        }
        uiMgr.openPage(UIPath.UIMain);
    }

    /**预加载界面 */
    preLoadPage(pagePath: string) {
        return new Promise<void>(async (resolve, reject) => {
            if (!this.resBundle) {
                reject();
            }
            let keyName = this.getUIName(pagePath);
            let pagePre = await ccResTools.loadPrefab(this.resBundle, pagePath);
            let pageNode = instantiate(pagePre);
            this.uiMap.set(keyName, pageNode);
            pageNode.active = false;
            resolve();
        });
    }

    /**打开界面 */
    async openPage(pagePath: string, data?: any) {
        if (!this.resBundle) {
            return;
        }
        let keyName = this.getUIName(pagePath);
        let pageNode = null;
        if (this.uiMap.has(keyName)) {
            pageNode = this.uiMap.get(keyName);
            this.uiPage.addChild(pageNode);
        } else {
            let pagePre = await ccResTools.loadPrefab(this.resBundle, pagePath);
            pageNode = instantiate(pagePre);
            this.uiPage.addChild(pageNode);
            this.uiMap.set(keyName, pageNode);
        }
        pageNode.active = true;
        let uiComp: UIBase = pageNode.getComponent(UIBase);
        uiComp.onUI_Open(data);
    }

    /**关闭界面 */
    closePage(pagePath: string) {
        let keyName = this.getUIName(pagePath);
        if (this.uiMap.has(keyName)) {
            let pageNode = this.uiMap.get(keyName);;
            let uiComp = pageNode.getComponent(UIBase);
            uiComp.onUI_Close();
            pageNode.active = false;
            //将自己移出父节点但不删除节点
            pageNode.removeFromParent();
        }
    }

    /**获取界面名称 */
    getUIName(str) {
        let strs = str.split('/');
        return strs[strs.length - 1];
    }
}
export let uiMgr = new UIManager();

