"use client"

import { useState, useEffect } from "react"
import { IconTrash } from "@tabler/icons-react"
import { toast } from "sonner"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export default function BookingsPage() {
    const [requests, setRequests] = useState<any[]>([])

    useEffect(() => {
        const storedRequests = localStorage.getItem("booking_requests")
        if (storedRequests) {
            setRequests(JSON.parse(storedRequests))
        }
    }, [])

    const handleClearRequests = () => {
        setRequests([])
        localStorage.removeItem("booking_requests")
        toast.info("All booking requests cleared.")
    }

    const updateStatus = (id: string, newStatus: string) => {
        const updatedRequests = requests.map(req =>
            req.id === id ? { ...req, status: newStatus } : req
        )
        setRequests(updatedRequests)
        localStorage.setItem("booking_requests", JSON.stringify(updatedRequests))
        toast.success(`Request status updated to ${newStatus}`)
    }

    return (
        <SidebarProvider
            style={
                {
                    "--sidebar-width": "calc(var(--spacing) * 72)",
                    "--header-height": "calc(var(--spacing) * 12)",
                } as React.CSSProperties
            }
        >
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col gap-4 p-4 lg:px-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">Booking Requests</h2>
                            <p className="text-muted-foreground">
                                Manage land booking requests from clients.
                            </p>
                        </div>
                        <Button variant="destructive" onClick={handleClearRequests} disabled={requests.length === 0}>
                            <IconTrash className="mr-2 size-4" />
                            Clear Requests
                        </Button>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Plot</TableHead>
                                    <TableHead>Client Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests.length > 0 ? (
                                    requests.map((req) => (
                                        <TableRow key={req.id}>
                                            <TableCell className="font-medium">{req.plotTitle}</TableCell>
                                            <TableCell>{req.clientName}</TableCell>
                                            <TableCell>{req.email}</TableCell>
                                            <TableCell>{req.timestamp}</TableCell>
                                            <TableCell>
                                                <Badge variant={req.status === "Pending" ? "secondary" : req.status === "Approved" ? "default" : "destructive"}>
                                                    {req.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right space-x-2">
                                                {req.status === "Pending" && (
                                                    <>
                                                        <Button size="sm" onClick={() => updateStatus(req.id, "Approved")}>Approve</Button>
                                                        <Button size="sm" variant="outline" onClick={() => updateStatus(req.id, "Rejected")}>Reject</Button>
                                                    </>
                                                )}
                                                {req.status !== "Pending" && (
                                                    <span className="text-sm text-muted-foreground">
                                                        {req.status}
                                                    </span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            No booking requests found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
