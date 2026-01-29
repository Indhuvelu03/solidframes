"use client"

import { IconMapPin, IconRuler, IconCurrencyDollar, IconShieldCheck, IconClick, IconStar } from "@tabler/icons-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

const plots = [
    {
        id: 1,
        title: "Sunset Valley - Plot A1",
        location: "Beverly Hills, CA",
        size: "2,500 sq.ft",
        price: "$1,200,000",
        status: "Available",
        image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2832&auto=format&fit=crop",
    },
    {
        id: 2,
        title: "Green Meadows - Plot B4",
        location: "Austin, TX",
        size: "5,000 sq.ft",
        price: "$450,000",
        status: "Reserved",
        image: "https://images.unsplash.com/photo-1516156008625-3a9d6067fab5?q=80&w=2670&auto=format&fit=crop",
    },
    {
        id: 3,
        title: "Lakeview Heaven - Plot C2",
        location: "Lake Tahoe, NV",
        size: "3,200 sq.ft",
        price: "$850,000",
        status: "Available",
        image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=2574&auto=format&fit=crop",
    },
    {
        id: 4,
        title: "Urban Corner - Plot D1",
        location: "Seattle, WA",
        size: "1,800 sq.ft",
        price: "$950,000",
        status: "Sold",
        image: "https://images.unsplash.com/photo-1448630360428-65456885c650?q=80&w=2667&auto=format&fit=crop",
    },
    {
        id: 5,
        title: "Desert Oasis - Plot E5",
        location: "Phoenix, AZ",
        size: "10,000 sq.ft",
        price: "$300,000",
        status: "Available",
        image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2621&auto=format&fit=crop",
    },
    {
        id: 6,
        title: "Highland Heights - Plot F3",
        location: "Denver, CO",
        size: "4,500 sq.ft",
        price: "$600,000",
        status: "Available",
        image: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=2670&auto=format&fit=crop",
    },
]

