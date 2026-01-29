
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground px-4 sm:px-6 lg:px-8">
      <main className="flex w-full max-w-5xl flex-col items-center justify-between gap-6 sm:gap-8 md:gap-10 p-6 sm:p-12 md:p-16 lg:p-24 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
          Construction Management Suite
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl">
          Welcome to the unified platform for Admins, Project Managers, Developers, and Clients.
        </p>

        <div className="flex flex-wrap gap-3 sm:gap-4 justify-center w-full max-w-3xl">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/login">Login</Link>
          </Button>
          <Button variant="outline" size="lg" asChild className="w-full sm:w-auto">
            <Link href="/admin">Admin Dashboard</Link>
          </Button>
          <Button variant="secondary" size="lg" asChild className="w-full sm:w-auto">
            <Link href="/project-manager">PM Dashboard</Link>
          </Button>
          <Button variant="ghost" size="lg" asChild className="w-full sm:w-auto">
            <Link href="/developer">Developer Dashboard</Link>
          </Button>
          <Button variant="ghost" size="lg" asChild className="w-full sm:w-auto">
            <Link href="/client">Client Dashboard</Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
