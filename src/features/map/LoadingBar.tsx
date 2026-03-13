interface LoadingBarProps {
  visible: boolean
}

export function LoadingBar({ visible }: LoadingBarProps) {
  if (!visible) return null

  return (
    <div
      aria-hidden="true"
      className="absolute top-0 left-0 right-0 z-10 h-[3px] overflow-hidden"
    >
      <div className="h-full bg-accent animate-[loading-bar_1.4s_ease-in-out_infinite]" />
    </div>
  )
}
