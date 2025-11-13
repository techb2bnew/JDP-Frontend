interface LogoProps {
  className?: string
  width?: number
  height?: number
}

export function Logo({ className = "", width = 168, height = 63 }: LogoProps) {
  return (
    <div 
      className={`flex items-center justify-center bg-primary text-primary-foreground rounded-lg ${className}`}
      style={{ width, height }}
    >
      <span className="font-bold text-2xl">JDP</span>
    </div>
  )
}