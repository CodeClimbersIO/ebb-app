export function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary mb-4"></div>
        <p className="text-muted-foreground">Loading your flow space...</p>
      </div>
    </div>
  )
} 
