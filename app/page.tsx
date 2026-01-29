
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
      <main className="flex w-full max-w-5xl flex-col items-center justify-between gap-10 p-24 text-center">
        <h1 className="text-6xl font-bold tracking-tight">
          Construction Management Suite
        </h1>
        <p className="text-xl text-muted-foreground">
          Welcome to the unified platform for Admins, Project Managers, Developers, and Clients.
        </p>

        <div className="flex flex-wrap gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/login">Login</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/admin">Admin Dashboard</Link>
          </Button>
          <Button variant="secondary" size="lg" asChild>
            <Link href="/project-manager">PM Dashboard</Link>
          </Button>
          <Button variant="ghost" size="lg" asChild>
            <Link href="/developer">Developer Dashboard</Link>
          </Button>
          <Button variant="ghost" size="lg" asChild>
            <Link href="/client">Client Dashboard</Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
