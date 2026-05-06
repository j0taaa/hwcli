Unicode true

!include "MUI2.nsh"
!include "FileFunc.nsh"

!define APP_NAME "HWCLI"
!define APP_EXE "HWCLI.exe"
!define APP_DIR "release"
!define OUT_FILE "release/bundle/nsis/HWCLI Desktop Installer.exe"

Name "${APP_NAME}"
OutFile "${OUT_FILE}"
InstallDir "$LOCALAPPDATA\${APP_NAME}"
InstallDirRegKey HKCU "Software\${APP_NAME}" "InstallDir"
RequestExecutionLevel user
BrandingText "HWCLI"

!define MUI_ABORTWARNING
!define MUI_ICON "icons/prod/icon.ico"
!define MUI_UNICON "icons/prod/icon.ico"
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_BITMAP "assets/nsis-header.bmp"
!define MUI_WELCOMEFINISHPAGE_BITMAP "assets/nsis-sidebar.bmp"

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_WELCOME
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

!insertmacro MUI_LANGUAGE "English"

Function .onInit
  ReadRegStr $0 HKCU "Software\${APP_NAME}" "InstallDir"
  StrCmp $0 "$PROGRAMFILES64\${APP_NAME}" 0 +3
    StrCpy $INSTDIR "$LOCALAPPDATA\${APP_NAME}"
    WriteRegStr HKCU "Software\${APP_NAME}" "InstallDir" "$INSTDIR"
  StrCmp $0 "$PROGRAMFILES\${APP_NAME}" 0 +3
    StrCpy $INSTDIR "$LOCALAPPDATA\${APP_NAME}"
    WriteRegStr HKCU "Software\${APP_NAME}" "InstallDir" "$INSTDIR"
FunctionEnd

Section "Install"
  SetOutPath "$INSTDIR"

  File "${APP_DIR}/${APP_EXE}"
  File "${APP_DIR}/opencode-cli.exe"

  WriteRegStr HKCU "Software\${APP_NAME}" "InstallDir" "$INSTDIR"
  WriteUninstaller "$INSTDIR\Uninstall.exe"

  CreateDirectory "$SMPROGRAMS\${APP_NAME}"
  CreateShortcut "$SMPROGRAMS\${APP_NAME}\${APP_NAME}.lnk" "$INSTDIR\${APP_EXE}"
  CreateShortcut "$SMPROGRAMS\${APP_NAME}\Uninstall ${APP_NAME}.lnk" "$INSTDIR\Uninstall.exe"
  CreateShortcut "$DESKTOP\${APP_NAME}.lnk" "$INSTDIR\${APP_EXE}"
SectionEnd

Section "Uninstall"
  Delete "$INSTDIR\${APP_EXE}"
  Delete "$INSTDIR\opencode-cli.exe"
  Delete "$INSTDIR\Uninstall.exe"

  Delete "$SMPROGRAMS\${APP_NAME}\${APP_NAME}.lnk"
  Delete "$SMPROGRAMS\${APP_NAME}\Uninstall ${APP_NAME}.lnk"
  RMDir "$SMPROGRAMS\${APP_NAME}"
  Delete "$DESKTOP\${APP_NAME}.lnk"

  RMDir "$INSTDIR"
  DeleteRegKey HKCU "Software\${APP_NAME}"
SectionEnd
