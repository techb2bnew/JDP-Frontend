export function Footer() {
  return (
    <footer className="bg-background border-t border-border px-6 py-4">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-sm text-muted-foreground">
          © 2025 JDP. All rights reserved.
        </div>
        <div className="text-sm text-muted-foreground">
          Website by{' '}
          <a 
            href="https://www.base2brand.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 transition-colors underline"
          >
            Base2Brand
          </a>
        </div>
      </div>
    </footer>
  )
}