; Generated from brand.json.
!macro ProductInstallerResolveTheme
${If} $InstallerTheme == "dark"
StrCpy $InstallerBgHex "19231F"
StrCpy $InstallerTextHex "EEF3EB"
StrCpy $InstallerBgArgb 0xFF19231F
StrCpy $InstallerBgColorref 0x1F2319
StrCpy $InstallerTextColorref 0xEBF3EE
StrCpy $InstallerPrimary 0xFF2B8553
StrCpy $InstallerPrimaryHover 0xFF26764A
StrCpy $InstallerPrimaryPressed 0xFF26764A
StrCpy $InstallerControlHover 0xFF2A382F
StrCpy $InstallerControlPressed 0xFF294C39
StrCpy $InstallerTrack 0xFF3A4B3E
StrCpy $InstallerButtonText 0xFFFFFF
StrCpy $InstallerBorder 0xFF526858
${Else}
StrCpy $InstallerBgHex "F4F2EC"
StrCpy $InstallerTextHex "22303F"
StrCpy $InstallerBgArgb 0xFFF4F2EC
StrCpy $InstallerBgColorref 0xECF2F4
StrCpy $InstallerTextColorref 0x3F3022
StrCpy $InstallerPrimary 0xFF23814F
StrCpy $InstallerPrimaryHover 0xFF1C6E48
StrCpy $InstallerPrimaryPressed 0xFF1C6E48
StrCpy $InstallerControlHover 0xFFEEEBE3
StrCpy $InstallerControlPressed 0xFFE6F7EE
StrCpy $InstallerTrack 0xFFE6E1D6
StrCpy $InstallerButtonText 0xFFFFFF
StrCpy $InstallerBorder 0xFFD6CFC2
${EndIf}
!macroend
!macro ProductInstallerControlColors HANDLE
${If} $InstallerTheme == "dark"
SetCtlColors ${HANDLE} EEF3EB 19231F
${Else}
SetCtlColors ${HANDLE} 22303F F4F2EC
${EndIf}
!macroend