export default function ClientPage() {
    const handleBuyClick = (plotTitle: string) => {
        const storedRequests = localStorage.getItem("booking_requests")
        let requests = []
        if (storedRequests) {
            requests = JSON.parse(storedRequests)
        }

        const newRequest = {
            id: Math.random().toString(36).substr(2, 9),
            plotTitle,
            clientName: "Client User",
            email: "client@example.com",
            status: "Pending",
            timestamp: new Date().toLocaleString(),
        }

        const updatedRequests = [newRequest, ...requests]
        localStorage.setItem("booking_requests", JSON.stringify(updatedRequests))

        toast.success(`Request sent for ${plotTitle}! An agent will contact you shortly.`)
    }

    const handleSubscribe = (e: React.FormEvent) => {
        e.preventDefault()
        toast.success("Subscribed to newsletter!")
    }

    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground">
            <header className="fixed top-0 left-0 right-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
                <div className="container flex h-16 items-center justify-between px-4 md:px-6">
                    <div className="flex items-center gap-2 font-bold text-xl">
                        <IconMapPin className="size-6 text-primary" />
                        <span>Land Marketplace</span>
                    </div>
                    <nav className="hidden md:flex gap-6 text-sm font-medium">
                        <a href="#" className="transition-colors hover:text-primary">Home</a>
                        <a href="#plots" className="transition-colors hover:text-primary">Featured Plots</a>
                        <a href="#features" className="transition-colors hover:text-primary">Why Us</a>
                        <a href="#contact" className="transition-colors hover:text-primary">Contact</a>
                    </nav>
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" asChild>
                            <a href="/login">Log In</a>
                        </Button>
                        <Button size="sm" asChild>
                            <a href="/signup">Get Started</a>
                        </Button>
                    </div>
                </div>
            </header>
            <main className="flex-1 pt-16">
                {/* Hero Section */}
                <section className="relative flex flex-col items-center justify-center text-center py-24 md:py-40 bg-muted/20 overflow-hidden w-full">
                    <div className="container relative z-10 flex flex-col items-center gap-8 px-4">
                        <Badge variant="outline" className="px-4 py-1.5 text-sm bg-background border-primary/20 text-primary shadow-sm">
                            Top Rated Real Estate Platform
                        </Badge>
                        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl max-w-5xl leading-tight">
                            Find Your Perfect Plot <br className="hidden sm:inline" />
                            <span className="text-primary">Build Your Future</span>
                        </h1>
                        <p className="max-w-2xl text-lg text-muted-foreground md:text-xl leading-relaxed">
                            Explore exclusive land opportunities in prime locations. Secure your piece of land today with our easy and transparent online booking process.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4">
                            <Button size="lg" className="px-8 text-lg h-12 w-full sm:w-auto shadow-lg" asChild><a href="#plots">Browse Plots</a></Button>
                            <Button size="lg" variant="outline" className="px-8 text-lg h-12 w-full sm:w-auto bg-background/50 backdrop-blur-sm" asChild><a href="#contact">Contact Agent</a></Button>
                        </div>
                    </div>
                    {/* Abstract Background Elements */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10" />
                </section>

                {/* Features Section */}
                <section id="features" className="container py-24 px-4 md:px-6 space-y-16">
                    <div className="text-center space-y-4 max-w-3xl mx-auto">
                        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Why Choose Us</h2>
                        <p className="text-muted-foreground text-lg">We provide the safest, fastest, and most transparent way to buy land in the country.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        <Card className="bg-card border-border/50 shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader>
                                <div className="p-3 w-fit rounded-lg bg-primary/10 mb-4">
                                    <IconStar className="size-8 text-primary" />
                                </div>
                                <CardTitle className="text-xl">Prime Locations</CardTitle>
                                <CardDescription className="text-base mt-2">Handpicked properties in the most rapidly developing areas with high growth potential.</CardDescription>
                            </CardHeader>
                        </Card>
                        <Card className="bg-card border-border/50 shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader>
                                <div className="p-3 w-fit rounded-lg bg-primary/10 mb-4">
                                    <IconShieldCheck className="size-8 text-primary" />
                                </div>
                                <CardTitle className="text-xl">Verified Documents</CardTitle>
                                <CardDescription className="text-base mt-2">100% legal clearance, title verification, and encumbrance checks for every single plot.</CardDescription>
                            </CardHeader>
                        </Card>
                        <Card className="bg-card border-border/50 shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader>
                                <div className="p-3 w-fit rounded-lg bg-primary/10 mb-4">
                                    <IconClick className="size-8 text-primary" />
                                </div>
                                <CardTitle className="text-xl">Instant Booking</CardTitle>
                                <CardDescription className="text-base mt-2">Book your plot online instantly with a secure token payment and get immediate confirmation.</CardDescription>
                            </CardHeader>
                        </Card>
                    </div>
                </section>

                {/* Plots Grid */}
                <section id="plots" className="bg-muted/30 py-24">
                    <div className="container px-4 md:px-6 space-y-12">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <h2 className="text-3xl font-bold tracking-tight">Featured Listings</h2>
                                <p className="text-muted-foreground text-lg">Check out our latest available properties.</p>
                            </div>
                            <Button variant="ghost" className="group">
                                View All
                                <span className="ml-2 transition-transform group-hover:translate-x-1">&rarr;</span>
                            </Button>
                        </div>
                        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                            {plots.map((plot) => (
                                <Card key={plot.id} className="group overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300 border-border/50 bg-card h-full">
                                    <div className="aspect-[4/3] w-full overflow-hidden relative">
                                        <img
                                            src={plot.image}
                                            alt={plot.title}
                                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                        <div className="absolute top-3 right-3">
                                            <Badge
                                                variant={
                                                    plot.status === "Available" ? "default" :
                                                        plot.status === "Sold" ? "secondary" : "destructive"
                                                }
                                                className="uppercase tracking-wide shadow-sm font-semibold"
                                            >
                                                {plot.status}
                                            </Badge>
                                        </div>
                                    </div>
                                    <CardHeader className="space-y-2">
                                        <CardTitle className="line-clamp-1 text-xl" title={plot.title}>{plot.title}</CardTitle>
                                        <CardDescription className="flex items-center gap-1.5 text-base">
                                            <IconMapPin className="size-4 shrink-0" />
                                            {plot.location}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="grid gap-4 flex-grow">
                                        <div className="flex items-center justify-between text-sm p-3 bg-muted/50 rounded-lg">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <IconRuler className="size-4" />
                                                <span>Size</span>
                                            </div>
                                            <span className="font-semibold text-foreground">{plot.size}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm p-3 bg-muted/50 rounded-lg">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <IconCurrencyDollar className="size-4" />
                                                <span>Price</span>
                                            </div>
                                            <span className="font-bold text-lg text-primary">{plot.price}</span>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="pt-2 pb-6">
                                        <Button
                                            className="w-full font-semibold h-11 text-base"
                                            size="lg"
                                            disabled={plot.status !== "Available"}
                                            onClick={() => handleBuyClick(plot.title)}
                                        >
                                            {plot.status === "Available" ? "Book Now" : plot.status === "Sold" ? "Sold Out" : "Reserved"}
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Newsletter */}
                <section id="contact" className="container py-24 px-4 md:px-6">
                    <div className="bg-primary text-primary-foreground rounded-3xl p-8 md:p-16 flex flex-col lg:flex-row items-center justify-between gap-10 shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />

                        <div className="space-y-4 max-w-xl relative z-10 text-center lg:text-left">
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Stay Updated on New Listings</h2>
                            <p className="text-primary-foreground/90 text-lg">Subscribe to our newsletter to receive real-time alerts for new plots, market trends, and exclusive offers.</p>
                        </div>
                        <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row w-full max-w-md items-center gap-3 relative z-10">
                            <Input
                                type="email"
                                placeholder="Enter your email"
                                className="bg-background/95 text-foreground border-none h-14 px-6 text-base shadow-lg transition-transform focus:scale-[1.02]"
                                required
                            />
                            <Button type="submit" variant="secondary" size="lg" className="h-14 px-8 font-bold text-base shadow-lg w-full sm:w-auto">Subscribe</Button>
                        </form>
                    </div>
                </section>
            </main>
            <footer className="border-t bg-muted/20 py-16 text-foreground">
                <div className="container grid gap-12 md:grid-cols-4 px-4 md:px-6">
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 font-bold text-2xl">
                            <IconMapPin className="size-7 text-primary" />
                            <span>Land Marketplace</span>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                            Building dreams from the ground up. We help you find the perfect piece of earth for your future home with trust and transparency.
                        </p>
                    </div>
                    <div className="space-y-6">
                        <h4 className="font-semibold text-lg">Quick Links</h4>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li><a href="#" className="hover:text-primary transition-colors">Home</a></li>
                            <li><a href="#plots" className="hover:text-primary transition-colors">Featured Listings</a></li>
                            <li><a href="#features" className="hover:text-primary transition-colors">Why Choose Us</a></li>
                            <li><a href="#contact" className="hover:text-primary transition-colors">Contact Support</a></li>
                        </ul>
                    </div>
                    <div className="space-y-6">
                        <h4 className="font-semibold text-lg">Legal</h4>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Cookie Policy</a></li>
                        </ul>
                    </div>
                    <div className="space-y-6">
                        <h4 className="font-semibold text-lg">Admin Access</h4>
                        <Button variant="outline" asChild className="w-full justify-start h-10 border-primary/20 hover:border-primary hover:bg-primary/5 group">
                            <a href="/login">
                                <IconShieldCheck className="mr-2 size-4 text-primary group-hover:scale-110 transition-transform" />
                                Staff Login
                            </a>
                        </Button>
                    </div>
                </div>
                <div className="container mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
                    © 2026 Land Marketplace. All rights reserved.
                </div>
            </footer>
        </div>
    )
}
