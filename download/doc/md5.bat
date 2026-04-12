@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
cls
echo ================================================
echo        MD5 计算工具（递归子目录+相对路径）
echo ================================================
echo.

:: 清空结果文件
type nul>md5.txt
set "base=%cd%"

echo 【1】扫描忽略文件（.txt/.bat）：
for /r %%f in (*.*) do (
    set "filepath=%%f"
    set "relpath=!filepath:%base%=!"
    set "relpath=!relpath:~1!"
    echo %%~xf | findstr /i ".txt .bat" >nul && echo 忽略：!relpath!
)
echo.

echo 【2】开始计算所有文件 MD5：
echo ==================================================
for /r %%f in (*.*) do (
    echo %%~xf | findstr /i ".txt .bat" >nul || (
        set "filepath=%%f"
        set "relpath=!filepath:%base%=!"
        set "relpath=!relpath:~1!"
        for /f "skip=1 tokens=1" %%a in ('certutil -hashfile "%%f" MD5 2^>nul ^| findstr /v "CertUtil" ^| findstr /v "^$"') do (
            echo !relpath!: %%a
            echo !relpath!: %%a >>md5.txt
        )
    )
)
echo ==================================================
echo.
echo ✅ 计算完成！结果已保存到 md5.txt
echo.
pause