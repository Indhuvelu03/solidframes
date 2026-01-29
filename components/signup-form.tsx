"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
    FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

export function SignupForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const router = useRouter()
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: ""
    })
    const [error, setError] = useState("")

    const handleSignup = (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        // Validate password match
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match")
            return
        }

        // Validate password length
        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters")
            return
        }

        // Check if email already exists
        const storedMembers = localStorage.getItem("team_members")
        let members = storedMembers ? JSON.parse(storedMembers) : []

        const existingUser = members.find((m: any) => m.email.toLowerCase() === formData.email.toLowerCase())
        
        if (existingUser) {
            setError("Email already registered. Please login instead.")
            return
        }

        // Create new user with Client role by default
        const newUser = {
            id: Math.random().toString(36).substr(2, 9),
            name: formData.name,
            email: formData.email,
            role: "Client",
            status: "Active",
            joinedAt: new Date().toLocaleDateString()
        }

        // Add to localStorage
        members.push(newUser)
        localStorage.setItem("team_members", JSON.stringify(members))

        toast.success("Account created successfully! Redirecting to login...")
        
        // Redirect to login after 1.5 seconds
        setTimeout(() => {
            router.push("/login")
        }, 1500)
    }

    return (
        <div className={cn("flex flex-col gap-4", className)} {...props}>
            <Card className="overflow-hidden p-0">
                <CardContent className="grid p-0 md:grid-cols-2">
                    <form className="p-4 md:p-6" onSubmit={handleSignup}>
                        <FieldGroup className="gap-3">
                            <div className="flex flex-col items-center gap-1 text-center">
                                <h1 className="text-xl font-bold">Create an account</h1>
                                <p className="text-muted-foreground text-sm text-balance">
                                    Sign up to start exploring land opportunities
                                </p>
                            </div>
                            <Field>
                                <FieldLabel htmlFor="name">Full Name</FieldLabel>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="John Doe"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="email">Email</FieldLabel>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="m@example.com"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="password">Password</FieldLabel>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                                />
                            </Field>
                            {error && (
                                <div className="text-sm text-destructive text-center p-2 bg-destructive/10 rounded-md">
                                    {error}
                                </div>
                            )}
                            <Field>
                                <Button type="submit" className="w-full h-9">Sign Up</Button>
                            </Field>
                            <FieldDescription className="text-center text-sm">
                                Already have an account? <a href="/login" className="text-primary hover:underline">Log in</a>
                            </FieldDescription>
                        </FieldGroup>
                    </form>
                    <div className="bg-muted relative hidden md:block">
                        <img
                            src="/catlogin.jpg"
                            alt="Construction Worker Cat"
                            className="absolute inset-0 h-full w-full object-cover"
                        />
                    </div>
                </CardContent>
            </Card>
            <FieldDescription className="px-4 text-center text-xs">
                By clicking continue, you agree to our <a href="#" className="text-primary hover:underline">Terms of Service</a>{" "}
                and <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
            </FieldDescription>
        </div>
    )
}
