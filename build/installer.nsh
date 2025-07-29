!macro customInstall
  DetailPrint "Installing ESP32 drivers..."
  SetOutPath "$INSTDIR\\drivers"
  ${If} ${RunningX64}
    ExecWait '"$INSTDIR\\drivers\\dpinst64.exe" /S /PATH "$INSTDIR\\drivers"'
  ${Else}
    ExecWait '"$INSTDIR\\drivers\\dpinst32.exe" /S /PATH "$INSTDIR\\drivers"'
  ${EndIf}
!macroend

!macro customUnInstall
  DetailPrint "Uninstalling ESP32 drivers..."
  SetOutPath "$INSTDIR\\drivers"
  ${If} ${RunningX64}
    ExecWait '"$INSTDIR\\drivers\\dpinst64.exe" /U /PATH "$INSTDIR\\drivers"'
  ${Else}
    ExecWait '"$INSTDIR\\drivers\\dpinst32.exe" /U /PATH "$INSTDIR\\drivers"'
  ${EndIf}
!macroend