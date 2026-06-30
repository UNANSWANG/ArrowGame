@echo off
chcp 65001 >nul
set "sourceFolder=wx_backup"
set "targetFolder=wechatgame"

:: 检查目录是否存在
if not exist "%sourceFolder%" (
    echo 源目录 %sourceFolder% 不存在。
    exit /b 1
)

if not exist "%targetFolder%" (
    echo 目标目录 %targetFolder% 不存在。
    exit /b 1
)

:: 复制单个文件到wechatgame目录并替换
copy /Y "%sourceFolder%\HgSdk.js" "%targetFolder%" >nul 2>&1
copy /Y "%sourceFolder%\game.js" "%targetFolder%" >nul 2>&1
copy /Y "%sourceFolder%\game.json" "%targetFolder%" >nul 2>&1

:: 复制game_js/game.js到不同的子目录
copy /Y "%sourceFolder%\game_js\game.js" "%targetFolder%\assets\start-scene\" >nul 2>&1
copy /Y "%sourceFolder%\game_js\game.js" "%targetFolder%\assets\res\" >nul 2>&1
copy /Y "%sourceFolder%\game_js\game.js" "%targetFolder%\assets\startAsset\" >nul 2>&1

echo 所有文件已复制完成。
pause