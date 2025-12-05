export interface DialogProps {
  open: boolean
  onClose: () => void
  TransitionProps: {
    onExited: () => void
  }
}
